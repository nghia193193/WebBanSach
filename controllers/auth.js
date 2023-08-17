const bcrypt = require('bcryptjs')
const User = require('../models/user')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const { validationResult } = require('express-validator')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'nguyennghia193913@gmail.com',
        pass: 'rtasipfgjrhvcwdj'
    }
})

exports.GetLoginPage = (req, res, next) => {
    let succMessage = req.flash('success')
    succMessage = succMessage.length > 0 ? succMessage[0] : null
    let errMessage = req.flash('error')
    errMessage = errMessage.length > 0 ? errMessage[0] : null
    res.render('auth/login', {
        pageTitle: 'Login page',
        path: '/login',
        errMessage: errMessage,
        succMessage: succMessage,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
}

exports.PostLogin = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/login', {
            pageTitle: 'Login page',
            path: '/login',
            errMessage: '',
            succMessage: '',
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        })
    }
    User.findOne({email: email})
        .then(user => {
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.user = user
                        req.session.isLoggedIn = true
                        return req.session.save(err => {
                            console.log(err)
                            res.redirect('/')
                        })
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: 'Login page',
                        path: '/login',
                        errMessage: '',
                        succMessage: '',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: [{path: 'password',msg: 'Mật khẩu không chính xác'}]
                    })
                })
                .catch(err => {
                    console.log(err)
                    res.redirect('/login')
                })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
          });
}

exports.PostLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err)
        res.redirect('/')
    })
}

exports.GetSignupPage = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup page',
        path: '/signup',
        oldInput: {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    })
}

exports.PostSignup = (req, res, next) => {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req)
    const otp = Math.floor(Math.random()*1000000)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup page',
            path: '/signup',
            oldInput: { 
                username: username, 
                email: email,   
                password: password, 
                confirmPassword: req.body.confirmPassword 
            },
            validationErrors: errors.array()
        })
    }
    bcrypt.hash(password, 12)
        .then(hashPassword => {
            const user = new User({
                username: username,
                email: email,
                password: hashPassword,
                cart: { items: [] }
            })
            // user.save()
            return user
        })
        .then(user => {
            req.session.tempUser = user
            req.session.otp = otp
            req.session.tempEmail = email
            res.render('auth/checkmail', {
                pageTitle: 'Mail was sent',
                path: '/checkmail',
                message: 'Chúng tôi đã gửi mã xác nhận về email của bạn vui lòng kiểm tra',
                errorMessage: ''
            })
            let mailDetails = {
                from: 'nguyennghia193913@gmail.com',
                to: email,
                subject: 'Register Account',
                html: ` Mã xác nhận đăng ký của bạn là <b>${otp}</b> `
            };
            transporter.sendMail(mailDetails, err => console.log(err))
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
          });
        
}

exports.PostSignUpOtp = (req, res, next) => {
    const digit1 = req.body.digit1
    const digit2 = req.body.digit2
    const digit3 = req.body.digit3
    const digit4 = req.body.digit4
    const digit5 = req.body.digit5
    const digit6 = req.body.digit6
    const postOtp = digit1.toString() + digit2 + digit3 + digit4 + digit5 + digit6
    console.log(postOtp, typeof(postOtp))
    console.log(req.session.numErrrors)
    console.log(req.session)
    if (postOtp === req.session.otp.toString()) {
        const user = new User(req.session.tempUser)
        return user.save()
            .then(result => {
                delete req.session.tempEmail
                delete req.session.tempUser
                delete req.session.otp
                req.flash('success', 'Đăng ký thành công vui lòng đăng nhập lại')
                res.redirect('/login')
            })
            .catch(err => {
                const error = new Error(err)
                error.httpStatusCode = 500
                return next(error)
              });
    }
    req.session.numErrrors ? req.session.numErrrors +=1 : 0
    console.log(req.session)
    // if (req.session.numErrrors >= 4) {
    //     return res.render('auth/checkmail', {
    //         pageTitle: 'Mail was sent',
    //         path: '/checkmail',
    //         message: 'Chúng tôi đã gửi mã xác nhận về email của bạn vui lòng kiểm tra',
    //         errorMessage: 'Mã xác nhận không chính xác vui lòng thử lại'
    //     })
    // }
    return res.render('auth/checkmail', {
        pageTitle: 'Mail was sent',
        path: '/checkmail',
        message: 'Chúng tôi đã gửi mã xác nhận về email của bạn vui lòng kiểm tra',
        errorMessage: 'Mã xác nhận không chính xác vui lòng thử lại'
    })
    
}

exports.PostResendOtp = (req, res, next) => {
    req.session.otp = Math.floor(Math.random()*1000000)
    res.render('auth/checkmail', {
        pageTitle: 'Mail was sent',
        path: '/checkmail',
        message: 'Chúng tôi đã gửi mã xác nhận về email của bạn vui lòng kiểm tra',
        errorMessage: ''
    })
    let mailDetails = {
        from: 'nguyennghia193913@gmail.com',
        to: req.session.tempEmail,
        subject: 'Register Account',
        html: `Mã xác nhận đăng ký của bạn là <b>${req.session.otp}</b>`
    };
    transporter.sendMail(mailDetails, err => console.log(err))
    console.log(req.session.otp)
}

exports.GetReset = (req, res, next) => {
    let errMessage = req.flash('error')
    errMessage = errMessage.length > 0 ? errMessage[0] : null
    res.render('auth/reset_password', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errMessage: errMessage
    })
}

exports.PostReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err)
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'Email không tồn tại')
                    return res.redirect('/reset')
                }
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save()
                    .then(result => {
                        res.render('auth/checkmail', {
                            pageTitle: 'Mail was sent',
                            path: '/checkmail',
                            message: 'Chúng tôi đã gửi xác nhận về email của bạn vui lòng kiểm tra'
                        })
                        let mailDetails = {
                            from: 'nguyennghia193913@gmail.com',
                            to: req.body.email,
                            subject: 'Password Reset',
                            html: `
                                You requested a password reset
                                Click this link <b>http://localhost:3000/reset/${token}</b> to set a new password                 
                            `
                        };
                        transporter.sendMail(mailDetails, err => console.log(err))

                    })
            })
            .catch(err => {
                const error = new Error(err)
                error.httpStatusCode = 500
                return next(error)
              });
    })
}

exports.GetUpdatePassword = (req, res, next) => {
    const token = req.params.token
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                req.flash('error', 'Hết thời hạn đổi mật khẩu vui lòng tạo yêu cầu mới')
                return res.redirect('/login')
            }
            let errMessage = req.flash('error')
            errMessage = errMessage.length > 0 ? errMessage[0] : null
            res.render('auth/update_password', {
                pageTitle: 'Update Password',
                path: '/update_password',
                errMessage: errMessage,
                userId: user._id.toString(),
                resetToken: token
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
          });

}

exports.PostUpdatePassword = (req, res, next) => {
    const newPassword = req.body.new_password
    const confirmedPassword = req.body.confirmed_password
    const userId = req.body.userId
    const resetToken = req.body.resetToken
    User.findOne({ resetToken: resetToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            if (!user) {
                req.flash('error', 'Hết thời hạn đổi mật khẩu vui lòng tạo yêu cầu mới')
                return res.redirect('/login')
            }
            if (confirmedPassword !== newPassword) {
                req.flash('error', 'Mật khẩu xác nhận không đúng')
                return res.redirect(`/reset/${resetToken}`)
            }
            bcrypt.compare(newPassword, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.flash('error', 'Mật khẩu mới trùng với mật khẩu cũ')
                        return res.redirect(`/reset/${resetToken}`)
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashPassword => {
                            user.password = hashPassword
                            user.resetToken = undefined
                            user.resetTokenExpiration = undefined
                            return user.save()
                        })
                        .then(result => {
                            req.flash('success', 'Đổi mật khẩu thành công vui lòng đăng nhập lại')
                            res.redirect('/login')
                        })
                })
                .catch(err => {
                    console.log(err)
                    res.redirect(`/reset/${resetToken}`)
                })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
          });

}