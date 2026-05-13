const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the AI Recipe Generator API!' });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
