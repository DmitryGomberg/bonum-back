const db = require('../db.js');

class AccountsController {
    async getUserAccounts(req, res) {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            const accounts = await db.query(
                'SELECT * FROM accounts WHERE user_id = $1 ORDER BY id',
                [user_id]
            );
            res.json(accounts.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching accounts' });
        }
    }
    async addUserAccount(req, res) {
        const { name, value, currency_id, user_id } = req.body;

        if (!name || value == null || !currency_id || !user_id) {
            return res.status(400).json({ message: 'All fields are required: name, value, currency_id, user_id' });
        }

        try {
            const newAccount = await db.query(
                'INSERT INTO accounts (name, value, currency_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, value, currency_id, user_id]
            );
            res.status(201).json(newAccount.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error adding account' });
        }
    }
    async editUserAccount(req, res) {
        const {name, currency_id, user_id, account_id} = req.body;

        if (!name || !currency_id || !user_id || !account_id) {
            return res.status(400).json({message: 'Incorrect values on input'});
        }

        try {
            const editAccount = await db.query(
                'UPDATE accounts SET name = $1, currency_id = $2 WHERE user_id = $3 AND id = $4 RETURNING *',
                [name, currency_id, user_id, account_id]
            )
            if (editAccount.rows.length === 0) {
                return res.status(404).json({ message: 'Account not found or no changes made' });
            }
            res.status(200).json(editAccount.rows[0]);
        } catch (error) {
            console.error(error)
            res.status(500).json({message: 'Error editing account'})
        }
    }
    async deleteUserAccount(req, res) {
        const { account_id, user_id } = req.body;

        if (!account_id || !user_id) {
            return res.status(400).json({ message: 'Account ID and User ID are required' });
        }

        try {
            const deleteAccount = await db.query(
                'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *',
                [account_id, user_id]
            );

            if (deleteAccount.rows.length === 0) {
                return res.status(404).json({ message: 'Account not found or already deleted' });
            }

            res.status(200).json({ message: 'Account successfully deleted', account: deleteAccount.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting account' });
        }
    }
}

module.exports = new AccountsController();
