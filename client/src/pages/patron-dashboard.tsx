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
import { BookOpen, Bell, User, Search, Filter, RotateCcw, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { BookWithDetails, LoanWithDetails } from "@shared/schema";

export default function PatronDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch books with filters
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ["/api/books", { 
      search: searchQuery, 
      genre: selectedGenre, 
      status: selectedAvailability, 
      page: currentPage,
      limit: 12
    }],
    enabled: true,
  });

  // Fetch user's loans
  const { data: userLoans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans/user", user?.id],
    enabled: !!user?.id,
  });

  // Fetch search suggestions
  const { data: searchSuggestions } = useQuery({
    queryKey: ["/api/books/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  // Borrow book mutation
  const borrowMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 14); // 2 week loan period

      return apiRequest("POST", "/api/loans", {
        bookId,
        loanDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: "active",
      });
    },
    onSuccess: () => {
      toast({
        title: "Book borrowed successfully",
        description: "The book has been added to your loans.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to borrow book",
        description: error.message || "An error occurred while borrowing the book.",
        variant: "destructive",
      });
    },
  });

  // Renew loan mutation
  const renewMutation = useMutation({
    mutationFn: async (loanId: number) => {
      return apiRequest("POST", `/api/loans/${loanId}/renew`, {});
    },
    onSuccess: () => {
      toast({
        title: "Loan renewed successfully",
        description: "Your loan has been extended for another 2 weeks.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to renew loan",
        description: error.message || "An error occurred while renewing the loan.",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/members/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    },
  });

  const handleBorrow = (bookId: number) => {
    borrowMutation.mutate(bookId);
  };

  const handleRenew = (loanId: number) => {
    renewMutation.mutate(loanId);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getCurrentLoans = () => {
    return userLoans?.filter((loan: LoanWithDetails) => loan.status === "active") || [];
  };

  const getLoanHistory = () => {
    return userLoans?.filter((loan: LoanWithDetails) => loan.status === "returned") || [];
  };

  const getOverdueCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return getCurrentLoans().filter((loan: LoanWithDetails) => loan.dueDate < today).length;
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BookOpen className="text-primary text-xl mr-3" />
                <span className="text-xl font-bold text-gray-900">LibraryMS</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="text-gray-400 text-lg" />
                {getOverdueCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {getOverdueCount()}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {user.profileImageUrl && (
                  <img 
                    className="h-8 w-8 rounded-full object-cover" 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="loans">My Loans</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Book Catalog */}
          <TabsContent value="catalog">
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Catalog</h1>
                
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search by title, author, ISBN, or category..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                    {searchSuggestions && searchSuggestions.length > 0 && searchQuery.length > 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 shadow-lg z-10">
                        {searchSuggestions.slice(0, 5).map((book: BookWithDetails) => (
                          <button
                            key={book.id}
                            onClick={() => handleSearch(book.title)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{book.title}</div>
                            <div className="text-sm text-gray-600">{book.author?.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Books" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Books</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="checked_out">Checked Out</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedGenre("");
                        setSelectedAvailability("");
                        setCurrentPage(1);
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Books Grid */}
                {booksLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {booksData?.books?.map((book: BookWithDetails) => (
                        <Card key={book.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{book.author?.name}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant={book.status === "available" ? "default" : "secondary"}>
                                {book.status === "available" ? "Available" : "Checked Out"}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleBorrow(book.id)}
                                disabled={book.status !== "available" || borrowMutation.isPending}
                                className={book.status === "available" ? "" : "opacity-50 cursor-not-allowed"}
                              >
                                {book.status === "available" ? "Borrow" : "Unavailable"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {booksData && booksData.total > 12 && (
                      <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, booksData.total)} of {booksData.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="px-3 py-2 text-sm font-medium text-gray-700">
                            {currentPage}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage * 12 >= booksData.total}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Loans */}
          <TabsContent value="loans">
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Loans</h1>
                
                {loansLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Current Loans */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Loans</h2>
                      {getCurrentLoans().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No current loans</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Book</TableHead>
                              <TableHead>Loan Date</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getCurrentLoans().map((loan: LoanWithDetails) => (
                              <TableRow key={loan.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{loan.book.title}</div>
                                    <div className="text-sm text-gray-500">{loan.book.author?.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{loan.loanDate}</TableCell>
                                <TableCell>{loan.dueDate}</TableCell>
                                <TableCell>
                                  <Badge variant={isOverdue(loan.dueDate) ? "destructive" : "default"}>
                                    {isOverdue(loan.dueDate) ? "Overdue" : "On Time"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRenew(loan.id)}
                                    disabled={renewMutation.isPending || loan.renewalCount >= 2}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Renew
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Loan History */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan History</h2>
                      {getLoanHistory().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No loan history</p>
                      ) : (
                        <div className="space-y-3">
                          {getLoanHistory().slice(0, 5).map((loan: LoanWithDetails) => (
                            <div key={loan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{loan.book.title}</div>
                                <div className="text-sm text-gray-500">{loan.book.author?.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-900">
                                  {loan.loanDate} - {loan.returnDate}
                                </div>
                                <div className="text-sm text-gray-500">Returned on time</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Form */}
                  <div className="lg:col-span-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        updateProfileMutation.mutate({
                          firstName: formData.get('firstName'),
                          lastName: formData.get('lastName'),
                          email: formData.get('email'),
                          phone: formData.get('phone'),
                        });
                      }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            defaultValue={user.firstName || ""}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            defaultValue={user.lastName || ""}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={user.email || ""}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          defaultValue={user.phone || ""}
                          className="mt-2"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        Update Profile
                      </Button>
                    </form>
                  </div>

                  {/* Account Summary */}
                  <div>
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member ID</span>
                            <span className="font-medium">{user.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member Since</span>
                            <span className="font-medium">
                              {new Date(user.createdAt || '').toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Loans</span>
                            <span className="font-medium">{getCurrentLoans().length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Overdue Items</span>
                            <span className={`font-medium ${getOverdueCount() > 0 ? 'text-red-600' : ''}`}>
                              {getOverdueCount()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Membership Type</span>
                            <span className="font-medium capitalize">{user.membershipType || 'Regular'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
