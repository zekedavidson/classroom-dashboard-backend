import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { user, roleEnum } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

// Get all users with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(1, parseInt(String(limit), 10) || 10);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by user name OR email
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            )
        }

        // If role filter exists, match role exactly
        if (role) {
            filterConditions.push(eq(user.role, String(role) as 'student' | 'teacher' | 'admin'));
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` }).from(user).where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db.select({
            ...getTableColumns(user),
        }).from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
})

// Get user details
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const [userDetails] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId));

        if (!userDetails) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: userDetails });
    } catch (error) {
        console.error("GET /users/:id error:", error);
        res.status(500).json({ error: "Failed to fetch user details" });
    }
});

// Create a user
router.post("/", async (req, res) => {
    try {
        const { name, email, role, image, emailVerified } = req.body;
        // In a real app auth should handle creation, but we provide this for admin CRUD
        const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
        
        const [createdUser] = await db
            .insert(user)
            .values({ 
                id: newId, 
                name, 
                email, 
                role, 
                image, 
                emailVerified: emailVerified ?? false, 
                createdAt: new Date(), 
                updatedAt: new Date() 
            })
            .returning();
            
        if (!createdUser) throw Error;

        res.status(201).json({ data: createdUser });
    } catch (error) {
        console.error("POST /users error:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Update a user
router.put("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, image, emailVerified } = req.body;

        const [updatedUser] = await db
            .update(user)
            .set({ name, email, role, image, emailVerified, updatedAt: new Date() })
            .where(eq(user.id, userId))
            .returning();

        if (!updatedUser) {
             return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: updatedUser });
    } catch (error) {
        console.error("PUT /users/:id error:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Delete a user
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const [deletedUser] = await db
            .delete(user)
            .where(eq(user.id, userId))
            .returning({ id: user.id });

        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: deletedUser });
    } catch (error) {
        console.error("DELETE /users/:id error:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
