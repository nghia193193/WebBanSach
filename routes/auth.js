const express = require('express')
const {check, body} = require('express-validator')
const path = require('path')
const User = require('../models/user')

const authController = require('../controllers/auth')

const router = express.Router()

router.get('/login', authController.GetLoginPage)
router.post('/login', [
    check('email').trim().notEmpty().withMessage('Vui lòng nhập Email')
                .isEmail().withMessage('Email không hợp lệ')
                .normalizeEmail()
                .custom((value, {req}) => {
                    return User.findOne({ email: value })
                    .then(user => {
                        if (!user) {
                            return Promise.reject('Email không tồn tại')
                        }
                    })
                }),
    body('password').trim().notEmpty().withMessage('Vui lòng nhập mật khẩu')
],authController.PostLogin)

router.post('/logout', authController.PostLogout)
router.get('/signup', authController.GetSignupPage)

router.post('/signup', [
    body('username').trim().notEmpty().withMessage('Vui lòng nhập tên')
                    .isAlphanumeric().withMessage('Chỉ gồm chữ cái và số'),
    check('email').trim().notEmpty().withMessage('Vui lòng nhập Email')
                .isEmail().withMessage('Email không hợp lệ')
                .normalizeEmail()
                .custom((value, {req}) => {
                    return User.findOne({email: value})
                    .then(userDoc => { //user có thể trả về có user or undefined
                        if (userDoc) {
                            return Promise.reject('Email đã tồn tại vui lòng nhập email khác')
                        }
                    })
                }),
    body('password').trim().notEmpty().withMessage('Vui lòng nhập mật khẩu')
                    .isLength({min: 8}).withMessage('Mật khẩu phải có độ dài 8 ký tự trở lên'),
        // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
        // .withMessage('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt, 1 ký tự thường, và 1 ký tự in hoa')
    body('confirmPassword').trim().notEmpty().withMessage('Vui lòng nhập lại mật khẩu')
                .custom((value, {req}) => {
                    if (value !== req.body.password) {
                        throw new Error('Mật khẩu xác nhận không chính xác')
                    }
                    return true
                })
], authController.PostSignup)

router.post('/signup/otp', authController.PostSignUpOtp)
router.post('/signup/otp/resend', authController.PostResendOtp)

router.get('/reset', authController.GetReset)
router.post('/reset', authController.PostReset)
router.get('/reset/:token', authController.GetUpdatePassword)
router.post('/update_password', authController.PostUpdatePassword)

module.exports = router