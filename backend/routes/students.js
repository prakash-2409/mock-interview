const express = require('express');
const router = express.Router();
const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const { readDb, writeDb } = require('../jsonDb');

module.exports = () => {

    // GET /api/students - List all students with optional filters
    router.get('/', (req, res) => {
        try {
            const { search, department, class_section } = req.query;
            const db = readDb();
            
            let students = db.users.filter(u => u.role === 'student');

            if (search) {
                const searchLower = search.toLowerCase();
                students = students.filter(s => 
                    (s.name && s.name.toLowerCase().includes(searchLower)) || 
                    (s.email && s.email.toLowerCase().includes(searchLower)) || 
                    (s.roll_no && s.roll_no.toLowerCase().includes(searchLower))
                );
            }
            if (department) {
                students = students.filter(s => s.department === department);
            }
            if (class_section) {
                students = students.filter(s => s.class_section === class_section);
            }

            // Remove passwords from response
            students = students.map(({ password, ...rest }) => rest).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            res.json(students);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching students', error: error.message });
        }
    });

    // GET /api/students/count - Dashboard count
    router.get('/count', (req, res) => {
        try {
            const db = readDb();
            const count = db.users.filter(u => u.role === 'student').length;
            res.json({ total: count });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching count', error: error.message });
        }
    });

    // GET /api/students/template - Download CSV template
    router.get('/template', (req, res) => {
        const csvContent = 'S.No,Class,Roll No,Reg No,Name,Email\n1,A,24CS360,3123241040,SAMPLE STUDENT,24CS360@gmail.com\n';
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=student_template.csv');
        res.send(csvContent);
    });

    // POST /api/students - Create single student
    router.post('/', (req, res) => {
        try {
            const { name, email, reg_no, roll_no, department, class_section } = req.body;
            const password = reg_no;
            const db = readDb();

            if (db.users.some(u => u.email === email)) {
                return res.status(409).json({ message: 'A student with this email already exists' });
            }

            const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
            
            const newStudent = {
                id: newId,
                name,
                email,
                password,
                role: 'student',
                roll_no,
                reg_no,
                department,
                class_section
            };

            db.users.push(newStudent);
            writeDb(db);

            const { password: _, ...studentWithoutPassword } = newStudent;
            res.status(201).json({ message: 'Student created successfully', student: studentWithoutPassword });
        } catch (error) {
            res.status(500).json({ message: 'Error creating student', error: error.message });
        }
    });

    // POST /api/students/bulk - Bulk upload from CSV
    const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

    router.post('/bulk', upload.single('file'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const department = req.body.department || 'CSE';
            const csvFile = fs.readFileSync(req.file.path, 'utf8');
            const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

            if (parsed.errors.length > 0) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'CSV parsing error', errors: parsed.errors });
            }

            const db = readDb();
            let insertedCount = 0;
            let skippedCount = 0;
            const errors = [];
            
            let currentId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;

            for (const row of parsed.data) {
                const name = row['Name'] || row['name'] || '';
                const email = row['Email'] || row['email'] || '';
                const rollNo = row['Roll No'] || row['roll_no'] || row['RollNo'] || '';
                const regNo = row['Reg No'] || row['reg_no'] || row['RegNo'] || '';
                const classSection = row['Class'] || row['class'] || row['class_section'] || '';

                if (!name || !email) {
                    skippedCount++;
                    continue;
                }

                if (db.users.some(u => u.email === email.trim())) {
                    skippedCount++;
                    errors.push({ email, error: "Email already exists" });
                    continue;
                }

                db.users.push({
                    id: currentId++,
                    name: name.trim(),
                    email: email.trim(),
                    password: regNo.trim(),
                    role: 'student',
                    roll_no: rollNo.trim(),
                    reg_no: regNo.trim(),
                    department,
                    class_section: classSection.trim()
                });
                insertedCount++;
            }

            writeDb(db);
            fs.unlinkSync(req.file.path);

            res.status(201).json({
                message: `Bulk upload complete. ${insertedCount} students created, ${skippedCount} skipped.`,
                inserted: insertedCount,
                skipped: skippedCount,
                errors
            });
        } catch (error) {
            res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
        }
    });

    // PUT /api/students/:id/profile-pic - Update profile image
    router.put('/:id/profile-pic', (req, res) => {
        try {
            const { id } = req.params;
            const { profile_image } = req.body;
            const db = readDb();
            
            const studentIndex = db.users.findIndex(u => String(u.id) === String(id) && u.role === 'student');
            
            if (studentIndex === -1) {
                return res.status(404).json({ message: 'Student not found' });
            }
            
            db.users[studentIndex].profile_image = profile_image;
            writeDb(db);
            
            res.json({ message: 'Profile picture updated successfully', user: { id: db.users[studentIndex].id, profile_image } });
        } catch (error) {
            res.status(500).json({ message: 'Error updating profile picture', error: error.message });
        }
    });

    // DELETE /api/students/:id - Delete student
    router.delete('/:id', (req, res) => {
        try {
            const { id } = req.params;
            const db = readDb();
            
            db.users = db.users.filter(u => !(String(u.id) === String(id) && u.role === 'student'));
            // Remove test results as well
            db.test_results = db.test_results.filter(tr => String(tr.student_id) !== String(id));
            
            writeDb(db);
            res.json({ message: 'Student deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting student', error: error.message });
        }
    });

    return router;
};
