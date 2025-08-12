import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import StatsCard from "@/components/dashboard/stats-card";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface FormRequest {
  id: string;
  title: string;
  formType: string;
  reason: string;
  requestDate: string;
  endDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  student: {
    firstName: string;
    lastName: string;
    grade: string;
  };
  parent: {
    firstName: string;
    lastName: string;
  };
}

export default function Forms() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    formType: "early_pickup",
    reason: "",
    requestDate: "",
    endDate: "",
    studentId: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["/api/forms", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user && user.role === 'parent',
  });

  const createFormMutation = useMutation({
    mutationFn: async (formData: typeof newForm) => {
      const response = await apiRequest("POST", "/api/forms", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setIsCreateDialogOpen(false);
      setNewForm({
        title: "",
        formType: "early_pickup",
        reason: "",
        requestDate: "",
        endDate: "",
        studentId: "",
      });
      toast({
        title: "Form submitted",
        description: "Your request has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to submit form",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PUT", `/api/forms/${id}`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Form updated",
        description: "The form status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update form",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getFormStats = () => {
    const total = forms.length;
    const pending = forms.filter((f: FormRequest) => f.status === 'pending').length;
    const approved = forms.filter((f: FormRequest) => f.status === 'approved').length;
    const rejected = forms.filter((f: FormRequest) => f.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getFormStats();

  const handleCreateForm = () => {
    if (!newForm.title || !newForm.reason || !newForm.requestDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (user?.role === 'parent' && students.length > 0 && !newForm.studentId) {
      setNewForm({ ...newForm, studentId: students[0].id });
    }
    
    createFormMutation.mutate(newForm);
  };

  const handleStatusUpdate = (formId: string, status: string, adminNotes?: string) => {
    updateFormMutation.mutate({ id: formId, status, adminNotes });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case 'early_pickup':
        return 'Early Pickup';
      case 'sick_leave':
        return 'Sick Leave';
      case 'permission_slip':
        return 'Permission Slip';
      default:
        return type;
    }
  };

  const filteredForms = forms.filter((form: FormRequest) => {
    const matchesStatus = statusFilter === "all" || form.status === statusFilter;
    const matchesType = typeFilter === "all" || form.formType === typeFilter;
    return matchesStatus && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms & Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              {user?.role === 'parent' 
                ? "Submit and track your form requests"
                : "Manage and approve student form requests"
              }
            </p>
          </div>
          {user?.role === 'parent' && (
            <div className="mt-4 sm:mt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Form
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Submit New Form Request</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to submit a new request for your child.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="formType">Request Type</Label>
                      <Select value={newForm.formType} onValueChange={(value) => setNewForm({ ...newForm, formType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="early_pickup">Early Pickup</SelectItem>
                          <SelectItem value="sick_leave">Sick Leave</SelectItem>
                          <SelectItem value="permission_slip">Permission Slip</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {students.length > 0 && (
                      <div className="grid gap-2">
                        <Label htmlFor="student">Student</Label>
                        <Select value={newForm.studentId} onValueChange={(value) => setNewForm({ ...newForm, studentId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student: any) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.firstName} {student.lastName} (Grade {student.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newForm.title}
                        onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                        placeholder="Brief description of request"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
                        value={newForm.reason}
                        onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
                        placeholder="Please provide details about your request"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="requestDate">Date Needed</Label>
                        <Input
                          id="requestDate"
                          type="date"
                          value={newForm.requestDate}
                          onChange={(e) => setNewForm({ ...newForm, requestDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">End Date (if applicable)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newForm.endDate}
                          onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
                      {createFormMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="early_pickup">Early Pickup</SelectItem>
                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                <SelectItem value="permission_slip">Permission Slip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <Card>
        <CardHeader>
          <CardTitle>Form Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-600 mb-4">
                {forms.length === 0 
                  ? user?.role === 'parent' 
                    ? "You haven't submitted any forms yet"
                    : "No form requests have been submitted"
                  : "Try adjusting your filter criteria"
                }
              </p>
              {user?.role === 'parent' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Form
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form: FormRequest) => (
                <div key={form.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline">{getFormTypeLabel(form.formType)}</Badge>
                        {getStatusBadge(form.status)}
                        <span className="text-sm text-gray-600">
                          Submitted {formatDate(form.createdAt)}
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{form.title}</h4>
                      <p className="text-gray-600 mb-3">{form.reason}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Student:</span>
                          <p>{form.student.firstName} {form.student.lastName} (Grade {form.student.grade})</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date Needed:</span>
                          <p>{formatDate(form.requestDate)}</p>
                        </div>
                        {form.endDate && (
                          <div>
                            <span className="font-medium text-gray-700">End Date:</span>
                            <p>{formatDate(form.endDate)}</p>
                          </div>
                        )}
                      </div>
                      
                      {form.adminNotes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <span className="font-medium text-gray-700">Admin Notes:</span>
                          <p className="text-gray-600 mt-1">{form.adminNotes}</p>
                        </div>
                      )}
                    </div>
                    
                    {(user?.role === 'admin' || user?.role === 'teacher') && form.status === 'pending' && (
                      <div className="ml-6 flex flex-col space-y-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(form.id, 'approved')}
                          disabled={updateFormMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(form.id, 'rejected')}
                          disabled={updateFormMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
