import express from "express";
import { db } from "../db/index.js";
import { classes, departments, subjects, enrollments } from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

const router = express.Router();

// Get all classes with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, teacher, subject, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(1, parseInt(String(limit), 10) || 10);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.inviteCode, `%${search}%`)
                )
            )
        }

        if (subject) {
            filterConditions.push(ilike(subjects.name, `%${subject}%`));
            const subPattern = `%${String(subject).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(ilike(subjects.name, subPattern));
        }

        if (teacher) {
            filterConditions.push(ilike(user.name, `%${teacher}%`))
            const userPattern = `%${String(teacher).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(ilike(user.name, userPattern));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const classesList = await db.select({
            ...getTableColumns(classes),
            subject: { ...getTableColumns(subjects) },
            teacher: { ...getTableColumns(user) }
        }).from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.log(`GET /classes error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects ' });
    }
})

// Get class details wtih teacher, subject and department
router.get('/:id', async (req, res) => {
    const classId = Number(req.params.id);

    if (!Number.isFinite(classId)) return res.status(400).json({ error: 'No class found' });

    const [classDetails] = await db
        .select({
            ...getTableColumns(classes),
            subject: {
                ...getTableColumns(subjects),
            },
            department: {
                ...getTableColumns(departments)
            },
            teacher: {
                ...getTableColumns(user)
            }
        })
        .from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(classes.id, classId))

    if (!classDetails) return res.status(404).json({ error: 'No class found' });

    res.status(200).json({ data: classDetails })
})

router.post('/', async (req, res) => {
    try {
        const [createdClass] = await db
            .insert(classes)
            .values({ ...req.body, inviteCode: Math.random().toString(36).substring(2, 7), schedules: [] })
            .returning({ id: classes.id });

        if (!createdClass) throw Error;

        res.status(201).json({ data: createdClass });
    } catch (e) {
        console.log(`POST /classes error ${e}`);
        res.status(500).json({ error: e })
    }
})

// Update a class
router.put("/:id", async (req, res) => {
    try {
        const classId = Number(req.params.id);
        if (!Number.isFinite(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const { subjectId, teacherId, name, bannerCldPubId, bannerUrl, description, capacity, status, schedules } = req.body;

        const [updatedClass] = await db
            .update(classes)
            .set({ subjectId, teacherId, name, bannerCldPubId, bannerUrl, description, capacity, status, schedules })
            .where(eq(classes.id, classId))
            .returning();

        if (!updatedClass) return res.status(404).json({ error: "Class not found" });

        res.status(200).json({ data: updatedClass });
    } catch (error) {
        console.error("PUT /classes/:id error:", error);
        res.status(500).json({ error: "Failed to update class" });
    }
});

// Delete a class
router.delete("/:id", async (req, res) => {
    try {
        const classId = Number(req.params.id);
        if (!Number.isFinite(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const [deletedClass] = await db
            .delete(classes)
            .where(eq(classes.id, classId))
            .returning({ id: classes.id });

        if (!deletedClass) return res.status(404).json({ error: "Class not found" });

        res.status(200).json({ data: deletedClass });
    } catch (error) {
        console.error("DELETE /classes/:id error:", error);
        res.status(500).json({ error: "Failed to delete class" });
    }
});

// Get enrolled students
router.get("/:id/enrollments", async (req, res) => {
    try {
        const classId = Number(req.params.id);
        if (!Number.isFinite(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const enrolledStudents = await db
            .select({
                ...getTableColumns(user),
                enrollmentId: enrollments.id,
                enrolledAt: enrollments.createdAt,
            })
            .from(enrollments)
            .innerJoin(user, eq(enrollments.studentId, user.id))
            .where(eq(enrollments.classId, classId));

        res.status(200).json({ data: enrolledStudents });
    } catch (error) {
        console.error("GET /classes/:id/enrollments error:", error);
        res.status(500).json({ error: "Failed to fetch enrollments." });
    }
});

// Enroll a student
router.post("/:id/enroll", async (req, res) => {
    try {
        const classId = Number(req.params.id);
        if (!Number.isFinite(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ error: "Missing studentId" });

        const [enrolled] = await db
            .insert(enrollments)
            .values({ classId, studentId })
            .returning();

        res.status(201).json({ data: enrolled });
    } catch (error) {
        console.error("POST /classes/:id/enroll error:", error);
        res.status(500).json({ error: "Failed to enroll student. They might already be enrolled." });
    }
});

// Unenroll a student
router.delete("/:id/enroll/:studentId", async (req, res) => {
    try {
        const classId = Number(req.params.id);
        const studentId = req.params.studentId;
        if (!Number.isFinite(classId)) return res.status(400).json({ error: 'Invalid class id' });

        const [unenrolled] = await db
            .delete(enrollments)
            .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
            .returning();

        if (!unenrolled) return res.status(404).json({ error: "Enrollment not found" });

        res.status(200).json({ data: unenrolled });
    } catch (error) {
        console.error("DELETE /classes/:id/enroll error:", error);
        res.status(500).json({ error: "Failed to unenroll student" });
    }
});

export default router;