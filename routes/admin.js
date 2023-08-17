const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is_auth');
const { body } = require('express-validator');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product',isAuth, adminController.getAddProduct);

// // /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',isAuth, [
    body('title').trim().notEmpty().withMessage('Vui lòng nhập tiêu đề'),
    // body('image').trim().notEmpty().withMessage('Vui lòng chọn hình ảnh'), 
    body('price').trim().notEmpty().withMessage('Vui lòng nhập giá tiền')
                .isNumeric().withMessage('Giá tiền phải là số'),
    body('description').trim().notEmpty().withMessage('Vui lòng nhập mô tả')
                        .isLength({min: 5, max: 400}).withMessage('Độ dài cho phép 5-400')
], adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);

router.post('/edit-product',isAuth, [
    body('title').trim().notEmpty().withMessage('Vui lòng nhập tiêu đề'),
   
    body('price').trim().notEmpty().withMessage('Vui lòng nhập giá tiền')
                .isNumeric().withMessage('Giá tiền phải là số'),
    body('description').trim().notEmpty().withMessage('Vui lòng nhập mô tả')
                    .isLength({min: 5, max: 400}).withMessage('Độ dài cho phép 5-400')
], adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
