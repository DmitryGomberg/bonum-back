const db = require('../db');

class TransactionsController {
    async createNew(req, res) {
        try {
            const { description, date, type_id, category_id, account_id, user_id, sum, account_to_id, price_course } = req.body;

            const newTransaction = await db.query(
                `INSERT INTO transactions (description, date, type_id, category_id, account_id, user_id, sum, account_to_id, price_course) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [description, date, type_id, category_id, account_id, user_id, sum, account_to_id, price_course]
            );
            res.json(newTransaction.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating transaction' });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;
            const deletedTransaction = await db.query(
                `DELETE FROM transactions WHERE id = $1 RETURNING *`,
                [id]
            );
            if (deletedTransaction.rows.length === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            res.json(deletedTransaction.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting transaction' });
        }
    }
    async getTransactions(req, res) {
        try {
            const { user_id, account_id } = req.query;

            if (!user_id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            let query = `
            SELECT
                t.*,
                a.name AS source_account_name,
                c.name AS currency_type,
                cat.name AS category_name,
                at.name AS destination_account_name
            FROM transactions t
                     JOIN accounts a ON t.account_id = a.id
                     JOIN "currencyType" c ON a.currency_id = c.id
                     LEFT JOIN categories cat ON t.category_id = cat.id
                     LEFT JOIN accounts at ON t.account_to_id = at.id
            WHERE t.user_id = $1
        `;
            const params = [user_id];

            if (account_id) {
                query += ` AND (t.account_id = $2 OR t.account_to_id = $2)`;
                params.push(account_id);
            }

            query += ` ORDER BY t.date DESC`;

            const transactions = await db.query(query, params);

            res.json(transactions.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching transactions' });
        }
    }
}

module.exports = new TransactionsController();