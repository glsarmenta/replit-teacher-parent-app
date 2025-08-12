import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
  className?: string;
}

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  yellow: "bg-yellow-100 text-yellow-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
};

const trendColorMap = {
  blue: "text-blue-600",
  green: "text-green-600",
  yellow: "text-yellow-600",
  purple: "text-purple-600",
  red: "text-red-600",
};

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("stat-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("stat-card-icon", colorMap[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={cn("text-sm", trendColorMap[color])}>
                {trend}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
