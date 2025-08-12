import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Eye, Edit, Trash2, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  viewCount: number;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

export default function Announcements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    category: "general",
    priority: 1,
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: typeof newAnnouncement) => {
      const response = await apiRequest("POST", "/api/announcements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsCreateDialogOpen(false);
      setNewAnnouncement({ title: "", content: "", category: "general", priority: 1 });
      toast({
        title: "Announcement created",
        description: "Your announcement has been published successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create announcement",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Announcement deleted",
        description: "The announcement has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete announcement",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const filteredAnnouncements = announcements.filter((announcement: Announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createAnnouncementMutation.mutate(newAnnouncement);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "destructive";
      case 2: return "default";
      default: return "secondary";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return "Urgent";
      case 2: return "Important";
      default: return "Normal";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "urgent": return "destructive";
      case "events": return "default";
      case "academic": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="mt-1 text-sm text-gray-600">Manage school-wide communications and updates</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="mt-4 sm:mt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                    <DialogDescription>
                      Share important information with your school community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        placeholder="Enter announcement title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        placeholder="Write your announcement content here..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newAnnouncement.category} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="events">Events</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newAnnouncement.priority.toString()} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Normal</SelectItem>
                            <SelectItem value="2">Important</SelectItem>
                            <SelectItem value="3">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAnnouncement} disabled={createAnnouncementMutation.isPending}>
                      {createAnnouncementMutation.isPending ? "Publishing..." : "Publish"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Audiences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="parents">All Parents</SelectItem>
                <SelectItem value="teachers">All Teachers</SelectItem>
                <SelectItem value="grades">Specific Grades</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "No announcements have been posted yet"}
              </p>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create First Announcement
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement: Announcement) => (
            <Card key={announcement.id} className={`${announcement.priority === 3 ? 'border-l-4 border-l-red-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2 space-x-3">
                      <Badge variant={getPriorityColor(announcement.priority)}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      <Badge variant={getCategoryColor(announcement.category)}>
                        {announcement.category}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Posted {new Date(announcement.createdAt).toLocaleDateString()} by {announcement.author?.firstName} {announcement.author?.lastName}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {announcement.viewCount} views
                        </span>
                        <span>All Parents, All Teachers</span>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            disabled={deleteAnnouncementMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredAnnouncements.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing 1 to {Math.min(10, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
