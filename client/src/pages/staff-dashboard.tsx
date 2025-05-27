import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserRoundCheck, 
  Book, 
  Users, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  RotateCcw, 
  CheckCircle,
  BarChart3,
  Calendar,
  FileText,
  UserPlus,
  HandHeart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BookWithDetails, LoanWithDetails, UserWithLoans, Author, Publisher } from "@shared/schema";

const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  isbn: z.string().optional(),
  publicationYear: z.number().optional(),
  genre: z.string().optional(),
  authorId: z.number().optional(),
  publisherId: z.number().optional(),
  totalCopies: z.number().min(1, "Must have at least 1 copy"),
  availableCopies: z.number().min(0, "Available copies cannot be negative"),
});

const authorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nationality: z.string().optional(),
});

const publisherFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

const loanFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  bookId: z.number().min(1, "Book is required"),
  loanDate: z.string().min(1, "Loan date is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: user?.role === 'staff',
  });

  // Fetch books with filters
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ["/api/books", { 
      search: searchQuery, 
      ...selectedFilters,
      page: currentPage,
      limit: 20
    }],
    enabled: user?.role === 'staff',
  });

  // Fetch loans
  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans", selectedFilters, currentPage],
    enabled: user?.role === 'staff',
  });

  // Fetch members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/members", { 
      search: searchQuery,
      ...selectedFilters,
      page: currentPage,
      limit: 20
    }],
    enabled: user?.role === 'staff' && activeSection === 'members',
  });

  // Fetch authors and publishers for forms
  const { data: authors } = useQuery({
    queryKey: ["/api/authors"],
    enabled: user?.role === 'staff',
  });

  const { data: publishers } = useQuery({
    queryKey: ["/api/publishers"],
    enabled: user?.role === 'staff',
  });

  // Fetch reports data
  const { data: popularBooks } = useQuery({
    queryKey: ["/api/reports/popular-books"],
    enabled: user?.role === 'staff' && activeSection === 'reports',
  });

  const { data: overdueLoans } = useQuery({
    queryKey: ["/api/reports/overdue-loans"],
    enabled: user?.role === 'staff' && activeSection === 'reports',
  });

  // Book mutations
  const createBookMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/books", data),
    onSuccess: () => {
      toast({ title: "Book created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create book", description: error.message, variant: "destructive" });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/books/${id}`, data),
    onSuccess: () => {
      toast({ title: "Book updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update book", description: error.message, variant: "destructive" });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/books/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Book deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete book", description: error.message, variant: "destructive" });
    },
  });

  // Loan mutations
  const createLoanMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/loans", data),
    onSuccess: () => {
      toast({ title: "Loan created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create loan", description: error.message, variant: "destructive" });
    },
  });

  const returnBookMutation = useMutation({
    mutationFn: async (loanId: number) => apiRequest("POST", `/api/loans/${loanId}/return`, {}),
    onSuccess: () => {
      toast({ title: "Book returned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to return book", description: error.message, variant: "destructive" });
    },
  });

  const renewLoanMutation = useMutation({
    mutationFn: async (loanId: number) => apiRequest("POST", `/api/loans/${loanId}/renew`, {}),
    onSuccess: () => {
      toast({ title: "Loan renewed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to renew loan", description: error.message, variant: "destructive" });
    },
  });

  // Author mutations
  const createAuthorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/authors", data),
    onSuccess: () => {
      toast({ title: "Author created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create author", description: error.message, variant: "destructive" });
    },
  });

  // Publisher mutations
  const createPublisherMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/publishers", data),
    onSuccess: () => {
      toast({ title: "Publisher created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/publishers"] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create publisher", description: error.message, variant: "destructive" });
    },
  });

  // Member mutations
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/members/${id}`, data),
    onSuccess: () => {
      toast({ title: "Member updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update member", description: error.message, variant: "destructive" });
    },
  });

  const deactivateMemberMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/members/${id}/deactivate`, {}),
    onSuccess: () => {
      toast({ title: "Member deactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to deactivate member", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Form components
  const BookForm = ({ book, onSubmit }: { book?: BookWithDetails; onSubmit: (data: any) => void }) => {
    const form = useForm({
      resolver: zodResolver(bookFormSchema),
      defaultValues: {
        title: book?.title || "",
        isbn: book?.isbn || "",
        publicationYear: book?.publicationYear || undefined,
        genre: book?.genre || "",
        authorId: book?.authorId || undefined,
        publisherId: book?.publisherId || undefined,
        totalCopies: book?.totalCopies || 1,
        availableCopies: book?.availableCopies || 1,
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="publicationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publication Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="authorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors?.map((author: Author) => (
                          <SelectItem key={author.id} value={author.id.toString()}>
                            {author.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publisherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select publisher" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishers?.map((publisher: Publisher) => (
                          <SelectItem key={publisher.id} value={publisher.id.toString()}>
                            {publisher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Copies</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Copies</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {book ? 'Update' : 'Create'} Book
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You need staff privileges to access this dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Staff Navigation */}
      <nav className="bg-emerald-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <UserRoundCheck className="text-white text-xl mr-3" />
                <span className="text-xl font-bold text-white">LibraryMS Staff</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('overview')}
                  className={`text-white hover:text-white hover:bg-emerald-700 ${
                    activeSection === 'overview' ? 'border-b-2 border-white' : ''
                  }`}
                >
                  Overview
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('loans')}
                  className={`text-white hover:text-white hover:bg-emerald-700 ${
                    activeSection === 'loans' ? 'border-b-2 border-white' : ''
                  }`}
                >
                  Loans
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('inventory')}
                  className={`text-white hover:text-white hover:bg-emerald-700 ${
                    activeSection === 'inventory' ? 'border-b-2 border-white' : ''
                  }`}
                >
                  Inventory
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('members')}
                  className={`text-white hover:text-white hover:bg-emerald-700 ${
                    activeSection === 'members' ? 'border-b-2 border-white' : ''
                  }`}
                >
                  Members
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('reports')}
                  className={`text-white hover:text-white hover:bg-emerald-700 ${
                    activeSection === 'reports' ? 'border-b-2 border-white' : ''
                  }`}
                >
                  Reports
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user.profileImageUrl && (
                  <img 
                    className="h-8 w-8 rounded-full object-cover" 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                  />
                )}
                <span className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <Button onClick={handleLogout} variant="ghost" className="text-white hover:text-white hover:bg-emerald-700">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
            
            {/* Stats Cards */}
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Book className="text-primary text-2xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalBooks || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <HandHeart className="text-emerald-600 text-2xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Loans</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.activeLoans || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="text-red-600 text-2xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.overdueItems || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="text-purple-600 text-2xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Members</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.activeMembers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        setActiveSection('inventory');
                        setIsAddDialogOpen(true);
                      }}
                      className="p-4 bg-blue-50 hover:bg-blue-100 text-gray-900 h-auto"
                      variant="ghost"
                    >
                      <div className="text-center">
                        <Plus className="text-primary text-xl mb-2 mx-auto" />
                        <p className="text-sm font-medium">Add New Book</p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        setActiveSection('loans');
                        setIsAddDialogOpen(true);
                      }}
                      className="p-4 bg-emerald-50 hover:bg-emerald-100 text-gray-900 h-auto"
                      variant="ghost"
                    >
                      <div className="text-center">
                        <HandHeart className="text-emerald-600 text-xl mb-2 mx-auto" />
                        <p className="text-sm font-medium">Process Loan</p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveSection('members')}
                      className="p-4 bg-purple-50 hover:bg-purple-100 text-gray-900 h-auto"
                      variant="ghost"
                    >
                      <div className="text-center">
                        <UserPlus className="text-purple-600 text-xl mb-2 mx-auto" />
                        <p className="text-sm font-medium">Manage Members</p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveSection('reports')}
                      className="p-4 bg-orange-50 hover:bg-orange-100 text-gray-900 h-auto"
                      variant="ghost"
                    >
                      <div className="text-center">
                        <BarChart3 className="text-orange-600 text-xl mb-2 mx-auto" />
                        <p className="text-sm font-medium">Generate Report</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <HandHeart className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Recent loan activity will appear here</p>
                        <p className="text-xs text-gray-500">System activity is tracked automatically</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Loans Management Section */}
        {activeSection === 'loans' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      New Loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Loan</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                      <p className="text-gray-600 mb-4">
                        New loan functionality would be implemented here with user and book selection.
                      </p>
                      <div className="flex justify-end">
                        <Button onClick={() => setIsAddDialogOpen(false)}>Close</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Loan Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Select
                  value={selectedFilters.status || ""}
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Loans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loans</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={selectedFilters.dueDate || ""}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-48"
                />
                <Input
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                />
              </div>

              {/* Loans Table */}
              {loansLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Loan Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loansData?.loans?.map((loan: LoanWithDetails) => (
                      <TableRow key={loan.id} className={isOverdue(loan.dueDate) ? "bg-red-50" : ""}>
                        <TableCell>
                          <div className="flex items-center">
                            {loan.user.profileImageUrl && (
                              <img 
                                className="h-8 w-8 rounded-full object-cover mr-3" 
                                src={loan.user.profileImageUrl} 
                                alt="Profile" 
                              />
                            )}
                            <div>
                              <div className="font-medium">{loan.user.firstName} {loan.user.lastName}</div>
                              <div className="text-sm text-gray-500">{loan.user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{loan.book.title}</div>
                            <div className="text-sm text-gray-500">{loan.book.isbn}</div>
                          </div>
                        </TableCell>
                        <TableCell>{loan.loanDate}</TableCell>
                        <TableCell>{loan.dueDate}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              loan.status === "returned" ? "secondary" :
                              isOverdue(loan.dueDate) ? "destructive" : "default"
                            }
                          >
                            {loan.status === "returned" ? "Returned" :
                             isOverdue(loan.dueDate) ? `Overdue (${getDaysOverdue(loan.dueDate)} days)` : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {loan.status === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => returnBookMutation.mutate(loan.id)}
                                  disabled={returnBookMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Return
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => renewLoanMutation.mutate(loan.id)}
                                  disabled={renewLoanMutation.isPending || loan.renewalCount >= 2}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Renew
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inventory Management Section */}
        {activeSection === 'inventory' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Book Inventory</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Book
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Book</DialogTitle>
                    </DialogHeader>
                    <BookForm onSubmit={(data) => createBookMutation.mutate(data)} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Inventory Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select
                  value={selectedFilters.genre || ""}
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Fiction">Fiction</SelectItem>
                    <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedFilters.status || ""}
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Books Table */}
              {booksLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booksData?.books?.map((book: BookWithDetails) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-12 w-9 bg-gray-200 rounded flex items-center justify-center mr-4">
                              <Book className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{book.title}</div>
                              <div className="text-sm text-gray-500">{book.publicationYear}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{book.author?.name || "Unknown"}</TableCell>
                        <TableCell>{book.isbn}</TableCell>
                        <TableCell>{book.genre}</TableCell>
                        <TableCell>
                          <Badge variant={book.status === "available" ? "default" : "secondary"}>
                            {book.status === "available" ? "Available" : 
                             book.status === "checked_out" ? "Checked Out" : "Missing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Book</DialogTitle>
                                </DialogHeader>
                                <BookForm 
                                  book={book} 
                                  onSubmit={(data) => updateBookMutation.mutate({ id: book.id, data })} 
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBookMutation.mutate(book.id)}
                              disabled={deleteBookMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Members Management Section */}
        {activeSection === 'members' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
              </div>

              {/* Member Search and Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select
                  value={selectedFilters.membershipType || ""}
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, membershipType: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedFilters.isActive || ""}
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, isActive: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Members Table */}
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Loans</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersData?.members?.map((member: UserWithLoans) => {
                      const currentLoans = member.loans?.filter(loan => loan.status === "active") || [];
                      const overdueLoans = currentLoans.filter(loan => isOverdue(loan.dueDate));
                      
                      return (
                        <TableRow key={member.id} className={overdueLoans.length > 0 ? "bg-yellow-50" : ""}>
                          <TableCell>
                            <div className="flex items-center">
                              {member.profileImageUrl && (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover mr-3" 
                                  src={member.profileImageUrl} 
                                  alt="Profile" 
                                />
                              )}
                              <div>
                                <div className="font-medium">{member.firstName} {member.lastName}</div>
                                <div className="text-sm text-gray-500">{member.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{member.email}</div>
                              <div className="text-sm text-gray-500">{member.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{member.membershipType || "Regular"}</TableCell>
                          <TableCell>
                            {currentLoans.length}
                            {overdueLoans.length > 0 && (
                              <span className="text-red-600 ml-1">({overdueLoans.length} overdue)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              overdueLoans.length > 0 ? "destructive" :
                              member.isActive ? "default" : "secondary"
                            }>
                              {overdueLoans.length > 0 ? "Overdue" :
                               member.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-1" />
                                Loans
                              </Button>
                              {member.isActive && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deactivateMemberMutation.mutate(member.id)}
                                  disabled={deactivateMemberMutation.isPending}
                                >
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>
              
              {/* Report Generation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-blue-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Overdue Loans Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Generate report of all overdue items and associated fines</p>
                    <Button className="w-full bg-primary hover:bg-blue-700">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Popular Books Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Most borrowed titles over custom date ranges</p>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Activity Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Member borrowing patterns and activity metrics</p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Popular Books */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Books (This Month)</h3>
                    <div className="space-y-3">
                      {popularBooks?.slice(0, 5).map((book: any) => (
                        <div key={book.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-6 bg-gray-200 rounded flex items-center justify-center mr-3">
                              <Book className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{book.title}</p>
                              <p className="text-xs text-gray-500">{book.author?.name}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            {book.loanCount} loans
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Books</span>
                        <span className="font-semibold">{stats?.totalBooks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Loans</span>
                        <span className="font-semibold">{stats?.activeLoans || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Members</span>
                        <span className="font-semibold">{stats?.activeMembers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue Items</span>
                        <span className={`font-semibold ${stats?.overdueItems ? 'text-red-600' : 'text-emerald-600'}`}>
                          {stats?.overdueItems || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
