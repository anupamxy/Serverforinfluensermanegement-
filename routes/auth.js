const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

//to hide and save from hackers
//encryption
const JWT_SECRET = 'harekrishna@123';

//Route1:
//create a user using : POST "/api/auth/createuser" Doesnot require auth or no login required


router.post('/createuser', [
    body('name','Enter a valid name').isLength({min: 3}),
    body('email','Enter a valid email').isEmail(),
    body('password','Enter a strong password').isLength({min: 8}),
], async(req,res)=>{
    let success = false;
    //if there are error return bad request and errrors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ success,errors: errors.array() });
    }

//check whether the user exist with this email
try{

let user = await User.findOne({email:req.body.email});
if(user){
    return res.status(400).json({success,error : 'Sorry a user with this email exist '})
}

//adding salt to password
const salt = await bcrypt.genSalt(10);
secPass= await bcrypt.hash(req.body.password,salt);
//create a new user
     user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,

    });

    const data = {
        user:{
            id: user.id
        }
    }


    //to encrypt
    const authtoken = jwt.sign(data,JWT_SECRET);
    
    
    //    res.json({user});
    success=true;
    res.json({success,authtoken});

    //catch errors
}catch(error){
    console.log(error.message);
    res.status(500) .send("Internal Server Error")
}

})



//Route2:
//2nd end point // authenticate user using POST "/api/auth/login"
router.post('/login', [
    body('email','Enter a valid email').isEmail(),
    body('password','Password cannot be blank').exists(),
], async(req,res)=>{
    let success = false;
//if there are error return bad request and errrors
const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
}

const {email,password} = req.body;
try{
    let user = await User.findOne({email});
    if(!user){
        success=false;
        return res.status(400).json({ error: "Try to login with correct credetials"});
    }
    
    const passwordCompare =await bcrypt.compare(password,user.password);
    if(!passwordCompare){
        success=false;
        return res.status(400).json({ success,error: "Try to login with correct credetials"});
    }

    const data = {
        user:{
            id: user.id
        }
    }
    //to encrypt
    const authtoken = jwt.sign(data,JWT_SECRET);
    //    res.json({user});
    success=true;
    res.json({success,authtoken});


}catch(error){
    console.log(error.message);
    res.status(500) .send("Internal Server Error")
}


})



//Route3:
//3rd end point // get user details using POST "/api/auth/getuser" , login required
router.post('/getuser',fetchuser, async(req,res)=>{
try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');   
    res.send(user); 
}catch(error){
    console.log(error.message);
    res.status(500) .send("Internal Server Error")
}
})


module.exports = router