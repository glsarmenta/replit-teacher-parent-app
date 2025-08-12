import { 
  type User, 
  type InsertUser, 
  type Tenant, 
  type InsertTenant,
  type Student,
  type InsertStudent,
  type Classroom,
  type InsertClassroom,
  type Announcement,
  type InsertAnnouncement,
  type AttendanceRecord,
  type InsertAttendance,
  type Conversation,
  type Message,
  type InsertMessage,
  type Assignment,
  type InsertAssignment,
  type FormRequest,
  type InsertFormRequest,
  users,
  tenants,
  students,
  classrooms,
  announcements,
  attendanceRecords,
  conversations,
  messages,
  assignments,
  formRequests,
  conversationParticipants,
  parentsStudents,
  enrollments,
  announcementAudiences,
  assignmentScores,
  auditLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  getUsersByRole(role: User['role'], tenantId: string): Promise<User[]>;

  // Tenant management
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Student management
  getStudent(id: string, tenantId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsByParent(parentId: string, tenantId: string): Promise<Student[]>;
  getStudentsByClassroom(classroomId: string, tenantId: string): Promise<Student[]>;

  // Classroom management
  getClassroom(id: string, tenantId: string): Promise<Classroom | undefined>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  getClassroomsByTeacher(teacherId: string, tenantId: string): Promise<Classroom[]>;

  // Announcements
  getAnnouncements(tenantId: string, limit?: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>, tenantId: string): Promise<Announcement>;
  deleteAnnouncement(id: string, tenantId: string): Promise<void>;

  // Attendance
  getAttendanceByDate(date: string, tenantId: string): Promise<AttendanceRecord[]>;
  getAttendanceByStudent(studentId: string, tenantId: string): Promise<AttendanceRecord[]>;
  createAttendanceRecord(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, attendance: Partial<InsertAttendance>, tenantId: string): Promise<AttendanceRecord>;

  // Messaging
  getConversationsByUser(userId: string, tenantId: string): Promise<Conversation[]>;
  createConversation(title: string, createdBy: string, tenantId: string, participantIds: string[]): Promise<Conversation>;
  getMessagesByConversation(conversationId: string, tenantId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Assignments and Grades
  getAssignmentsByClassroom(classroomId: string, tenantId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getGradesByStudent(studentId: string, tenantId: string): Promise<any[]>;

  // Forms
  getFormRequests(tenantId: string, status?: string): Promise<FormRequest[]>;
  createFormRequest(formRequest: InsertFormRequest): Promise<FormRequest>;
  updateFormRequest(id: string, formRequest: Partial<InsertFormRequest>, tenantId: string): Promise<FormRequest>;

  // Dashboard stats
  getDashboardStats(tenantId: string): Promise<{
    totalStudents: number;
    presentToday: number;
    pendingForms: number;
    unreadMessages: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByRole(role: User['role'], tenantId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, role), eq(users.tenantId, tenantId)));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async getStudent(id: string, tenantId: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.tenantId, tenantId)));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async getStudentsByParent(parentId: string, tenantId: string): Promise<Student[]> {
    return await db
      .select({
        id: students.id,
        tenantId: students.tenantId,
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        dateOfBirth: students.dateOfBirth,
        grade: students.grade,
        emergencyContact: students.emergencyContact,
        medicalInfo: students.medicalInfo,
        isActive: students.isActive,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(parentsStudents, eq(students.id, parentsStudents.studentId))
      .where(and(
        eq(parentsStudents.parentId, parentId),
        eq(students.tenantId, tenantId)
      ));
  }

  async getStudentsByClassroom(classroomId: string, tenantId: string): Promise<Student[]> {
    return await db
      .select({
        id: students.id,
        tenantId: students.tenantId,
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        dateOfBirth: students.dateOfBirth,
        grade: students.grade,
        emergencyContact: students.emergencyContact,
        medicalInfo: students.medicalInfo,
        isActive: students.isActive,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(enrollments, eq(students.id, enrollments.studentId))
      .where(and(
        eq(enrollments.classroomId, classroomId),
        eq(students.tenantId, tenantId),
        eq(enrollments.isActive, true)
      ));
  }

  async getClassroom(id: string, tenantId: string): Promise<Classroom | undefined> {
    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(and(eq(classrooms.id, id), eq(classrooms.tenantId, tenantId)));
    return classroom || undefined;
  }

  async createClassroom(insertClassroom: InsertClassroom): Promise<Classroom> {
    const [classroom] = await db
      .insert(classrooms)
      .values(insertClassroom)
      .returning();
    return classroom;
  }

  async getClassroomsByTeacher(teacherId: string, tenantId: string): Promise<Classroom[]> {
    return await db
      .select()
      .from(classrooms)
      .where(and(
        eq(classrooms.teacherId, teacherId),
        eq(classrooms.tenantId, tenantId),
        eq(classrooms.isActive, true)
      ));
  }

  async getAnnouncements(tenantId: string, limit: number = 50): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(and(eq(announcements.tenantId, tenantId), eq(announcements.isActive, true)))
      .orderBy(desc(announcements.createdAt))
      .limit(limit);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(insertAnnouncement)
      .returning();
    return announcement;
  }

  async updateAnnouncement(id: string, updateData: Partial<InsertAnnouncement>, tenantId: string): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(announcements.id, id), eq(announcements.tenantId, tenantId)))
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: string, tenantId: string): Promise<void> {
    await db
      .update(announcements)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(announcements.id, id), eq(announcements.tenantId, tenantId)));
  }

  async getAttendanceByDate(date: string, tenantId: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.tenantId, tenantId),
        sql`DATE(${attendanceRecords.date}) = ${date}`
      ))
      .orderBy(attendanceRecords.arrivalTime);
  }

  async getAttendanceByStudent(studentId: string, tenantId: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.studentId, studentId),
        eq(attendanceRecords.tenantId, tenantId)
      ))
      .orderBy(desc(attendanceRecords.date));
  }

  async createAttendanceRecord(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const [attendance] = await db
      .insert(attendanceRecords)
      .values(insertAttendance)
      .returning();
    return attendance;
  }

  async updateAttendanceRecord(id: string, updateData: Partial<InsertAttendance>, tenantId: string): Promise<AttendanceRecord> {
    const [attendance] = await db
      .update(attendanceRecords)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(attendanceRecords.id, id), eq(attendanceRecords.tenantId, tenantId)))
      .returning();
    return attendance;
  }

  async getConversationsByUser(userId: string, tenantId: string): Promise<Conversation[]> {
    return await db
      .select({
        id: conversations.id,
        tenantId: conversations.tenantId,
        title: conversations.title,
        isGroup: conversations.isGroup,
        createdBy: conversations.createdBy,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(and(
        eq(conversationParticipants.userId, userId),
        eq(conversations.tenantId, tenantId),
        eq(conversationParticipants.isActive, true)
      ))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(title: string, createdBy: string, tenantId: string, participantIds: string[]): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        title,
        createdBy,
        tenantId,
        isGroup: participantIds.length > 2,
      })
      .returning();

    // Add participants
    const participantData = participantIds.map(userId => ({
      conversationId: conversation.id,
      userId,
      tenantId,
    }));

    await db.insert(conversationParticipants).values(participantData);

    return conversation;
  }

  async getMessagesByConversation(conversationId: string, tenantId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.tenantId, tenantId)
      ))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getAssignmentsByClassroom(classroomId: string, tenantId: string): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.classroomId, classroomId),
        eq(assignments.tenantId, tenantId),
        eq(assignments.isActive, true)
      ))
      .orderBy(desc(assignments.dueDate));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async getGradesByStudent(studentId: string, tenantId: string): Promise<any[]> {
    return await db
      .select({
        assignmentId: assignmentScores.assignmentId,
        assignmentTitle: assignments.title,
        points: assignmentScores.points,
        maxPoints: assignments.maxPoints,
        feedback: assignmentScores.feedback,
        gradedAt: assignmentScores.gradedAt,
        dueDate: assignments.dueDate,
      })
      .from(assignmentScores)
      .innerJoin(assignments, eq(assignmentScores.assignmentId, assignments.id))
      .where(and(
        eq(assignmentScores.studentId, studentId),
        eq(assignmentScores.tenantId, tenantId)
      ))
      .orderBy(desc(assignments.dueDate));
  }

  async getFormRequests(tenantId: string, status?: string): Promise<FormRequest[]> {
    const conditions = [eq(formRequests.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(formRequests.status, status as any));
    }

    return await db
      .select()
      .from(formRequests)
      .where(and(...conditions))
      .orderBy(desc(formRequests.createdAt));
  }

  async createFormRequest(insertFormRequest: InsertFormRequest): Promise<FormRequest> {
    const [formRequest] = await db
      .insert(formRequests)
      .values(insertFormRequest)
      .returning();
    return formRequest;
  }

  async updateFormRequest(id: string, updateData: Partial<InsertFormRequest>, tenantId: string): Promise<FormRequest> {
    const [formRequest] = await db
      .update(formRequests)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(formRequests.id, id), eq(formRequests.tenantId, tenantId)))
      .returning();
    return formRequest;
  }

  async getDashboardStats(tenantId: string): Promise<{
    totalStudents: number;
    presentToday: number;
    pendingForms: number;
    unreadMessages: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(students)
      .where(and(eq(students.tenantId, tenantId), eq(students.isActive, true)));

    const [presentTodayResult] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.tenantId, tenantId),
        eq(attendanceRecords.status, 'present'),
        sql`DATE(${attendanceRecords.date}) = ${today}`
      ));

    const [pendingFormsResult] = await db
      .select({ count: count() })
      .from(formRequests)
      .where(and(
        eq(formRequests.tenantId, tenantId),
        eq(formRequests.status, 'pending')
      ));

    return {
      totalStudents: totalStudentsResult.count,
      presentToday: presentTodayResult.count,
      pendingForms: pendingFormsResult.count,
      unreadMessages: 0, // TODO: Implement unread message count
    };
  }
}

export const storage = new DatabaseStorage();
