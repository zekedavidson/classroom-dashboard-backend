import 'dotenv/config';
import { db } from './index.js';
import * as schema from './schema/app.js';
import * as authSchema from './schema/auth.js';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Departments
    const deptData = [
        { code: 'CS', name: 'Computer Science', description: 'Department of Computing and Technology' },
        { code: 'MATH', name: 'Mathematics', description: 'Department of Pure and Applied Mathematics' },
        { code: 'PHYS', name: 'Physics', description: 'Department of Physical Sciences' },
        { code: 'ARTS', name: 'Fine Arts', description: 'Department of Creative Arts and Design' },
    ];

    console.log('Inserting departments...');
    const insertedDepts = await db.insert(schema.departments).values(deptData).onConflictDoNothing().returning();
    
    // Fetch all depts if some were already there
    const allDepts = await db.select().from(schema.departments);
    const csDept = allDepts.find(d => d.code === 'CS');
    const mathDept = allDepts.find(d => d.code === 'MATH');
    const physDept = allDepts.find(d => d.code === 'PHYS');
    const artsDept = allDepts.find(d => d.code === 'ARTS');

    if (!csDept || !mathDept || !physDept || !artsDept) {
        throw new Error('Could not find all departments');
    }

    // 2. Subjects
    const subjectData = [
        { departmentId: csDept.id, code: 'CS101', name: 'Intro to Programming', description: 'Basics of programming using Python' },
        { departmentId: csDept.id, code: 'CS201', name: 'Web Development', description: 'Building modern web apps with React' },
        { departmentId: mathDept.id, code: 'MATH101', name: 'Calculus I', description: 'Differential and integral calculus' },
        { departmentId: mathDept.id, code: 'MATH201', name: 'Linear Algebra', description: 'Matrix theory and vector spaces' },
        { departmentId: physDept.id, code: 'PHYS101', name: 'Classical Mechanics', description: 'Motion, forces, and energy' },
        { departmentId: artsDept.id, code: 'ARTS101', name: 'Digital Illustration', description: 'Creating art with digital tools' },
    ];

    console.log('Inserting subjects...');
    await db.insert(schema.subjects).values(subjectData).onConflictDoNothing();
    const allSubjects = await db.select().from(schema.subjects);

    // 3. Users (Teachers and Students)
    const teachers = [
        { id: 'teacher_1', name: 'Prof. Alan Turing', email: 'turing@uni.edu', role: 'teacher' as const, emailVerified: true },
        { id: 'teacher_2', name: 'Prof. Ada Lovelace', email: 'lovelace@uni.edu', role: 'teacher' as const, emailVerified: true },
        { id: 'teacher_3', name: 'Prof. Grace Hopper', email: 'hopper@uni.edu', role: 'teacher' as const, emailVerified: true },
    ];

    const students = [
        { id: 'student_1', name: 'Alice Smith', email: 'alice@student.edu', role: 'student' as const, emailVerified: true },
        { id: 'student_2', name: 'Bob Jones', email: 'bob@student.edu', role: 'student' as const, emailVerified: true },
        { id: 'student_3', name: 'Charlie Brown', email: 'charlie@student.edu', role: 'student' as const, emailVerified: true },
        { id: 'student_4', name: 'David Wilson', email: 'david@student.edu', role: 'student' as const, emailVerified: true },
        { id: 'student_5', name: 'Emma Davis', email: 'emma@student.edu', role: 'student' as const, emailVerified: true },
        { id: 'student_6', name: 'Frank Miller', email: 'frank@student.edu', role: 'student' as const, emailVerified: true },
    ];

    console.log('Inserting users...');
    await db.insert(authSchema.user).values([...teachers, ...students]).onConflictDoNothing();

    const subjectCs201 = allSubjects.find(s => s.code === 'CS201');
    const subjectMath201 = allSubjects.find(s => s.code === 'MATH201');
    const subjectPhys101 = allSubjects.find(s => s.code === 'PHYS101');

    if (!subjectCs201 || !subjectMath201 || !subjectPhys101) {
        throw new Error('Could not find all subjects');
    }

    // 4. Classes
    const classData = [
        {
            name: 'Web Apps with React',
            description: 'Advanced web development workshop',
            subjectId: subjectCs201.id,
            teacherId: 'teacher_1',
            inviteCode: 'REACT2024',
            capacity: 30,
            status: 'active' as const,
        },
        {
            name: 'Linear Algebra Fundamentals',
            description: 'Core concepts for data science',
            subjectId: subjectMath201.id,
            teacherId: 'teacher_2',
            inviteCode: 'MATH456',
            capacity: 40,
            status: 'active' as const,
        },
        {
            name: 'Quantum Physics Intro',
            description: 'Understanding the subatomic world',
            subjectId: subjectPhys101.id,
            teacherId: 'teacher_3',
            inviteCode: 'PHYS789',
            capacity: 25,
            status: 'active' as const,
        }
    ];

    console.log('Inserting classes...');
    await db.insert(schema.classes).values(classData).onConflictDoNothing();
    const allCreatedClasses = await db.select().from(schema.classes);

    // 5. Enrollments
    if (allCreatedClasses.length < 3) {
        console.warn('⚠️ Not enough classes created to seed enrollments as expected.');
    }

    const enrollmentData = [];
    
    if (allCreatedClasses[0]) {
        enrollmentData.push(
            { studentId: 'student_1', classId: allCreatedClasses[0].id },
            { studentId: 'student_2', classId: allCreatedClasses[0].id },
            { studentId: 'student_3', classId: allCreatedClasses[0].id },
        );
    }
    
    if (allCreatedClasses[1]) {
        enrollmentData.push(
            { studentId: 'student_1', classId: allCreatedClasses[1].id },
            { studentId: 'student_4', classId: allCreatedClasses[1].id },
        );
    }

    if (allCreatedClasses[2]) {
        enrollmentData.push(
            { studentId: 'student_5', classId: allCreatedClasses[2].id },
            { studentId: 'student_6', classId: allCreatedClasses[2].id },
        );
    }

    console.log('Inserting enrollments...');
    await db.insert(schema.enrollments).values(enrollmentData).onConflictDoNothing();

    console.log('✅ Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
