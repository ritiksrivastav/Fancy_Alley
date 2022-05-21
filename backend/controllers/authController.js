const User = require('../models/user')
const QRCode = require("../models/qrcode");
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const qrcode = require("../qrgenerator/qrcode");

// Register a new User => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req,res,next) => {
    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: 'scale' 
    })

    const {name, email, password} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar : {
            public_id: result.public_id,
            url: result.secure_url
        }
    })

    // Tokenizing a user
    sendToken(user, 200, res)

})

// Login User => /api/v1/login

exports.loginUser = catchAsyncErrors(async (req,res,next) => {
    const {email, password} = req.body;
    // Checks if email and password is entered by user

    if(!email || !password){
        return next(new ErrorHandler('Please enter email & password', 400))
    }

     // Finding user in database
    const user = await User.findOne({ email }).select('+password')

    if(!user){
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // check if password is correct or not 
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    sendToken(user, 200, res)

})

// generate the QR Code => /api/v1/qrgenerate
exports.generateQR = catchAsyncErrors(async (req,res,next)=>{
    const tokenID = crypto.randomBytes(15).toString("hex");
    // const tokenID = '65ff5ad823736b8f1f244e600a4a39';
    let dataURL=await qrcode(`https://fancyalley.herokuapp.com/api/v1/qr/${tokenID}`);
    const qr = await QRCode.create({
        tokenID,
    })

    res.status(200).send({dataURL,tokenID});
})

// Mobile will scan and send the info in this controller => /api/v1/qr/:tokenID
exports.verifyQR = catchAsyncErrors(async (req,res,next)=>{

    const {email} = req.body;
    const {tokenID} = req.param;

    console.log(email);
    const qr = await QRCode.findOneAndUpdate({tokenID : req.params.tokenID},{email : req.body.email},{new:true})

    if (!qr) {
      return next(
        new ErrorHandler("QRCode is expired, please refresh it again", 404)
      );
    }

    // console.log(qr);
    res.status(200).send("Success");
}
)

// after mobile is scanned this controller start the login process => /api/v1/loginqr
exports.loginQR = catchAsyncErrors(async (req,res,next)=>{
    const {tokenID} = req.params;

    const qr = await QRCode.findOne({tokenID : tokenID});
    
    if (!qr) {
      return next(new ErrorHandler("QRCode is expired, please refresh it again", 404));
    }
    // console.log(qr.email)
    const user = await User.findOne({email : qr.email});
    // console.log(user);
    if(user == null)
        res.status(200).send(user);
     
    sendToken(user, 200, res);
})


// forgot password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req,res,next)=>{

    const user = await User.findOne({ email: req.body.email });

    if(!user){
        return next(new ErrorHandler('User not found with this email', 404));
    }

    // get Reset token

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false})
    
    // create reset password url
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`

    const message = `Your password reset token is as follows: \n\n${resetUrl}\n\n
    If you have not requested this mail, then ignore it.`

    try{

        await sendEmail({
            email: user.email,
            subject: 'Fancy Alley - Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false})

        return next(new ErrorHandler(error.message, 500))

    }

})


// Reset password => /api/v1/password/forgot
exports.resetPassword = catchAsyncErrors(async (req,res,next)=>{

    // Hash URL Token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user){
        return next(new ErrorHandler('Password reset token is invalid or has been expired.', 400))
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler('Password does not match', 400))
    }

    // Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res)

})

// Get currently logged in user details => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req,res,next)=> {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
        success: true,
        user
    })
})


// Update // Change Password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findById(req.user.id).select('+password')

    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if(!isMatched){
        return next(new ErrorHandler('Old Password is incorrect.', 400 ));
    }
    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res) 
})

// Update user profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req,res,next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.mail
    }

    // Update Avatar: TODO
    if(req.body.avatar !== ''){
        const user = await User.findById(req.user.id)

        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id)        

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: 'scale' 
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})



// Logout user => /api/v1/logout

exports.logout = catchAsyncErrors(async (req,res,next)=> {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Logged out '
    })
})

// Admin Routes

// Get all users
exports.allUsers = catchAsyncErrors(async (req,res,next)=>{
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})

// Get User Details => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findById(req.params.id);
    
    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})

// Update user profile => /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req,res,next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    // Update Avatar: TODO

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

// Delete User => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findById(req.params.id);
    
    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

    await user.remove();
    
    res.status(200).json({
        success: true,
    })
})