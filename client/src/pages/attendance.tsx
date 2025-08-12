import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import StatsCard from "@/components/dashboard/stats-card";
import { CheckCircle, XCircle, Clock, Users, Download, Search } from "lucide-react";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["/api/attendance", selectedDate],
    enabled: !!user && (user.role === 'admin' || user.role === 'teacher'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      const response = await apiRequest("POST", "/api/attendance", {
        studentId,
        classroomId: "default", // In a real app, this would be the actual classroom ID
        date: new Date(selectedDate).toISOString(),
        status,
        arrivalTime: status === 'present' || status === 'late' ? new Date().toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Attendance updated",
        description: "Student attendance has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update attendance",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getAttendanceStats = () => {
    const total = students.length;
    const present = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const absent = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const late = attendanceRecords.filter((r: any) => r.status === 'late').length;
    
    return { total, present, absent, late };
  };

  const stats = getAttendanceStats();

  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.find((record: any) => record.studentId === studentId);
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    updateAttendanceMutation.mutate({ studentId, status });
  };

  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "--";
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (user?.role === 'parent') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            Attendance management is only available to administrators and teachers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage student attendance for {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="K">Kindergarten</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Present"
          value={stats.present}
          icon={CheckCircle}
          trend={`${((stats.present / stats.total) * 100).toFixed(1)}%`}
          color="green"
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={XCircle}
          trend={`${((stats.absent / stats.total) * 100).toFixed(1)}%`}
          color="red"
        />
        <StatsCard
          title="Late"
          value={stats.late}
          icon={Clock}
          trend={`${((stats.late / stats.total) * 100).toFixed(1)}%`}
          color="yellow"
        />
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Arrival Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: any) => {
                    const attendance = getStudentAttendance(student.id);
                    
                    return (
                      <tr key={student.id}>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                          </div>
                        </td>
                        <td>Grade {student.grade}</td>
                        <td>
                          {getStatusBadge(attendance?.status)}
                        </td>
                        <td>
                          {formatTime(attendance?.arrivalTime)}
                        </td>
                        <td>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant={attendance?.status === 'present' ? "default" : "outline"}
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance?.status === 'absent' ? "destructive" : "outline"}
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance?.status === 'late' ? "secondary" : "outline"}
                              onClick={() => handleAttendanceChange(student.id, 'late')}
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Late
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
