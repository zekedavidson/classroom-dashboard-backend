import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { db } from "../db/index.js";
import { user as userTable } from "../db/schema/auth.js";
import { checkRole } from "../middleware/auth.js";

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
                    ilike(userTable.name, `%${search}%`),
                    ilike(userTable.email, `%${search}%`)
                )
            )
        }

        // If role filter exists, match role exactly
        if (role) {
            filterConditions.push(eq(userTable.role, String(role) as 'student' | 'teacher' | 'admin'));
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` }).from(userTable).where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const userTablesList = await db.select({
            ...getTableColumns(userTable),
        }).from(userTable)
            .where(whereClause)
            .orderBy(desc(userTable.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: userTablesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.error(`GET /userTables error: ${e}`);
        res.status(500).json({ error: 'Failed to get userTables' });
    }
})

// Get userTable details
router.get("/:id", async (req, res) => {
    try {
        const userTableId = req.params.id;
        const [userTableDetails] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, String(userTableId)));

        if (!userTableDetails) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: userTableDetails });
    } catch (error) {
        console.error("GET /userTables/:id error:", error);
        res.status(500).json({ error: "Failed to fetch userTable details" });
    }
});

// Create a userTable
router.post("/", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
        const { name, email, role, image, emailVerified } = req.body;
        // In a real app auth should handle creation, but we provide this for admin CRUD
        const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
        
        const [createdUser] = await db
            .insert(userTable)
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
        console.error("POST /userTables error:", error);
        res.status(500).json({ error: "Failed to create userTable" });
    }
});

// Update a userTable
router.put("/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
        const userTableId = req.params.id;
        const { name, email, role, image, emailVerified } = req.body;

        const [updatedUser] = await db
            .update(userTable)
            .set({ name, email, role, image, emailVerified, updatedAt: new Date() })
            .where(eq(userTable.id, String(userTableId)))
            .returning();

        if (!updatedUser) {
             return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: updatedUser });
    } catch (error) {
        console.error("PUT /userTables/:id error:", error);
        res.status(500).json({ error: "Failed to update userTable" });
    }
});

// Delete a userTable
router.delete("/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
        const userTableId = req.params.id;

        const [deletedUser] = await db
            .delete(userTable)
            .where(eq(userTable.id, String(userTableId)))
            .returning({ id: userTable.id });

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
