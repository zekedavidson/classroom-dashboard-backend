import express from 'express';
import subjectsRouter from './routes/subjects';

const app = express();
const PORT = 8000;

app.use(express.json());

app.use('/api/subjects', subjectsRouter)

app.get('/', (req, res) => {
    res.send('hello')
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});