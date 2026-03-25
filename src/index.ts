import AgentAPI from 'apminsight';
AgentAPI.config()

import express from 'express';
import cors from "cors";
import subjectsRouter from './routes/subjects.js';
import usersRouter from './routes/users.js';
import classesRouter from './routes/classes.js';
import departmentsRouter from "./routes/departments.js";
import securityMiddleware from './middleware/security.js';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error('Frontend_URL is not set in .env file');

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}))

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(authMiddleware);

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)
app.use("/api/departments", departmentsRouter);

app.use(securityMiddleware);

app.get('/', (req, res) => {
    res.send('hello')
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});