const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // Serve static files

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Create connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: '', // replace with your MySQL password
    database: 'harvestxpert'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('MySQL connected...');
});

// Generate a random 6-digit number
const generateRandomNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate userId based on user type
const generateUserId = (userType) => {
    const prefix = userType === 'Farmer' ? 'F' : 'T';
    const randomNumber = generateRandomNumber();
    return prefix + randomNumber;
};

// Add a new user and insert into farmer or trader table based on userType
app.post('/api/register', (req, res) => {
    const { userName, userType, password } = req.body;

    if (!userName || !userType || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const userId = generateUserId(userType); // Assuming generateUserId function generates unique userId
    const authSql = 'INSERT INTO auth (userId, userName, userType, password) VALUES (?, ?, ?, ?)';
    let specificUserSql = '';

    switch (userType) {
        case 'Farmer':
            specificUserSql = 'INSERT INTO farmer (userId) VALUES (?)';
            break;
        case 'Trader':
            specificUserSql = 'INSERT INTO trader (userId) VALUES (?)';
            break;
        default:
            return res.status(400).json({ message: 'Invalid usertype' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error beginning transaction: ', err);
            return res.status(500).json({ message: 'Error beginning transaction', error: err });
        }

        // Insert into auth table
        db.query(authSql, [userId, userName, userType, password], (err, authResult) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error inserting into auth table: ', err);
                    return res.status(500).json({ message: 'Error inserting into auth table', error: err });
                });
            }

            // Insert into specific user table (farmer or trader)
            db.query(specificUserSql, [userId], (err, specificUserResult) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error inserting into specific user table: ', err);
                        return res.status(500).json({ message: 'Error inserting into specific user table', error: err });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Error committing transaction: ', err);
                            return res.status(500).json({ message: 'Error committing transaction', error: err });
                        });
                    }
                    res.json({ userId, userName, userType });
                });
            });
        });
    });
});


// Login endpoint
app.post('/api/login', (req, res) => {
    const { userName, password, userType } = req.body;

    if (!userName || !password || !userType) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const sql = 'SELECT * FROM auth WHERE userName = ? AND password = ? AND userType = ?';
    db.query(sql, [userName, password, userType], (err, results) => {
        if (err) {
            console.error('Error querying user: ', err);
            return res.status(500).json({ message: 'Error querying user', error: err });
        }

        if (results.length > 0) {
            // Store user information in session
            req.session.userId = results[0].userId;
            req.session.userName = results[0].username;
            req.session.userType = results[0].usertype;
            res.json({ message: 'Login successful', userId: req.session.userId });
        } else {
            res.status(401).json({ message: 'Invalid username, password, or user type' });
        }
    });
});

// Check session endpoint
app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId, userName: req.session.userName, userType: req.session.userType });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get all harvest records
app.get('/api/harvestxpert', (req, res) => {
    const sql = 'SELECT * FROM harvestxpert';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching harvest records: ', err);
            return res.status(500).json({ message: 'Error fetching harvest records', error: err });
        }
        res.json(results);
    });
});

// Add a new harvest record
app.post('/api/harvestxpert', (req, res) => {
    const { name, address, contact, username, harvest_type, amount, predicted_price } = req.body;
    const sql = 'INSERT INTO harvestxpert (name, address, contact, username, harvest_type, amount, predicted_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, address, contact, username, harvest_type, amount, predicted_price], (err, result) => {
        if (err) {
            console.error('Error inserting harvest record: ', err);
            return res.status(500).json({ message: 'Error inserting harvest record', error: err });
        }
        res.json({ id: result.insertId, ...req.body });
    });
});

// Serve the main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

app.get('/harvest', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'harvest.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
