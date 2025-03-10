"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatMessage({ message, isAi }) {
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"} mb-4`}>
      <div className={`flex ${isAi ? "flex-row" : "flex-row-reverse"} max-w-[80%] items-start gap-3`}>
        <Avatar className="w-8 h-8">
          {isAi ? (
            <>
              <AvatarImage src="/fina-avatar.png" alt="AI" />
              <AvatarFallback>AI</AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/user-avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </>
          )}
        </Avatar>
        <div
          className={`rounded-lg p-4 shadow-sm ${
            isAi
              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
              : "bg-blue-500 text-white dark:bg-blue-600 border border-blue-600 dark:border-blue-700"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
} 