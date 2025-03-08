import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { CreditCard, MessageCircle, Send } from "lucide-react"; 
import NavItem from "./_components/nav-item";

export default function ChatLayout() {
  return (
    <Card className="hover:shadow-md transition-all duration-300 group relative mx-auto h-[90vh] dark:bg-gray-900">
      <CardContent className="flex flex-col md:flex-row h-full p-0">
        {/* Left Navigation Column */}
        <div className="w-full md:w-1/4 md:min-w-[200px] h-auto md:h-[90vh] border-b md:border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col space-y-4 dark:bg-gray-900">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-title text-center md:text-left">
            Fina
          </h1>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            <NavItem icon={<MessageCircle size={20} />} label="Financial Advice" />
            <NavItem icon={<CreditCard size={20} />} label="Expense & Budgeting" />
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 md:p-6 dark:bg-gray-900">
          {/* Chat Messages (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
            <p className="text-gray-500 dark:text-gray-400">Start a conversation...</p>
          </div>

          {/* Chat Input */}
          <div className="mt-4 flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Input 
              className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400" 
              placeholder="Type your message..." 
            />
            <Button variant="default" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Send size={18} className="mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
