import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertAnnouncementSchema, insertAttendanceSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Tenant middleware
const extractTenant = async (req: any, res: any, next: any) => {
  const tenantSubdomain = req.headers['x-tenant'] || req.query.tenant;
  
  if (!tenantSubdomain) {
    return res.status(400).json({ error: 'Tenant identifier required' });
  }

  try {
    const tenant = await storage.getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tenant' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      // Broadcast to all connected clients (in production, implement proper room management)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(message);
        }
      });
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Auth routes
  app.post('/api/auth/login', extractTenant, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email, req.tenant.id);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/register', extractTenant, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email, req.tenant.id);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        tenantId: req.tenant.id,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Protected routes
  app.use('/api', authenticateToken, extractTenant);

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenant.id);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Announcements
  app.get('/api/announcements', async (req: any, res) => {
    try {
      const announcements = await storage.getAnnouncements(req.tenant.id);
      res.json(announcements);
    } catch (error) {
      console.error('Announcements fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/announcements', async (req: any, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
        authorId: req.user.userId,
      });

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Announcement creation error:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.put('/api/announcements/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const announcement = await storage.updateAnnouncement(id, updateData, req.tenant.id);
      res.json(announcement);
    } catch (error) {
      console.error('Announcement update error:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  app.delete('/api/announcements/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id, req.tenant.id);
      res.status(204).send();
    } catch (error) {
      console.error('Announcement deletion error:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // Attendance
  app.get('/api/attendance', async (req: any, res) => {
    try {
      const { date } = req.query;
      const attendanceRecords = await storage.getAttendanceByDate(date || new Date().toISOString().split('T')[0], req.tenant.id);
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Attendance fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  });

  app.post('/api/attendance', async (req: any, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
        markedBy: req.user.userId,
      });

      const attendance = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error('Attendance creation error:', error);
      res.status(500).json({ error: 'Failed to create attendance record' });
    }
  });

  // Students
  app.get('/api/students', async (req: any, res) => {
    try {
      let students;
      
      if (req.user.role === 'parent') {
        students = await storage.getStudentsByParent(req.user.userId, req.tenant.id);
      } else if (req.user.role === 'teacher') {
        // Get students from teacher's classrooms
        const classrooms = await storage.getClassroomsByTeacher(req.user.userId, req.tenant.id);
        students = [];
        for (const classroom of classrooms) {
          const classroomStudents = await storage.getStudentsByClassroom(classroom.id, req.tenant.id);
          students.push(...classroomStudents);
        }
      } else {
        // Admin can see all students - would need a getAllStudents method
        students = [];
      }

      res.json(students);
    } catch (error) {
      console.error('Students fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Messaging
  app.get('/api/conversations', async (req: any, res) => {
    try {
      const conversations = await storage.getConversationsByUser(req.user.userId, req.tenant.id);
      res.json(conversations);
    } catch (error) {
      console.error('Conversations fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', async (req: any, res) => {
    try {
      const { title, participantIds } = req.body;
      const allParticipants = [req.user.userId, ...participantIds];
      
      const conversation = await storage.createConversation(
        title,
        req.user.userId,
        req.tenant.id,
        allParticipants
      );
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Conversation creation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/:id/messages', async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id, req.tenant.id);
      res.json(messages);
    } catch (error) {
      console.error('Messages fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', async (req: any, res) => {
    try {
      const { id } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId: id,
        senderId: req.user.userId,
        tenantId: req.tenant.id,
      });

      const message = await storage.createMessage(messageData);
      
      // Broadcast message via WebSocket
      const messagePayload = JSON.stringify({
        type: 'new_message',
        data: message,
      });
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(messagePayload);
        }
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Message creation error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Assignments and Grades
  app.get('/api/assignments', async (req: any, res) => {
    try {
      const { classroomId } = req.query;
      
      if (!classroomId) {
        return res.status(400).json({ error: 'Classroom ID required' });
      }

      const assignments = await storage.getAssignmentsByClassroom(classroomId as string, req.tenant.id);
      res.json(assignments);
    } catch (error) {
      console.error('Assignments fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });

  app.get('/api/students/:id/grades', async (req: any, res) => {
    try {
      const { id } = req.params;
      const grades = await storage.getGradesByStudent(id, req.tenant.id);
      res.json(grades);
    } catch (error) {
      console.error('Grades fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch grades' });
    }
  });

  // Forms
  app.get('/api/forms', async (req: any, res) => {
    try {
      const { status } = req.query;
      const forms = await storage.getFormRequests(req.tenant.id, status as string);
      res.json(forms);
    } catch (error) {
      console.error('Forms fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch forms' });
    }
  });

  app.post('/api/forms', async (req: any, res) => {
    try {
      const formData = {
        ...req.body,
        tenantId: req.tenant.id,
        parentId: req.user.userId,
      };

      const form = await storage.createFormRequest(formData);
      res.status(201).json(form);
    } catch (error) {
      console.error('Form creation error:', error);
      res.status(500).json({ error: 'Failed to create form' });
    }
  });

  app.put('/api/forms/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        processedBy: req.user.userId,
        processedAt: new Date(),
      };

      const form = await storage.updateFormRequest(id, updateData, req.tenant.id);
      res.json(form);
    } catch (error) {
      console.error('Form update error:', error);
      res.status(500).json({ error: 'Failed to update form' });
    }
  });

  // Users management
  app.get('/api/users', async (req: any, res) => {
    try {
      const { role } = req.query;
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const users = await storage.getUsersByRole(role as any, req.tenant.id);
      res.json(users);
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  return httpServer;
}
