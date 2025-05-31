"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard, MoreHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import dynamic from 'next/dynamic';
import { toast } from "sonner";

// Dynamically import the EditAccountDialog with no SSR
const EditAccountDialog = dynamic(
  () => import('@/components/edit-account-dialog').then(mod => mod.EditAccountDialog),
  { ssr: false }
);

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id);
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    setShowEditDialog(true);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={isDefault}
              onClick={handleDefaultChange}
              disabled={updateDefaultLoading}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleEditClick}>
                  Edit Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <Link href={`/account/${id}`}>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{parseFloat(balance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {type.charAt(0) + type.slice(1).toLowerCase()} Account
            </p>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              Income
            </div>
            <div className="flex items-center">
              <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              Expense
            </div>
          </CardFooter>
        </Link>
      </Card>

      {showEditDialog && (
        <EditAccountDialog 
          account={account} 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}
