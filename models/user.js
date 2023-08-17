const mongoose = require('mongoose')
const product = require('./product')

const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product', 
                    required: true
                }, 
                quantity: {
                    type: Number, 
                    required: true
                }
            }
        ],
    }
})

userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp =>{
      return cp.productId.toString() === product._id.toString()
    })
    let newQuantity = 1
    const updatedCartItem = [...this.cart.items]
    if(cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1
      updatedCartItem[cartProductIndex].quantity = newQuantity
    } else {
      updatedCartItem.push({
        productId: product._id, 
        quantity: newQuantity
    })
    }
    const updatedCart = {
        items: updatedCartItem
    }
    this.cart = updatedCart
    return this.save()
}

userSchema.methods.increaseAmount = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
    })
    this.cart.items[cartProductIndex].quantity += 1
    return this.save()
}

userSchema.methods.decreaseAmount = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
    })
    if (this.cart.items[cartProductIndex].quantity > 1) {
        this.cart.items[cartProductIndex].quantity -= 1
    } else {
        this.cart.items[cartProductIndex].quantity = 1
    }
    return this.save()
}

userSchema.methods.deleteCartProduct = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => item.productId.toString() !== productId.toString())
    this.cart.items = updatedCartItems
    return this.save()
}

userSchema.methods.addOrder = function() {
    return this.cart.items
}

userSchema.methods.ClearCart = function() {
    this.cart = {items: []}
    return this.save()
}

module.exports = mongoose.model('User', userSchema)

