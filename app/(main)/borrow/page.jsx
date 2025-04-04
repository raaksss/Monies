"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, Edit2, Check } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createGroup, getGroups, addGroupExpense, settleSplit, deleteGroupExpense, updateGroupExpense, deleteGroup } from "@/actions/debts";

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
import PersonalExpense from "./_components/personal-expense";
import GroupExpense from "./_components/group-expense";


export default function BorrowLandingPage() {
  
  return (
    <div className="container mx-auto space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Expenses</TabsTrigger>
          <TabsTrigger value="groups">Group Expenses</TabsTrigger>
        </TabsList>
      <div className="py-2"></div>
        {/* Personal Expenses Tab */}
       <PersonalExpense />

        {/* Group Expenses Tab */}
        <GroupExpense />
      </Tabs>
    </div>
  );
}
