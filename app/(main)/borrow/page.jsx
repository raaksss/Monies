"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, UserPlus } from "lucide-react";

export default function BorrowLandingPage() {
  const [debts, setDebts] = useState([]);
  const [newDebt, setNewDebt] = useState({
    name: "",
    amount: "",
  });

  // Keep track of the original case of names
  const [nameMap, setNameMap] = useState({});

  // Group debts by person (case insensitive) and calculate total
  const groupedDebts = debts.reduce((acc, debt) => {
    const lowerName = debt.name.toLowerCase();
    if (!acc[lowerName]) {
      acc[lowerName] = {
        total: 0,
        displayName: nameMap[lowerName] || debt.name // Use stored display name or current name
      };
    }
    acc[lowerName].total -= parseFloat(debt.amount);
    return acc;
  }, {});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newDebt.name || !newDebt.amount) return;

    const lowerName = newDebt.name.toLowerCase();
    
    // Store the first used version of the name
    if (!nameMap[lowerName]) {
      setNameMap(prev => ({
        ...prev,
        [lowerName]: newDebt.name
      }));
    }

    // Use the stored display name if it exists
    const displayName = nameMap[lowerName] || newDebt.name;
    
    setDebts([...debts, { ...newDebt, name: displayName, timestamp: new Date() }]);
    setNewDebt({ name: "", amount: "" });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight gradient-title">
          Borrow Tracker
        </h1>
      </div>

      {/* Add New Debt Form */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Person's name"
                value={newDebt.name}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, name: e.target.value })
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
                    setNewDebt({ ...newDebt, amount: Math.abs(newDebt.amount) })
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
                    setNewDebt({ ...newDebt, amount: -Math.abs(newDebt.amount) })
                  }
                  className="w-12"
                  title="They owe you"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Debts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedDebts).map(([lowerName, { total, displayName }]) => (
          <Card key={lowerName} className={total > 0 ? "border-green-200" : "border-red-200"}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  {total > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold">{displayName}</h3>
                      <p className="text-sm text-muted-foreground">Owes you</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">You owe</p>
                      <h3 className="text-lg font-semibold">{displayName}</h3>
                    </>
                  )}
                </div>
                <p
                  className={`text-xl font-bold ${
                    total > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ₹{Math.abs(total).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debts.map((debt, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{debt.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(debt.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      debt.amount < 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {debt.amount >= 0 ? "+" : "-"}₹{Math.abs(debt.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
