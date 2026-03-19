import express from 'express';
import cors from "cors";
import subjectsRouter from './routes/subjects';

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error('Frontend_URL is not set in .env file');

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

app.use(express.json());

app.use('/api/subjects', subjectsRouter)

app.get('/', (req, res) => {
    res.send('hello')
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});