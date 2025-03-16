"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, UserPlus, Trash2, Edit2 } from "lucide-react";
import { createDebt, getDebtSummary, deleteDebt, updateDebt } from "@/actions/debts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BorrowLandingPage() {
  const [loading, setLoading] = useState(true);
  const [debtSummary, setDebtSummary] = useState([]);
  const [newDebt, setNewDebt] = useState({
    personName: "",
    amount: "",
  });
  const [editingDebt, setEditingDebt] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch debt summary on component mount
  useEffect(() => {
    fetchDebtSummary();
  }, []);

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

      {/* Transaction History */}
      {debtSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debtSummary.flatMap(person => 
                person.transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{person.displayName}</p>
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
                          onClick={() => handleEditClick(transaction, person.displayName)}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Transaction Modal */}
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
    </div>
  );
}
