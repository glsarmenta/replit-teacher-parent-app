import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import StatsCard from "@/components/dashboard/stats-card";
import { TrendingUp, Award, Target, BookOpen, BarChart3, Users, Download, Calendar } from "lucide-react";

interface ProgressSnapshot {
  id: string;
  reportingPeriod: string;
  overallGrade: number;
  attendanceRate: number;
  behaviorNotes: string;
  academicNotes: string;
  goals: Array<{
    description: string;
    achieved: boolean;
    notes?: string;
  }>;
  createdAt: string;
}

interface StudentProgress {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string;
  };
  currentGPA: number;
  attendanceRate: number;
  completedAssignments: number;
  totalAssignments: number;
  behaviorScore: number;
  snapshots: ProgressSnapshot[];
}

export default function Progression() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { user } = useAuth();

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ["/api/progression", selectedPeriod],
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user && user.role === 'parent',
  });

  const getProgressStats = () => {
    if (user?.role === 'parent') {
      // For parents, show their children's progress
      const totalStudents = students.length;
      const onTrack = students.filter((s: any) => (s.currentGPA || 0) >= 3.0).length;
      const needsAttention = students.filter((s: any) => (s.currentGPA || 0) < 2.5).length;
      const avgAttendance = students.reduce((sum: number, s: any) => sum + (s.attendanceRate || 0), 0) / (totalStudents || 1);

      return {
        totalStudents,
        onTrack,
        needsAttention,
        avgAttendance: avgAttendance.toFixed(1),
      };
    } else {
      // For teachers/admins, show class-wide statistics
      const totalStudents = progressData.length;
      const onTrack = progressData.filter((p: StudentProgress) => p.currentGPA >= 3.0).length;
      const needsAttention = progressData.filter((p: StudentProgress) => p.currentGPA < 2.5).length;
      const avgAttendance = progressData.reduce((sum: number, p: StudentProgress) => sum + p.attendanceRate, 0) / (totalStudents || 1);

      return {
        totalStudents,
        onTrack,
        needsAttention,
        avgAttendance: avgAttendance.toFixed(1),
      };
    }
  };

  const stats = getProgressStats();

  const getGradeColor = (grade: number) => {
    if (grade >= 3.5) return "text-green-600";
    if (grade >= 3.0) return "text-blue-600";
    if (grade >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", color: "bg-green-500" };
    if (percentage >= 80) return { label: "Good", color: "bg-blue-500" };
    if (percentage >= 70) return { label: "Satisfactory", color: "bg-yellow-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredProgressData = progressData.filter((progress: StudentProgress) => {
    if (selectedStudent !== "all" && progress.student.id !== selectedStudent) return false;
    // Additional filtering logic could be added here for subjects
    return true;
  });

  // Parent view - show children's progress
  if (user?.role === 'parent') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Progress</h1>
              <p className="mt-1 text-sm text-gray-600">Track your child's academic journey and milestones</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Your Children"
            value={stats.totalStudents}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="On Track"
            value={stats.onTrack}
            icon={Target}
            color="green"
          />
          <StatsCard
            title="Need Attention"
            value={stats.needsAttention}
            icon={Award}
            color="red"
          />
          <StatsCard
            title="Avg Attendance"
            value={`${stats.avgAttendance}%`}
            icon={Calendar}
            color="purple"
          />
        </div>

        {/* Student Progress Cards */}
        <div className="space-y-6">
          {students.map((student: any) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <span>{student.firstName} {student.lastName}</span>
                    <Badge variant="secondary">Grade {student.grade}</Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getGradeColor(student.currentGPA || 0)}`}>
                        {student.currentGPA ? student.currentGPA.toFixed(2) : "N/A"}
                      </p>
                      <p className="text-xs text-gray-600">Current GPA</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Academic Performance */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Academic Performance</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Overall Progress</span>
                          <span className="text-sm font-medium">{((student.completedAssignments || 0) / (student.totalAssignments || 1) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(student.completedAssignments || 0) / (student.totalAssignments || 1) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Attendance Rate</span>
                          <span className="text-sm font-medium">{student.attendanceRate || 0}%</span>
                        </div>
                        <Progress value={student.attendanceRate || 0} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Milestones */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Milestones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Completed Math Unit 3</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Reading Level Advanced</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Perfect Attendance Week</span>
                      </div>
                    </div>
                  </div>

                  {/* Behavior & Goals */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Behavior & Goals</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Behavior Score</span>
                        <Badge variant={student.behaviorScore >= 8 ? "default" : "secondary"}>
                          {student.behaviorScore || 0}/10
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Current Goals:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Improve math problem solving</li>
                          <li>Read 20 minutes daily</li>
                          <li>Complete homework on time</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Teacher/Admin view - show class progress
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Progress Tracking</h1>
            <p className="mt-1 text-sm text-gray-600">Monitor student academic progress and milestones</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="On Track"
          value={stats.onTrack}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Need Attention"
          value={stats.needsAttention}
          icon={Award}
          color="red"
        />
        <StatsCard
          title="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Quarter</SelectItem>
                <SelectItem value="q1">Quarter 1</SelectItem>
                <SelectItem value="q2">Quarter 2</SelectItem>
                <SelectItem value="q3">Quarter 3</SelectItem>
                <SelectItem value="q4">Quarter 4</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {progressData.map((progress: StudentProgress) => (
                  <SelectItem key={progress.student.id} value={progress.student.id}>
                    {progress.student.firstName} {progress.student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Class Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner w-8 h-8"></div>
                </div>
              ) : filteredProgressData.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data available</h3>
                  <p className="text-gray-600">Progress data will appear here once students complete assignments and assessments.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Current GPA</th>
                        <th>Attendance</th>
                        <th>Assignments</th>
                        <th>Behavior</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProgressData.map((progress: StudentProgress) => {
                        const progressLevel = getProgressLevel((progress.completedAssignments / progress.totalAssignments) * 100);
                        
                        return (
                          <tr key={progress.student.id}>
                            <td>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {progress.student.firstName} {progress.student.lastName}
                                </p>
                                <p className="text-sm text-gray-600">Grade {progress.student.grade}</p>
                              </div>
                            </td>
                            <td>
                              <span className={`font-medium ${getGradeColor(progress.currentGPA)}`}>
                                {progress.currentGPA.toFixed(2)}
                              </span>
                            </td>
                            <td>{progress.attendanceRate.toFixed(1)}%</td>
                            <td>
                              <span>{progress.completedAssignments}/{progress.totalAssignments}</span>
                              <div className="w-20 mt-1">
                                <Progress value={(progress.completedAssignments / progress.totalAssignments) * 100} className="h-1" />
                              </div>
                            </td>
                            <td>
                              <Badge variant={progress.behaviorScore >= 8 ? "default" : "secondary"}>
                                {progress.behaviorScore}/10
                              </Badge>
                            </td>
                            <td>
                              <Badge className={progressLevel.color}>
                                {progressLevel.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual">
          <div className="space-y-6">
            {filteredProgressData.map((progress: StudentProgress) => (
              <Card key={progress.student.id}>
                <CardHeader>
                  <CardTitle>
                    {progress.student.firstName} {progress.student.lastName} - Grade {progress.student.grade}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Academic Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current GPA</span>
                          <span className={`font-medium ${getGradeColor(progress.currentGPA)}`}>
                            {progress.currentGPA.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Attendance Rate</span>
                          <span className="font-medium">{progress.attendanceRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Assignment Completion</span>
                          <span className="font-medium">
                            {progress.completedAssignments}/{progress.totalAssignments}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Recent Snapshots</h4>
                      <div className="space-y-2">
                        {progress.snapshots.slice(0, 3).map((snapshot: ProgressSnapshot) => (
                          <div key={snapshot.id} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">{snapshot.reportingPeriod}</span>
                              <span className="font-medium">{snapshot.overallGrade.toFixed(1)}%</span>
                            </div>
                            {snapshot.academicNotes && (
                              <p className="text-gray-500 text-xs mt-1 truncate">{snapshot.academicNotes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Analytics charts would be implemented here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                  <p>Trend analysis would be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
