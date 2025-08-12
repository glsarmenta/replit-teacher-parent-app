import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, uuid, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'parent']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);
export const announcementCategoryEnum = pgEnum('announcement_category', ['general', 'events', 'urgent', 'academic']);
export const formStatusEnum = pgEnum('form_status', ['pending', 'approved', 'rejected']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'cancelled', 'trial']);

// Core Tables
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  settings: json("settings").$type<{
    timezone?: string;
    schoolHours?: { start: string; end: string };
    gradeScale?: Record<string, number>;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  principalName: text("principal_name"),
  gradeRange: text("grade_range"), // e.g., "K-5", "6-8", "9-12"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  emergencyContact: json("emergency_contact").$type<{
    name: string;
    phone: string;
    relationship: string;
  }>(),
  medicalInfo: text("medical_info"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const parentsStudents = pgTable("parents_students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  relationship: varchar("relationship", { length: 50 }).notNull(), // parent, guardian, etc.
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  subject: varchar("subject", { length: 100 }),
  room: varchar("room", { length: 50 }),
  capacity: integer("capacity"),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Feature Tables
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: announcementCategoryEnum("category").notNull(),
  priority: integer("priority").default(1).notNull(), // 1=low, 2=medium, 3=high
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const announcementAudiences = pgTable("announcement_audiences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  announcementId: uuid("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  audienceType: varchar("audience_type", { length: 50 }).notNull(), // all_parents, all_teachers, grade_specific, etc.
  audienceValue: text("audience_value"), // grade level, specific user IDs, etc.
});

export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  arrivalTime: timestamp("arrival_time"),
  notes: text("notes"),
  markedBy: uuid("marked_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title"),
  isGroup: boolean("is_group").default(false).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text").notNull(),
  attachments: json("attachments").$type<Array<{ name: string; url: string; type: string; size: number }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageReads = pgTable("message_reads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const gradeCategories = pgTable("grade_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // percentage weight in final grade
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => gradeCategories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  maxPoints: decimal("max_points", { precision: 8, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  assignedDate: timestamp("assigned_date").defaultNow().notNull(),
  instructions: text("instructions"),
  attachments: json("attachments").$type<Array<{ name: string; url: string; type: string; size: number }>>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assignmentScores = pgTable("assignment_scores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  points: decimal("points", { precision: 8, scale: 2 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
  gradedBy: uuid("graded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const formRequests = pgTable("form_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  formType: varchar("form_type", { length: 50 }).notNull(), // early_pickup, sick_leave, permission_slip
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  requestDate: timestamp("request_date"),
  endDate: timestamp("end_date"), // for multi-day requests
  status: formStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  processedBy: uuid("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const progressionSnapshots = pgTable("progression_snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  reportingPeriod: varchar("reporting_period", { length: 50 }).notNull(), // quarter_1, semester_1, etc.
  overallGrade: decimal("overall_grade", { precision: 5, scale: 2 }),
  attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 }),
  behaviorNotes: text("behavior_notes"),
  academicNotes: text("academic_notes"),
  goals: json("goals").$type<Array<{ description: string; achieved: boolean; notes?: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  studentLimit: integer("student_limit").notNull(),
  currentStudents: integer("current_students").default(0).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  billingEmail: text("billing_email").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  schools: many(schools),
  users: many(users),
  students: many(students),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  tenant: one(tenants, { fields: [schools.tenantId], references: [tenants.id] }),
  classrooms: many(classrooms),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  parentStudents: many(parentsStudents),
  teacherClassrooms: many(classrooms),
  sentMessages: many(messages),
  conversations: many(conversationParticipants),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tenant: one(tenants, { fields: [students.tenantId], references: [tenants.id] }),
  parents: many(parentsStudents),
  enrollments: many(enrollments),
  attendanceRecords: many(attendanceRecords),
  assignmentScores: many(assignmentScores),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  tenant: one(tenants, { fields: [classrooms.tenantId], references: [tenants.id] }),
  school: one(schools, { fields: [classrooms.schoolId], references: [schools.id] }),
  teacher: one(users, { fields: [classrooms.teacherId], references: [users.id] }),
  enrollments: many(enrollments),
  assignments: many(assignments),
  gradeCategories: many(gradeCategories),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  creator: one(users, { fields: [conversations.createdBy], references: [users.id] }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  tenant: one(tenants, { fields: [messages.tenantId], references: [tenants.id] }),
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  reads: many(messageReads),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClassroomSchema = createInsertSchema(classrooms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFormRequestSchema = createInsertSchema(formRequests).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Classroom = typeof classrooms.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type FormRequest = typeof formRequests.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertFormRequest = z.infer<typeof insertFormRequestSchema>;
