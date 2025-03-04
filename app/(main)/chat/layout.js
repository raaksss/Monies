import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { CreditCard, MessageCircle, Send } from "lucide-react"; 
import NavItem from "./_components/nav-item";


export default function ChatLayout() {
  return (
    <Card className="hover:shadow-md transition-shadow group relative mx-auto h-[80vh]">
      <CardContent className="flex">
        {/* Left Navigation Column */}
        <div className="w-1/4 min-w-[120px] mx-auto h-[80vh] border-r p-4 flex flex-col space-y-4 ">
        <h1 className="text-5xl font-bold tracking-tight gradient-title">
          Fina
          </h1>
        <NavItem icon={<MessageCircle size={20} />} label="Financial Advice" />
        <NavItem icon={<CreditCard size={20} />} label="Expense & Budgeting" />
        </div>

        <div className="flex-1 flex flex-col p-6 bg-white">
          {/* Chat Messages (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg shadow-inner">
            <p className="text-gray-500">Start a conversation...</p>
          </div>

          {/* Chat Input */}
          <div className="mt-4 flex items-center space-x-2 border-t pt-4">
            <Input className="flex-1" placeholder="Type your message..." />
            <Button variant="default">
              <Send size={18} className="mr-2" />
              Send
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
