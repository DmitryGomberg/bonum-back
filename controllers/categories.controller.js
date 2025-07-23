const db = require('../db.js');

class CategoriesController {
    async createCategory(req, res) {
        const { name, icon, user_id, parent_id } = req.body;

        if (!name || !user_id) {
            return res.status(400).json({ message: 'Name, and user_id are required' });
        }

        try {
            const newCategory = await db.query(
                'INSERT INTO categories (name, icon, user_id, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, icon, user_id, parent_id]
            );
            res.status(201).json(newCategory.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating category' });
        }
    }

    async editCategory(req, res) {
        const { id, name, icon, user_id } = req.body;

        if (!id || !name || !icon || !user_id) {
            return res.status(400).json({ message: 'ID, name, icon, and user_id are required' });
        }

        try {
            const updatedCategory = await db.query(
                'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
                [name, icon, id, user_id]
            );

            if (updatedCategory.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found or no changes made' });
            }

            res.status(200).json(updatedCategory.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error editing category' });
        }
    }

    async deleteCategory(req, res) {
        const { id, user_id } = req.body;

        if (!id || !user_id) {
            return res.status(400).json({ message: 'ID and user_id are required' });
        }

        try {
            // Delete all child categories recursively
            await db.query(
                'WITH RECURSIVE child_categories AS ( \
                    SELECT id FROM categories WHERE id = $1 \
                    UNION ALL \
                    SELECT c.id FROM categories c \
                    INNER JOIN child_categories cc ON c.parent_id = cc.id \
                ) \
                DELETE FROM categories WHERE id IN (SELECT id FROM child_categories)',
                [id]
            );

            res.status(200).json({ message: 'Category and its children successfully deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting category' });
        }
    }
    async getCategory(req, res) {
        const { id, user_id } = req.query;

        if (!id || !user_id) {
            return res.status(400).json({ message: 'ID and user_id are required' });
        }

        try {
            const category = await db.query(
                'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (category.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }

            res.status(200).json(category.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching category' });
        }
    }
    async getAllCategories(req, res) {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            const categories = await db.query(
                `WITH RECURSIVE category_hierarchy AS (
                SELECT id, name, icon, parent_id, 0 AS level
                FROM categories
                WHERE parent_id IS NULL AND user_id = $1
                UNION ALL
                SELECT c.id, c.name, c.icon, c.parent_id, ch.level + 1
                FROM categories c
                INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
                WHERE c.user_id = $1
            )
            SELECT * FROM category_hierarchy
            ORDER BY level, parent_id NULLS FIRST, id`,
                [user_id]
            );

            res.status(200).json(categories.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching categories' });
        }
    }
}

module.exports = new CategoriesController();