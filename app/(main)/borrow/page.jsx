"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, UserPlus, Trash2, Edit2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { createDebt, getDebtSummary, deleteDebt, updateDebt } from "@/actions/debts";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamically import Dialog components with no SSR
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false });
const DialogFooter = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogFooter), { ssr: false });

const ITEMS_PER_PAGE = 5;

export default function BorrowLandingPage() {
  const [loading, setLoading] = useState(true);
  const [debtSummary, setDebtSummary] = useState([]);
  const [newDebt, setNewDebt] = useState({
    personName: "",
    amount: "",
  });
  const [editingDebt, setEditingDebt] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "owed", "owing"
  const [filterPerson, setFilterPerson] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest", "oldest", "amount-high", "amount-low"

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch debt summary on component mount
  useEffect(() => {
    fetchDebtSummary();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterPerson, sortOrder]);

  // Fetch debt summary from the server
  const fetchDebtSummary = async () => {
    setLoading(true);
    try {
      const response = await getDebtSummary();
      if (response.success) {
        setDebtSummary(response.summary || []);
      } else {
        toast.error(response.error || "Failed to fetch debts");
      }
    } catch (error) {
      console.error("Error fetching debt summary:", error);
      toast.error("An error occurred while fetching debts");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission to create a new debt
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDebt.personName || !newDebt.amount) {
      toast.error("Person name and amount are required");
      return;
    }

    try {
      const response = await createDebt({
        personName: newDebt.personName,
        amount: parseFloat(newDebt.amount),
      });

      if (response.success) {
        toast.success("Transaction added successfully");
        setNewDebt({ personName: "", amount: "" });
        fetchDebtSummary();
      } else {
        toast.error(response.error || "Failed to add transaction");
      }
    } catch (error) {
      console.error("Error creating debt:", error);
      toast.error("An error occurred while adding the transaction");
    }
  };

  // Handle debt deletion
  const handleDeleteDebt = async (id) => {
    try {
      const response = await deleteDebt(id);
      if (response.success) {
        toast.success("Transaction deleted successfully");
        fetchDebtSummary();
      } else {
        toast.error(response.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast.error("An error occurred while deleting the transaction");
    }
  };

  // Open edit modal with transaction data
  const handleEditClick = (transaction, personName) => {
    setEditingDebt({
      id: transaction.id,
      personName: personName,
      amount: transaction.amount.toString(),
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDebt.personName || !editingDebt.amount) {
      toast.error("Person name and amount are required");
      return;
    }

    try {
      const response = await updateDebt(editingDebt.id, {
        personName: editingDebt.personName,
        amount: parseFloat(editingDebt.amount),
      });

      if (response.success) {
        toast.success("Transaction updated successfully");
        setIsEditModalOpen(false);
        fetchDebtSummary();
      } else {
        toast.error(response.error || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating debt:", error);
      toast.error("An error occurred while updating the transaction");
    }
  };

  // Get all transactions from all persons
  const getAllTransactions = () => {
    return debtSummary.flatMap(person => 
      person.transactions.map(transaction => ({
        ...transaction,
        personName: person.displayName
      }))
    );
  };

  // Get unique person names for filter dropdown
  const getUniquePersons = () => {
    return [...new Set(debtSummary.map(person => person.displayName))];
  };

  // Filter and sort transactions
  const getFilteredTransactions = () => {
    let transactions = getAllTransactions();
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      transactions = transactions.filter(t => 
        t.personName.toLowerCase().includes(term)
      );
    }
    
    // Apply person filter
    if (filterPerson !== "all") {
      transactions = transactions.filter(t => t.personName === filterPerson);
    }
    
    // Apply type filter (owed/owing)
    if (filterType === "owed") {
      transactions = transactions.filter(t => t.amount < 0); // They owe you
    } else if (filterType === "owing") {
      transactions = transactions.filter(t => t.amount > 0); // You owe them
    }
    
    // Apply sorting
    transactions.sort((a, b) => {
      switch (sortOrder) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-high":
          return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-low":
          return Math.abs(a.amount) - Math.abs(b.amount);
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return transactions;
  };

  // Get paginated transactions
  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredTransactions().length / ITEMS_PER_PAGE);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight gradient-title">
          Borrow & Lend Log
        </h1>
      </div>

      {/* Add New Debt Form */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Borrow/Lend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Person's name"
                value={newDebt.personName}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, personName: e.target.value })
                }
                className="flex-1"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newDebt.amount}
                  onChange={(e) =>
                    setNewDebt({ ...newDebt, amount: e.target.value })
                  }
                  className="w-32"
                />
                <Button
                  type="button"
                  variant={newDebt.amount >= 0 ? "default" : "ghost"}
                  onClick={() =>
                    setNewDebt({ ...newDebt, amount: Math.abs(newDebt.amount || 0) })
                  }
                  className="w-12"
                  title="You owe them"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={newDebt.amount < 0 ? "default" : "ghost"}
                  onClick={() =>
                    setNewDebt({ ...newDebt, amount: -Math.abs(newDebt.amount || 0) })
                  }
                  className="w-12"
                  title="They owe you"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
              <Button type="submit" disabled={loading}>Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Debts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debtSummary.map((item) => (
          <Card 
            key={item.displayName} 
            className={item.total < 0 ? "border-green-200" : "border-red-200"}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  {item.total < 0 ? (
                    <>
                      <h3 className="text-lg font-semibold">{item.displayName}</h3>
                      <p className="text-sm text-muted-foreground">Owes you</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">You owe</p>
                      <h3 className="text-lg font-semibold">{item.displayName}</h3>
                    </>
                  )}
                </div>
                <p
                  className={`text-xl font-bold ${
                    item.total < 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ₹{Math.abs(item.total).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History with Filters and Pagination */}
      {debtSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Transaction History</span>
              <span className="text-sm text-muted-foreground">
                {getFilteredTransactions().length} transactions
              </span>
            </CardTitle>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Person Filter */}
              <Select value={filterPerson} onValueChange={setFilterPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  {getUniquePersons().map(person => (
                    <SelectItem key={person} value={person}>{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="owed">They Owe You</SelectItem>
                  <SelectItem value="owing">You Owe Them</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-low">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Transactions List */}
            <div className="space-y-4">
              {getPaginatedTransactions().map(transaction => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.personName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : "-"}₹{Math.abs(transaction.amount)}
                    </p>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditClick(transaction, transaction.personName)}
                        title="Edit transaction"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteDebt(transaction.id)}
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* No Results Message */}
              {getFilteredTransactions().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your filters.
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Transaction Modal - Only render on client side after mounting */}
      {isMounted && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium">Person's Name</label>
                  <Input
                    id="edit-name"
                    value={editingDebt?.personName || ""}
                    onChange={(e) =>
                      setEditingDebt({ ...editingDebt, personName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-amount" className="text-sm font-medium">Amount</label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-amount"
                      type="number"
                      value={editingDebt?.amount || ""}
                      onChange={(e) =>
                        setEditingDebt({ ...editingDebt, amount: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant={editingDebt?.amount >= 0 ? "default" : "ghost"}
                      onClick={() =>
                        setEditingDebt({ 
                          ...editingDebt, 
                          amount: Math.abs(parseFloat(editingDebt?.amount || 0)).toString() 
                        })
                      }
                      className="w-12"
                      title="You owe them"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editingDebt?.amount < 0 ? "default" : "ghost"}
                      onClick={() =>
                        setEditingDebt({ 
                          ...editingDebt, 
                          amount: (-Math.abs(parseFloat(editingDebt?.amount || 0))).toString() 
                        })
                      }
                      className="w-12"
                      title="They owe you"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
