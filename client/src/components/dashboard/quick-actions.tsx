import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Megaphone, 
  UserCheck, 
  Plus, 
  MessageSquare, 
  Users,
  FileText,
  BarChart3
} from "lucide-react";

interface QuickActionsProps {
  userRole?: string;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const getQuickActions = () => {
    switch (userRole) {
      case 'admin':
        return [
          { 
            title: "Send Announcement", 
            icon: Megaphone, 
            href: "/announcements",
            color: "bg-primary-100 text-primary-600" 
          },
          { 
            title: "Manage Users", 
            icon: Users, 
            href: "/users",
            color: "bg-purple-100 text-purple-600" 
          },
          { 
            title: "View Reports", 
            icon: BarChart3, 
            href: "/progression",
            color: "bg-green-100 text-green-600" 
          },
          { 
            title: "Send Message", 
            icon: MessageSquare, 
            href: "/messages",
            color: "bg-blue-100 text-blue-600" 
          },
        ];
      
      case 'teacher':
        return [
          { 
            title: "Take Attendance", 
            icon: UserCheck, 
            href: "/attendance",
            color: "bg-green-100 text-green-600" 
          },
          { 
            title: "Create Assignment", 
            icon: Plus, 
            href: "/grades",
            color: "bg-yellow-100 text-yellow-600" 
          },
          { 
            title: "Send Message", 
            icon: MessageSquare, 
            href: "/messages",
            color: "bg-blue-100 text-blue-600" 
          },
          { 
            title: "New Announcement", 
            icon: Megaphone, 
            href: "/announcements",
            color: "bg-primary-100 text-primary-600" 
          },
        ];
      
      case 'parent':
        return [
          { 
            title: "Message Teacher", 
            icon: MessageSquare, 
            href: "/messages",
            color: "bg-blue-100 text-blue-600" 
          },
          { 
            title: "Submit Form", 
            icon: FileText, 
            href: "/forms",
            color: "bg-purple-100 text-purple-600" 
          },
          { 
            title: "View Grades", 
            icon: BarChart3, 
            href: "/grades",
            color: "bg-green-100 text-green-600" 
          },
          { 
            title: "Check Progress", 
            icon: UserCheck, 
            href: "/progression",
            color: "bg-yellow-100 text-yellow-600" 
          },
        ];
      
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button variant="ghost" className="quick-action-button">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">{action.title}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
