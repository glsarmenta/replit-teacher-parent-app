import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Megaphone, 
  Users, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Trophy,
  CreditCard,
  Settings,
  UserCheck
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Announcements", 
      href: "/announcements", 
      icon: Megaphone, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Attendance", 
      href: "/attendance", 
      icon: UserCheck, 
      roles: ["admin", "teacher"] 
    },
    { 
      name: "Messages", 
      href: "/messages", 
      icon: MessageSquare, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Grades", 
      href: "/grades", 
      icon: BarChart3, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Forms", 
      href: "/forms", 
      icon: FileText, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Progress", 
      href: "/progression", 
      icon: Trophy, 
      roles: ["admin", "teacher", "parent"] 
    },
    { 
      name: "Users", 
      href: "/users", 
      icon: Users, 
      roles: ["admin"] 
    },
    { 
      name: "Billing", 
      href: "/billing", 
      icon: CreditCard, 
      roles: ["admin"] 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings, 
      roles: ["admin", "teacher", "parent"] 
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    user ? item.roles.includes(user.role) : false
  );

  const isActive = (href: string) => location === href;

  return (
    <div className={cn("flex h-full w-64 flex-col bg-sidebar border-r", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Navigation</h2>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {filteredNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive(item.href) && "bg-sidebar-primary text-sidebar-primary-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
