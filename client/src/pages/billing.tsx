import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import StatsCard from "@/components/dashboard/stats-card";
import { CreditCard, DollarSign, Calendar, Users, AlertTriangle, CheckCircle, Download, Plus } from "lucide-react";

interface Subscription {
  id: string;
  planName: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  studentLimit: number;
  currentStudents: number;
  monthlyPrice: number;
  billingEmail: string;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  nextBillingDate?: string;
}

interface BillingHistory {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceDate: string;
  dueDate: string;
  description: string;
  invoiceUrl?: string;
}

export default function Billing() {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/billing/subscription"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: billingHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/billing/history"],
    enabled: !!user && user.role === 'admin',
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planData: { planName: string; paymentMethod: string }) => {
      const response = await apiRequest("PUT", "/api/billing/subscription", planData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
      setIsUpgradeDialogOpen(false);
      toast({
        title: "Subscription updated",
        description: "Your subscription plan has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update subscription",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      name: "Starter",
      price: 29,
      studentLimit: 100,
      features: ["Basic messaging", "Attendance tracking", "Grade management", "Email support"],
    },
    {
      name: "Professional",
      price: 59,
      studentLimit: 300,
      features: ["All Starter features", "Advanced analytics", "Custom forms", "Priority support", "API access"],
    },
    {
      name: "Enterprise",
      price: 99,
      studentLimit: 1000,
      features: ["All Professional features", "Multi-school management", "Advanced integrations", "Dedicated support", "Custom branding"],
    },
  ];

  // Restrict access to admin only
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            Billing management is only available to school administrators.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleUpgrade = () => {
    if (!selectedPlan || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please select a plan and payment method.",
        variant: "destructive",
      });
      return;
    }
    updateSubscriptionMutation.mutate({ planName: selectedPlan, paymentMethod });
  };

  const getBillingStats = () => {
    const currentMonthInvoices = billingHistory.filter((invoice: BillingHistory) => {
      const invoiceMonth = new Date(invoice.invoiceDate).getMonth();
      const currentMonth = new Date().getMonth();
      return invoiceMonth === currentMonth;
    });

    const totalSpent = billingHistory
      .filter((invoice: BillingHistory) => invoice.status === 'paid')
      .reduce((sum: number, invoice: BillingHistory) => sum + invoice.amount, 0);

    const pendingPayments = billingHistory.filter((invoice: BillingHistory) => invoice.status === 'pending').length;

    return {
      monthlySpend: currentMonthInvoices.reduce((sum: number, invoice: BillingHistory) => sum + invoice.amount, 0),
      totalSpent,
      pendingPayments,
      nextBilling: subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A',
    };
  };

  const stats = getBillingStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your school's subscription and billing information</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
            <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Upgrade Your Plan</DialogTitle>
                  <DialogDescription>
                    Choose a plan that best fits your school's needs.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Select Plan</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            {plan.name} - {formatCurrency(plan.price)}/month ({plan.studentLimit} students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="purchase_order">Purchase Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpgrade} disabled={updateSubscriptionMutation.isPending}>
                    {updateSubscriptionMutation.isPending ? "Processing..." : "Upgrade Plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Monthly Spend"
          value={formatCurrency(stats.monthlySpend)}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={CreditCard}
          color="blue"
        />
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatsCard
          title="Next Billing"
          value={stats.nextBilling}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Current Subscription */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner w-6 h-6"></div>
            </div>
          ) : subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{subscription.planName} Plan</h3>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Price</span>
                    <span className="font-medium">{formatCurrency(subscription.monthlyPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Student Usage</span>
                    <span className="font-medium">
                      {subscription.currentStudents}/{subscription.studentLimit} students
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Billing Email</span>
                    <span className="font-medium">{subscription.billingEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium">{formatDate(subscription.startDate)}</span>
                  </div>
                  {subscription.trialEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Trial Ends</span>
                      <span className="font-medium text-blue-600">{formatDate(subscription.trialEndsAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Usage Overview</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Students</span>
                      <span className="text-sm font-medium">
                        {subscription.currentStudents}/{subscription.studentLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(subscription.currentStudents / subscription.studentLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {subscription.status === 'trial' && subscription.trialEndsAt && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-700">
                          Trial ends on {formatDate(subscription.trialEndsAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscription</h3>
              <p className="text-gray-600 mb-4">Get started with a plan that fits your school's needs.</p>
              <Button onClick={() => setIsUpgradeDialogOpen(true)}>
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(plan.price)}</p>
                  <p className="text-gray-600 text-sm">per month</p>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-3">Up to {plan.studentLimit} students</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  variant={subscription?.planName === plan.name ? "outline" : "default"}
                  disabled={subscription?.planName === plan.name}
                >
                  {subscription?.planName === plan.name ? "Current Plan" : "Select Plan"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner w-6 h-6"></div>
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
              <p className="text-gray-600">Your billing history will appear here once you have active charges.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((invoice: BillingHistory) => (
                    <tr key={invoice.id}>
                      <td>{formatDate(invoice.invoiceDate)}</td>
                      <td>{invoice.description}</td>
                      <td className="font-medium">{formatCurrency(invoice.amount)}</td>
                      <td>{getPaymentStatusBadge(invoice.status)}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              Retry Payment
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
