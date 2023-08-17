const mongodb = require('mongodb')
const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file')
const Variable = require('../util/variable')

exports.getAddProduct = (req, res, next) => {
  const errors = validationResult(req)
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    oldInput: {
      title: '',
      imageUrl: '',
      price: '',
      description: ''
    },
    validationErrors: errors.array()
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image)
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      oldInput: {
        title: title,
        price: price,
        description: description
      },
      validationErrors: [{path: 'image', msg: 'Tệp đính kèm không phải ảnh cho phép'}],
    })
  }
  const imageUrl = image.path
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors.array())
    fileHelper.deleteFile(imageUrl)
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      oldInput: {
        title: title,
        price: price,
        description: description
      },
      validationErrors: errors.array(),
    })
  }
  
  const product = new Product({
    title: title, 
    price: price, 
    description: description, 
    imageUrl: imageUrl,
    userId: req.user
  })
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const errors = validationResult(req)
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  
    Product.findById(prodId)  
    .then(product => {
      if (!product) {
        return res.redirect('/')
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        validationErrors: errors.array()
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const image = req.file;
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      product: {
        _id: prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc
      },
      validationErrors: errors.array(),
    })
  }
  Product.findById(prodId).then(product => {
    product.title = updatedTitle
    product.price = updatedPrice
    product.description = updatedDesc
    if (image) {
      fileHelper.deleteFile(product.imageUrl)
      product.imageUrl = image.path
    }
    product.save()
  })
  .then(result => {
    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems
  Product.find().countDocuments().then(numProduct => {
    totalItems = numProduct
    return  Product.find()
                  .skip((page - 1) * Variable.itemsPerPage)
                  .limit(Variable.itemsPerPage)
  })
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      currentPage: page,
      hasNextPage: Variable.itemsPerPage * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / Variable.itemsPerPage)
    });
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById({_id: prodId})
    .then(product => {
      if (!product) {
        return next(new Error('Product not found'))
      }
      fileHelper.deleteFile(product.imageUrl)
      return  Product.findByIdAndDelete(prodId)
    })
    .then(result => {
      console.log('Deleted');
      res.status(200).json({message: 'Success!'})
    })
    .catch(err => {
      res.status(500).json({message: 'Deleting product failed!'})
    });
};
