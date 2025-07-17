const Router = require('express');
const router = new Router();
const categoriesController = require('../controllers/categories.controller');

// создание категории
router.post('/createCategory', categoriesController.createCategory);

// редактирование категории
router.put('/editCategory', categoriesController.editCategory);

// удаление категории
router.delete('/deleteCategory', categoriesController.deleteCategory);

// получение категории
router.get('/getCategory', categoriesController.getCategory);

// получение категорий пользователя
router.get('/getAllCategories', categoriesController.getAllCategories);


module.exports = router;