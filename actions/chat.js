"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the correct model name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function getFinancialAdvice(message, transactionHistory = null) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("You must be signed in to get financial advice");
    }

    let context = "";
    if (transactionHistory) {
      context = `Based on the user's transaction history: ${JSON.stringify(transactionHistory)}. `;
    }

    const prompt = `${context}As a financial advisor, provide professional advice for the following query: ${message}. 
    Focus on practical, actionable advice and explain the reasoning behind your recommendations. 
    Important: Provide your response in plain text without any markdown formatting (no *, **, #, or other markdown symbols).`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Unable to generate financial advice at the moment. Please try again later.");
    }
  } catch (error) {
    console.error("Error in getFinancialAdvice:", error);
    throw new Error(error.message || "Failed to get financial advice. Please try again.");
  }
}

export async function analyzeExpenses() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("You must be signed in to analyze expenses");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    // Get transactions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        amount: true,
        category: true,
      },
    });

    if (!transactions.length) {
      throw new Error("No expense transactions found in the last 30 days");
    }

    // Group and sum transactions by category
    const categoryTotals = transactions.reduce((acc, curr) => {
      const amount = parseFloat(curr.amount.toString());
      acc[curr.category] = (acc[curr.category] || 0) + amount;
      return acc;
    }, {});

    // Find highest spending category
    const highestCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    try {
      const prompt = `As a financial advisor, provide specific advice on how to reduce spending in the category "${highestCategory[0]}" where the user has spent ₹${highestCategory[1].toFixed(2)} in the last 30 days. Include practical tips and alternatives for saving money in this category. 
      Important: Provide your response in plain text without any markdown formatting (no *, **, #, or other markdown symbols).`;

      const result = await model.generateContent(prompt);
      const response = result.response;

      return {
        categoryAnalysis: categoryTotals,
        highestCategory: {
          name: highestCategory[0],
          amount: highestCategory[1],
        },
        advice: response.text(),
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Unable to generate expense analysis advice at the moment. Please try again later.");
    }
  } catch (error) {
    console.error("Error in analyzeExpenses:", error);
    throw new Error(error.message || "Failed to analyze expenses. Please try again.");
  }
} 