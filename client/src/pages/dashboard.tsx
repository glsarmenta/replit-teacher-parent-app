import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import { useAuth } from "@/hooks/use-auth";
import { Users, CheckCircle, Clock, MessageSquare, AlertTriangle, FileText } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user,
  });

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin':
        return `Welcome back, ${user.firstName}!`;
      case 'teacher':
        return `Good ${getTimeOfDay()}, ${user.firstName}!`;
      case 'parent':
        return `Hello, ${user.firstName}!`;
      default:
        return "Welcome to ESchool!";
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getDashboardTitle()}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'admin' && "Here's what's happening at your school today."}
          {user?.role === 'teacher' && "Ready to make today amazing for your students?"}
          {user?.role === 'parent' && "Stay connected with your child's education."}
        </p>
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Lincoln Elementary School
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          trend={user?.role === 'admin' ? "+5 this month" : undefined}
          color="blue"
        />
        <StatsCard
          title="Present Today"
          value={stats?.presentToday || 0}
          icon={CheckCircle}
          trend={stats ? `${((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}%` : undefined}
          color="green"
        />
        <StatsCard
          title={user?.role === 'parent' ? "Unread Messages" : "Pending Forms"}
          value={user?.role === 'parent' ? stats?.unreadMessages || 0 : stats?.pendingForms || 0}
          icon={user?.role === 'parent' ? MessageSquare : FileText}
          color="yellow"
        />
        <StatsCard
          title={user?.role === 'admin' ? "Active Teachers" : user?.role === 'teacher' ? "My Classes" : "Children"}
          value={user?.role === 'admin' ? 24 : user?.role === 'teacher' ? 3 : 2}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Announcements</CardTitle>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements?.slice(0, 3).map((announcement: any) => (
                <div key={announcement.id} className="flex items-start space-x-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    announcement.priority === 3 ? 'bg-red-500' :
                    announcement.priority === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{announcement.title}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.category}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>No announcements available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Overview - Admin/Teacher Only */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attendance Overview</CardTitle>
                  <Button variant="ghost" size="sm">
                    View details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats ? `${((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}%` : '0%'}
                  </span>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    +2.1% from last week
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats?.presentToday || 0} students
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats ? stats.totalStudents - stats.presentToday : 0} students
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Late Arrivals</span>
                    <span className="text-sm font-medium text-gray-900">12 students</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parent-specific: Child Progress */}
          {user?.role === 'parent' && (
            <Card>
              <CardHeader>
                <CardTitle>Children's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Emma Johnson</h4>
                      <p className="text-sm text-gray-600">Grade 3A • Mrs. Smith</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">87%</p>
                      <p className="text-xs text-gray-500">Current Average</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Michael Johnson</h4>
                      <p className="text-sm text-gray-600">Grade 1B • Mr. Davis</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">92%</p>
                      <p className="text-xs text-gray-500">Current Average</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Quick Actions and Activity */}
        <div className="space-y-6">
          <QuickActions userRole={user?.role} />

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">SM</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Sarah Miller marked attendance for Grade 3A</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">JW</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">John Wilson sent a message to all parents</p>
                  <p className="text-xs text-gray-500">12 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">LB</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Lisa Brown approved early pickup request</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
