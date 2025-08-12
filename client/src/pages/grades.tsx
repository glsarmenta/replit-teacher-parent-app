import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import StatsCard from "@/components/dashboard/stats-card";
import { BarChart3, Plus, FileText, Clock, Award, TrendingUp } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  dueDate: string;
  category: string;
  submittedCount: number;
  gradedCount: number;
  totalStudents: number;
  averageScore?: number;
}

interface Grade {
  assignmentId: string;
  assignmentTitle: string;
  points: number;
  maxPoints: number;
  feedback?: string;
  gradedAt: string;
  dueDate: string;
}

export default function Grades() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For teachers/admins: Get assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/assignments", { classroomId: "default" }],
    enabled: !!user && (user.role === 'admin' || user.role === 'teacher'),
  });

  // For parents: Get student grades
  const { data: studentGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["/api/students", user?.id, "grades"],
    enabled: !!user && user.role === 'parent',
  });

  // For parents: Get students
  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user && user.role === 'parent',
  });

  const getGradeStats = () => {
    if (user?.role === 'parent') {
      const completedGrades = studentGrades.filter((g: Grade) => g.points !== null);
      const average = completedGrades.length > 0 
        ? completedGrades.reduce((sum: number, g: Grade) => sum + (g.points / g.maxPoints * 100), 0) / completedGrades.length
        : 0;
      
      return {
        totalAssignments: studentGrades.length,
        completedGrades: completedGrades.length,
        pendingGrades: studentGrades.length - completedGrades.length,
        averageGrade: average,
      };
    } else {
      const totalAssignments = assignments.length;
      const gradedAssignments = assignments.filter((a: Assignment) => a.gradedCount > 0).length;
      const pendingAssignments = assignments.filter((a: Assignment) => a.gradedCount < a.submittedCount).length;
      const classAverage = assignments.reduce((sum: number, a: Assignment) => sum + (a.averageScore || 0), 0) / (totalAssignments || 1);
      
      return {
        totalAssignments,
        gradedAssignments,
        pendingAssignments,
        classAverage,
      };
    }
  };

  const stats = getGradeStats();

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.gradedCount === assignment.totalStudents) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (assignment.gradedCount > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    } else {
      return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const matchesSubject = subjectFilter === "all" || assignment.category === subjectFilter;
    const matchesType = assignmentTypeFilter === "all"; // Would need assignment type field
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "graded" && assignment.gradedCount === assignment.totalStudents) ||
      (statusFilter === "pending" && assignment.gradedCount < assignment.totalStudents);
    
    return matchesSubject && matchesType && matchesStatus;
  });

  // Parent view
  if (user?.role === 'parent') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grades & Progress</h1>
              <p className="mt-1 text-sm text-gray-600">Monitor your child's academic performance</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Assignments"
            value={stats.totalAssignments}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={stats.completedGrades}
            icon={Award}
            color="green"
          />
          <StatsCard
            title="Pending Grades"
            value={stats.pendingGrades}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Overall Average"
            value={`${stats.averageGrade.toFixed(1)}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Student Grades */}
        {students.map((student: any) => (
          <Card key={student.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{student.firstName} {student.lastName}</span>
                <Badge variant="secondary">Grade {student.grade}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentGrades.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grades available</h3>
                    <p className="text-gray-600">Grades will appear here once assignments are completed and graded.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Due Date</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentGrades.map((grade: Grade) => {
                          const percentage = grade.points ? (grade.points / grade.maxPoints * 100) : 0;
                          
                          return (
                            <tr key={grade.assignmentId}>
                              <td>
                                <div>
                                  <p className="font-medium text-gray-900">{grade.assignmentTitle}</p>
                                </div>
                              </td>
                              <td>{formatDate(grade.dueDate)}</td>
                              <td>
                                {grade.points !== null ? (
                                  <span>{grade.points}/{grade.maxPoints}</span>
                                ) : (
                                  <Badge variant="outline">Not Graded</Badge>
                                )}
                              </td>
                              <td>
                                {grade.points !== null ? (
                                  <span className={`font-medium ${getGradeColor(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">--</span>
                                )}
                              </td>
                              <td>
                                <p className="text-sm text-gray-600 max-w-xs truncate">
                                  {grade.feedback || "No feedback yet"}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Teacher/Admin view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage assignments and track student progress</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline">
              Export Grades
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Assignment
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Assignments"
          value={stats.totalAssignments}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Graded Assignments"
          value={stats.gradedAssignments}
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Pending Grades"
          value={stats.pendingAssignments}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Class Average"
          value={`${stats.classAverage.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="english">English Language Arts</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="social-studies">Social Studies</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assignmentTypeFilter} onValueChange={setAssignmentTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="graded">Fully Graded</SelectItem>
                <SelectItem value="pending">Pending Grades</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600 mb-4">
                {assignments.length === 0 
                  ? "Create your first assignment to get started"
                  : "Try adjusting your filter criteria"
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment: Assignment) => (
                <div key={assignment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                        {getStatusBadge(assignment)}
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                        <span>Max Points: {assignment.maxPoints}</span>
                        <span>Category: {assignment.category}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            Graded: {assignment.gradedCount}/{assignment.submittedCount} submitted
                          </span>
                          {assignment.averageScore && (
                            <span className="text-sm font-medium text-gray-900">
                              Average: {assignment.averageScore.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <Progress 
                          value={(assignment.gradedCount / assignment.submittedCount) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    <div className="ml-6 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Grade Submissions
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
