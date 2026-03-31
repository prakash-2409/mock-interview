const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const { readDb, writeDb } = require('./jsonDb.js');
const studentsRoutes = require('./routes/students.js');
const testsRoutes = require('./routes/tests.js');
const resultsRoutes = require('./routes/results.js');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount route modules - no need for pool anymore
app.use('/api/students', studentsRoutes());
app.use('/api/tests', testsRoutes());
app.use('/api/results', resultsRoutes());

// Seed data route - restores initial DB state for db.json
app.get('/api/seed', async (req, res) => {
    try {
        const initialDbState = {
            "users": [
                { "id": 1, "email": "admin@gmail.com", "password": "123", "role": "admin", "name": "Admin" },
                { "id": 2, "email": "student@gmail.com", "password": "123", "role": "student", "name": "Demo Student", "department": "CSE", "class_section": "A", "roll_no": "24CS360", "reg_no": "3123241040" }
            ],
            "tests": [
                {
                    "id": 1,
                    "title": "Sample Quiz Test",
                    "description": "A basic quiz to test your knowledge.",
                    "test_type": "quiz",
                    "duration_minutes": 30,
                    "created_by": 1,
                    "is_published": true,
                    "created_at": new Date().toISOString(),
                    "questions": [
                        { "question_number": 1, "question_text": "What is 2 + 2?", "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6", "correct_option": "B", "marks": 1 }
                    ]
                },
                {
                    "id": 2,
                    "title": "Sample Code Test",
                    "description": "Write a program that prints 'Hello World!' to the console.",
                    "test_type": "code",
                    "duration_minutes": 60,
                    "created_by": 1,
                    "is_published": true,
                    "created_at": new Date().toISOString(),
                    "problems": [
                        {
                            "problem_number": 1, "title": "Print Hello World", "description": "Print exactly 'Hello World!' without the quotes.",
                            "input_format": "None", "output_format": "Hello World!", "constraints_text": "None", "sample_input": "", "sample_output": "Hello World!", "marks": 10,
                            "test_cases": [ { "input": "", "expected_output": "Hello World!", "is_hidden": false } ]
                        }
                    ]
                }
            ],
            "test_results": []
        };
        
        writeDb(initialDbState);
        res.status(201).json({ message: 'JSON Database seeded successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error seeding database', error: error.message });
    }
});

// Login Route
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDb();

        const user = db.users.find(u => u.email === email);

        if (user && user.password === password) {
            res.json({
                _id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                profile_image: user.profile_image,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
