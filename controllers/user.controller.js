const db = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const ACCESS_TOKEN_SECRET = 'vasilukmother';
const REFRESH_TOKEN_SECRET = 'vasilukmother';
let refreshTokens = [];

class UserController {
    async getUser(req, res) {
        const users = await db.query('SELECT * FROM users')
        res.json(users.rows)
    }

    async getOneUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const user = await db.query(
                `SELECT * FROM users WHERE id = $1`,
                [parseInt(id, 10)]
            );

            if (user.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching user' });
        }
    }

    async updateUser(req, res) {
        const {id, email, password} = req.body;
        const user = await db.query('UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING *', [email, password, id])
        res.json(user.rows[0])
    }

    async updateUserInitials(req, res) {
        const {id, name, surname, username} = req.body;
        const user = await db.query('UPDATE users SET name = $1, surname = $2, username = $3 WHERE id = $4 RETURNING *', [name, surname, username, id])
        res.json(user.rows[0])
    }

    async deleteUser(req, res) {
        const id = req.params.id;
        await db.query('DELETE FROM users WHERE id=$1', [id])
        res.json('successfully deleted')
    }

    async loginUser(req, res) {
        const { email, password } = req.body;

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Email and password must be strings' });
        }

        try {
            const user = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ error: 'User not found' });
            }

            const validPassword = await bcrypt.compare(password, user.rows[0].password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid password' });
            }

            const accessToken = jwt.sign({ email, id: user.rows[0].id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ email, id: user.rows[0].id }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

            refreshTokens.push(refreshToken);
            res.cookie('accessToken', accessToken, { httpOnly: false, secure: false, sameSite: 'Strict', path: '/' });
            res.cookie('refreshToken', refreshToken, { httpOnly: true });

            res.json({ message: 'Login successful', accessToken, userId: user.rows[0].id });
        } catch (err) {
            console.error('Error logging in user:', err);
            res.status(500).json({ error: err.message });
        }
    }

    async registrUser(req, res) {
        const { email, password, name, surname } = req.body;
        try {
            const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newPerson = await db.query(
                'INSERT INTO users (email, password, username, name, surname) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [email, hashedPassword, email, name, surname]
            );

            const userId = newPerson.rows[0].id;

            // Define parent categories
            const parentCategories = [
                { name: 'Еда' },
                { name: 'Транспорт' },
                { name: 'Доход' },
            ];

            // Insert parent categories and store their IDs
            const parentCategoryIds = {};
            for (const category of parentCategories) {
                const insertedCategory = await db.query(
                    'INSERT INTO categories (name, user_id, parent_id) VALUES ($1, $2, $3) RETURNING id',
                    [category.name, userId, null]
                );
                parentCategoryIds[category.name] = insertedCategory.rows[0].id;
            }

            // Define child categories with their parent names
            const childCategories = [
                { name: 'Продукты', parent_name: 'Еда' },
                { name: 'Рестораны', parent_name: 'Еда' },
                { name: 'Мойка', parent_name: 'Транспорт' },
                { name: 'Заправка', parent_name: 'Транспорт' },
                { name: 'Зарплата', parent_name: 'Доход' },
                { name: 'Алименты', parent_name: 'Доход' },
            ];

            // Insert child categories using parent IDs
            for (const category of childCategories) {
                const parentId = parentCategoryIds[category.parent_name];
                await db.query(
                    'INSERT INTO categories (name, user_id, parent_id) VALUES ($1, $2, $3)',
                    [category.name, userId, parentId]
                );
            }

            const accessToken = jwt.sign({ email }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
            refreshTokens.push(refreshToken);
            res.cookie('refreshToken', refreshToken, { httpOnly: true });
            res.json({ accessToken });
        } catch (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ error: err.message });
        }
    }

    tokenUser(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken || !refreshTokens.includes(refreshToken)) {
            return res.sendStatus(403);
        }
        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            const accessToken = jwt.sign({ email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            res.json({ accessToken });
        });
    }

    async sendPasswordResetEmail(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        try {
            const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiration = new Date(Date.now() + 3600000); // Token valid for 1 hour

            await db.query(
                'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.rows[0].id, token, expiration]
            );

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'dpgombergfiles@gmail.com',
                    pass: 'cixu scoy msui bvlj',
                },
            });

            const resetLink = `https://dmitrygomberg.github.io/bonum-front/#/reset-password?token=${token}`;
            await transporter.sendMail({
                to: email,
                subject: 'Сброс пароля Bonum',
                text: `Нажмите на ссылку чтобы сбросить пароль: ${resetLink}`,
            });

            res.json({ message: 'Password reset email sent' });
        } catch (error) {
            console.error('Error sending password reset email:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async resetPassword(req, res) {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        try {
            const resetEntry = await db.query(
                'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()',
                [token]
            );

            if (resetEntry.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, resetEntry.rows[0].user_id]
            );

            await db.query('DELETE FROM password_resets WHERE token = $1', [token]);

            res.json({ message: 'Password successfully reset' });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new UserController();