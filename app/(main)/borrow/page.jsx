"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, UserPlus, Trash2, Edit2, Search, Filter, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createDebt, getDebtSummary, deleteDebt, updateDebt, createGroup, getGroups, addGroupExpense, settleSplit } from "@/actions/debts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"


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

  // New states for group expenses
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: []
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
    paidByName: "",
    splitType: "equal", // equal, percentage, exact
    splits: []
  });
  const [newMember, setNewMember] = useState("");

  // Add this state near your other states
  const [fadingSettlements, setFadingSettlements] = useState(new Set());

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

  // First, let's modify the calculateSplits function to ensure it always returns properly formatted data
  const calculateSplits = (amount, splitType, splits, members) => {
    if (!amount || !members?.length) return [];

    if (splitType === "equal") {
      const equalShare = parseFloat(amount) / members.length;
      return members.map(member => ({
        id: member.id,
        name: member.name,
        amount: parseFloat(equalShare.toFixed(2)) // Round to 2 decimal places
      }));
    }

    if (splitType === "percentage") {
      return splits.map(split => ({
        id: split.id,
        name: members.find(m => m.id === split.id)?.name,
        amount: parseFloat(((parseFloat(amount) * parseFloat(split.value)) / 100).toFixed(2))
      }));
    }

    // For exact amounts
    return splits.map(split => ({
      id: split.id,
      name: members.find(m => m.id === split.id)?.name,
      amount: parseFloat(parseFloat(split.value).toFixed(2))
    }));
  };

  // Add this helper function near your other helper functions
  const calculateSettlements = (members) => {
    // Create a copy of members with their balances
    let balances = members.map(member => ({
      id: member.id,
      name: member.name,
      balance: member.balance || 0
    }));

    // Sort by balance: negative (debtors) first, positive (creditors) last
    balances.sort((a, b) => a.balance - b.balance);

    let settlements = [];
    let i = 0; // index for debtors (negative balances)
    let j = balances.length - 1; // index for creditors (positive balances)

    while (i < j) {
      const debtor = balances[i];
      const creditor = balances[j];

      if (Math.abs(debtor.balance) < 0.01 && Math.abs(creditor.balance) < 0.01) {
        // Skip if balances are effectively zero
        i++;
        j--;
        continue;
      }

      // Calculate the settlement amount
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      if (amount > 0) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
        });
      }

      // Update balances
      debtor.balance += amount;
      creditor.balance -= amount;

      // Move indices if balances are settled
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j--;
    }

    return settlements;
  };

  useEffect(() => {
    fetchGroups();
  }, []);
  
  // Add this function to fetch groups
  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      if (response.success) {
        setGroups(response.groups);
      } else {
        toast.error(response.error || "Failed to fetch groups");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("An error occurred while fetching groups");
    }
  };
  
  // First, add this helper function to recalculate balances when a settlement is deleted
  const deleteSettlement = (settlement, group) => {
    // Create updated members array with adjusted balances
    const updatedMembers = group.members.map(member => {
      let newBalance = member.balance || 0;
      
      // Add back the settled amount to the person who paid (debtor)
      if (member.name === settlement.from) {
        newBalance -= settlement.amount;
      }
      // Subtract the settled amount from the person who received (creditor)
      if (member.name === settlement.to) {
        newBalance += settlement.amount;
      }
      
      return {
        ...member,
        balance: newBalance
      };
    });

    // Create updated group with new balances and recalculated settlements
    const updatedGroup = {
      ...group,
      members: updatedMembers,
      settlements: calculateSettlements(updatedMembers) // Recalculate remaining settlements
    };

    return updatedGroup;
  };

  return (
    <div className="container mx-auto space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Expenses</TabsTrigger>
          <TabsTrigger value="groups">Group Expenses</TabsTrigger>
        </TabsList>
      <div className="py-2"></div>
        {/* Personal Expenses Tab */}
        <TabsContent value="personal">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold tracking-tight gradient-title">
              Personal Expenses
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
                    <div className="relative group">
                      <Button
                        type="button"
                        variant={newDebt.amount >= 0 ? "default" : "ghost"}
                        onClick={() =>
                          setNewDebt({ ...newDebt, amount: Math.abs(newDebt.amount || 0) })
                        }
                        className="w-12"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        You owe them
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        type="button"
                        variant={newDebt.amount < 0 ? "default" : "ghost"}
                        onClick={() =>
                          setNewDebt({ ...newDebt, amount: -Math.abs(newDebt.amount || 0) })
                        }
                        className="w-12"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        They owe you
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>Add</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Debts Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {debtSummary
              .filter(item => item.total !== 0) // Filter out items with zero balance
              .map((item) => (
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
            {debtSummary.length > 0 && debtSummary.filter(item => item.total !== 0).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No active debts. All balances are settled.
              </div>
            )}
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
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
                        <div className="relative group">
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
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            You owe them
                          </div>
                        </div>
                        <div className="relative group">
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
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            They owe you
                          </div>
                        </div>
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
        </TabsContent>

        {/* Group Expenses Tab */}
        <TabsContent value="groups">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold tracking-tight gradient-title">
                Group Expenses
              </h1>
              <Button onClick={() => setShowGroupForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Group
              </Button>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => setActiveGroup(group)}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{group.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {group.members.length} members
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="border-2 border-background">
                          <AvatarFallback>
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Active Group View */}
            {activeGroup && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{activeGroup.name}</span>
                    <Button onClick={() => setShowExpenseForm(true)}>
                      Add Expense
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="expenses">
                    <TabsList>
                      <TabsTrigger value="expenses">Expenses</TabsTrigger>
                      <TabsTrigger value="settlements">Settlements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="expenses">
                      {/* Expenses list */}
                      <div className="space-y-4">
                        {activeGroup.expenses?.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Paid by {expense.paidByName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{expense.amount}</p>
                              <p className="text-sm text-muted-foreground">
                               
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="settlements">
                      <div className="space-y-4">
                        {activeGroup.settlements?.filter(settlement => !settlement.isSettled)?.length > 0 ? (
                          activeGroup.settlements
                            .filter(settlement => !settlement.isSettled) // Only show unsettled transactions
                            .map((settlement, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-4 bg-muted rounded-lg transition-all duration-500 ${
                                  fadingSettlements.has(index) ? 'opacity-0 transform scale-95 h-0 m-0 p-0 overflow-hidden' : 'opacity-100 transform scale-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {settlement.from.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{settlement.from}</span>
                                    <span className="text-sm text-muted-foreground">needs to pay</span>
                                  </div>
                                </div>
                                <div className="font-semibold text-lg">
                                  ₹{settlement.amount}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                      <span className="font-medium">{settlement.to}</span>
                                      <span className="text-sm text-muted-foreground">will receive</span>
                                    </div>
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {settlement.to.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await settleSplit(settlement.id);
                                          if (response.success) {
                                            setFadingSettlements(prev => new Set([...prev, index]));
                                            setTimeout(() => {
                                              fetchGroups(); // Refresh groups to get updated data
                                              setFadingSettlements(new Set());
                                              toast.success('Settlement marked as complete!');
                                            }, 500);
                                          } else {
                                            toast.error(response.error || "Failed to settle");
                                          }
                                        } catch (error) {
                                          console.error("Error settling split:", error);
                                          toast.error("An error occurred while settling");
                                        }
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span>Settle</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No settlements needed. All balances are settled.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Group Modal */}
      <Dialog open={showGroupForm} onOpenChange={setShowGroupForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group to split expenses with friends
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault()
            // Validate form data
            if (!newGroup.name.trim()) {
              toast.error("Group name is required");
              return;
            }
            if (newGroup.members.length < 2) {
              toast.error("Add at least 2 members to create a group");
              return;
            }

            try {
              // Format the group data properly
              const groupData = {
                name: newGroup.name.trim(),
                description: newGroup.description || "",
                members: newGroup.members.map(member => ({
                  name: member.name.trim()
                }))
              };
              console.log("Sending group data:", groupData); 
              const response = await createGroup(groupData);

              if (response.success) {
                toast.success("Group created successfully!");
                fetchGroups(); // Refresh groups list
                setNewGroup({ name: "", description: "", members: [] });
                setShowGroupForm(false);
              } else {
                toast.error(response.error || "Failed to create group");
              }
            } catch (error) {
              console.error("Error creating group:", error);
              toast.error("An error occurred while creating the group");
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="Enter group name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter group description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add Members</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter member name"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newMember.trim()) {
                        setNewGroup({
                          ...newGroup,
                          members: [...newGroup.members, { id: Date.now().toString(), name: newMember.trim() }]
                        });
                        setNewMember("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Member List */}
              <div className="space-y-2">
                {newGroup.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>{member.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNewGroup({
                          ...newGroup,
                          members: newGroup.members.filter(m => m.id !== member.id)
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to split with group members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              // Validate required fields
              if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) {
                toast.error("Please fill in all required fields");
                return;
              }

              // Calculate splits before making the request
              const calculatedSplits = calculateSplits(
                parseFloat(newExpense.amount),
                newExpense.splitType,
                newExpense.splits,
                activeGroup.members
              );

              // Validate that splits were calculated
              if (!calculatedSplits.length) {
                toast.error("Failed to calculate splits");
                return;
              }

              const expenseData = {
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                paidBy: newExpense.paidBy,
                splits: calculatedSplits,
                createdAt: new Date().toISOString(),
              };

              console.log("Sending expense data:", expenseData);

              const response = await addGroupExpense(activeGroup.id, expenseData);

              if (response.success) {
                toast.success("Expense added successfully!");
                fetchGroups();
                console.log("Response:", response);
                setNewExpense({
                  description: "",
                  amount: "",
                  paidBy: "",
                  paidByName: "",
                  splitType: "equal",
                  splits: [],
                  createdAt: new Date().toISOString(),
                });
                setShowExpenseForm(false);
                fetchGroups();
              } else {
                toast.error(response.error || "Failed to add expense");
              }
            } catch (error) {
              console.error("Error adding expense:", error);
              toast.error("An error occurred while adding the expense");
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="What was this expense for?"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paid By</label>
                <Select
                  value={newExpense.paidBy}
                  onValueChange={(value) => {
                    const selectedMember = activeGroup.members.find(m => m.id === value);
                    setNewExpense({
                      ...newExpense,
                      paidBy: value,
                      paidByName: selectedMember?.name
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who paid?" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGroup?.members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Split Type</label>
                <Select
                  value={newExpense.splitType}
                  onValueChange={(value) => setNewExpense({ ...newExpense, splitType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How to split?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Split Equally</SelectItem>
                    <SelectItem value="percentage">Split by Percentage</SelectItem>
                    <SelectItem value="exact">Split by Exact Amounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Split Details */}
              {newExpense.splitType !== "equal" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Split Details</label>
                  {activeGroup?.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span className="w-1/3">{member.name}</span>
                      <Input
                        type="number"
                        placeholder={newExpense.splitType === "percentage" ? "%" : "Amount"}
                        value={newExpense.splits.find(s => s.id === member.id)?.value || ""}
                        onChange={(e) => {
                          const newSplits = [...newExpense.splits];
                          const index = newSplits.findIndex(s => s.id === member.id);
                          if (index >= 0) {
                            newSplits[index].value = e.target.value;
                          } else {
                            newSplits.push({ id: member.id, value: e.target.value });
                          }
                          setNewExpense({ ...newExpense, splits: newSplits });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
