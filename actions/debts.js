"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get the current user from Clerk and find their record in our database
 */
async function getUserId() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");
  
    const user = await db.user.findUnique({
      where: { clerkUserId },
    });
  
    if (!user) {
      throw new Error("User not found");
    }

  return user.id; // Return the database user ID, not the Clerk user ID
}

/**
 * Convert Prisma Decimal to number
 */
function serializeDebt(debt) {
  return {
    ...debt,
    amount: parseFloat(debt.amount.toString()),
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString()
  };
}

/**
 * Create a new debt record
 */
export async function createDebt(data) {
    try {
        const userId = await getUserId();
    // Validate input
    if (!data.personName || !data.amount) {
      throw new Error("Person name and amount are required");
    }

    // Create the debt record
    const debt = await db.debt.create({
      data: {
        personName: data.personName,
        amount: data.amount,
        userId
      }
    });

    revalidatePath("/borrow");
    return { success: true, debt: serializeDebt(debt) };
  } catch (error) {
    console.error("Error creating debt:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all debts for the current user
 */
export async function getDebts() {
  try {
    const userId = await getUserId();
    
    const debts = await db.debt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, debts: debts.map(serializeDebt) };
  } catch (error) {
    console.error("Error fetching debts:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get summary of debts grouped by person (case insensitive)
 */
export async function getDebtSummary() {
  try {
    const userId = await getUserId();
    
    // Get all debts for the user
    const debts = await db.debt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // Convert Decimal to number
    const serializedDebts = debts.map(serializeDebt);

    // Group debts by person name (case insensitive)
    const summary = {};
    const nameMap = {}; // To store original case of names

    serializedDebts.forEach(debt => {
      const lowerName = debt.personName.toLowerCase();
      
      // Store the first occurrence of the name with its original case
      if (!nameMap[lowerName]) {
        nameMap[lowerName] = debt.personName;
      }
      
      if (!summary[lowerName]) {
        summary[lowerName] = {
          total: 0,
          displayName: nameMap[lowerName],
          transactions: []
        };
      }
      
      // Calculate the running balance:
      // - Positive amount in DB (+) means user owes person
      // - Negative amount in DB (-) means person owes user
      // For the UI display:
      // - Positive total means user owes person
      // - Negative total means person owes user
      summary[lowerName].total += debt.amount;
      
      // Add transaction to the list
      summary[lowerName].transactions.push({
        id: debt.id,
        amount: debt.amount,
        createdAt: debt.createdAt
      });
    });

    // Convert to array and sort by displayName for consistent ordering
    const summaryArray = Object.values(summary).map(item => ({
      ...item,
      transactions: item.transactions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    }));

    // Log for debugging
    console.log("Debt summary before returning:", summaryArray);

    return { 
      success: true, 
      summary: summaryArray
    };
  } catch (error) {
    console.error("Error fetching debt summary:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a debt record
 */
export async function deleteDebt(id) {
  try {
    const userId = await getUserId();
    
    // Check if debt exists and belongs to user
    const debt = await db.debt.findUnique({
      where: { id }
    });

    if (!debt) {
      throw new Error("Debt not found");
    }

    if (debt.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete the debt
    await db.debt.delete({
      where: { id }
    });

    revalidatePath("/borrow");
    return { success: true };
  } catch (error) {
    console.error("Error deleting debt:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing debt record
 */
export async function updateDebt(id, data) {
  try {
    const userId = await getUserId();
    
    // Check if debt exists and belongs to user
    const debt = await db.debt.findUnique({
      where: { id }
    });

    if (!debt) {
      throw new Error("Debt not found");
    }

    if (debt.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Validate input
    if (!data.personName || data.amount === undefined) {
      throw new Error("Person name and amount are required");
    }

    // Update the debt
    const updatedDebt = await db.debt.update({
      where: { id },
      data: {
        personName: data.personName,
        amount: data.amount
      }
    });

    revalidatePath("/borrow");
    return { success: true, debt: serializeDebt(updatedDebt) };
  } catch (error) {
    console.error("Error updating debt:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new group
 */
export async function createGroup(groupData) {
  try {
    const userId = await getUserId();

    // Validate input
    if (!groupData.name) {
      throw new Error("Group name is required");
    }
    if (!groupData.members || groupData.members.length < 2) {
      throw new Error("At least 2 members are required");
    }

    // Create the group and its members in a transaction
    const group = await db.$transaction(async (tx) => {
      // Create the group
      const newGroup = await tx.group.create({
        data: {
          name: groupData.name,
          description: groupData.description,
          createdById: userId,
        },
      });

      // Add members to the group
      const memberPromises = groupData.members.map((member) =>
        tx.groupMember.create({
          data: {
            name: member.name,
            userId: userId, // Set current user as the member if it's their name
            groupId: newGroup.id,
          },
        })
      );

      await Promise.all(memberPromises);

      // Return the created group with members
      return tx.group.findUnique({
        where: { id: newGroup.id },
        include: {
          members: true,
          expenses: {
            include: {
              paidBy: true,
              splits: {
                include: {
                  member: true,
                },
              },
            },
          },
        },
      });
    });

    revalidatePath("/borrow");
    return { success: true, group };
  } catch (error) {
    console.error("Error creating group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all groups for the current user
 */
export async function getGroups() {
  try {
    const userId = await getUserId();

    const groups = await db.group.findMany({
      where: {
        OR: [
          { createdById: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: true,
        expenses: {
          include: {
            paidBy: true,
            splits: {
              include: {
                member: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, groups };
  } catch (error) {
    console.error("Error fetching groups:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add an expense to a group
 */
export async function addGroupExpense(groupId, expenseData) {
  try {
    const userId = await getUserId();

    // Validate input
    if (!expenseData.description || !expenseData.amount) {
      throw new Error("Description and amount are required");
    }
    if (!expenseData.paidBy) {
      throw new Error("Paid by member is required");
    }

    // Create the expense and splits in a transaction
    const expense = await db.$transaction(async (tx) => {
      // Create the expense
      const newExpense = await tx.groupExpense.create({
        data: {
          description: expenseData.description,
          amount: expenseData.amount,
          groupId: groupId,
          paidById: expenseData.paidBy,
        },
      });

      // Create splits
      const splitPromises = expenseData.splits.map((split) =>
        tx.expenseSplit.create({
          data: {
            amount: split.amount,
            expenseId: newExpense.id,
            memberId: split.memberId,
          },
        })
      );

      await Promise.all(splitPromises);

      // Return the created expense with all relations
      return tx.groupExpense.findUnique({
        where: { id: newExpense.id },
        include: {
          paidBy: true,
          splits: {
            include: {
              member: true,
            },
          },
        },
      });
    });

    revalidatePath("/borrow");
    return { success: true, expense };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a split as settled
 */
export async function settleSplit(splitId) {
  try {
    const userId = await getUserId();

    const updatedSplit = await db.expenseSplit.update({
      where: { id: splitId },
      data: {
        isSettled: true,
        settledAt: new Date(),
      },
      include: {
        member: true,
        expense: {
          include: {
            paidBy: true,
          },
        },
      },
    });

    revalidatePath("/borrow");
    return { success: true, split: updatedSplit };
  } catch (error) {
    console.error("Error settling split:", error);
    return { success: false, error: error.message };
  }
}

