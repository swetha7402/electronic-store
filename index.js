
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const session = require('express-session');

const {check, validationResult} = require('express-validator'); 
const e = require('express');

// connect to mongoose database and creating the database name 
mongoose.connect('mongodb://localhost:27017/electronics',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
 
// creating the  model for the database for send the information 
const elec = mongoose.model('elec', {
    Name : String,
    Membership : String,
    vedio : Number,
    camera : Number,
    monitors : Number,
    subtotal : Number,
    total : Number
});

//creating the another model to login and perform the operations on the database
const customer = mongoose.model('customer', {
    customername: String,
    customerpassword : String
});

var myApp = express();

//creating the session 
myApp.use(session({
    secret: 'showcase',
    resave: false,
    saveUninitialized: true
}));


myApp.use(express.urlencoded({extended:false})); 
myApp.use(fileUpload());
 
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');

var NumberRegex = /^([A-Z][0-9]){3}-([A-Z][A-Z][0-9]){3} -([0-9][0-9][0-9]){3}$/;
var iRegular = /^\d$/;
//rendering the home page here 
myApp.get('/',function(req, res){
    res.render('home');
});
myApp.get('/',function(req, res){
    res.render('info');
});

//rendering the login page here
myApp.get('/login',function(req, res){
   res.render('login'); });

//writing the code for login into the account 
   myApp.post('/login', function(req, res){
    // accessing the clientname and clientpassword
    var customername = req.body.customername;
    var  customerpassword= req.body.customerpassword;

    // finding details in the database
    customer.findOne({customername:customername, customerpassword: customerpassword}).exec(function(err, customer){
        // seting up the session variables for logged in for customers
        console.log('Errors: ' + err);
        if(customer){
            req.session.customername = customer.customername; //matching the credentials 
            req.session.loggedIn = true;
            // redirect to dashboard
            res.redirect('/dashboard');
        }
        else{
            res.redirect('/login'); // if you want to  redirect the user to login
            // along with  rendering login form with errors
        }
    });
});

//rendring the dashboard data
myApp.get('/dashboard',function(req, res){
    if(req.session.loggedIn){ // displaying all the entered data
        elec.find({}).exec(function(err, Elec){
            console.log(err); // displaying the errors in the console
            console.log(Elec);
            res.render('dashboard', {Elec:Elec}); 
        });
    }
    else{
        res.redirect('/login'); // redirecting to the login page 
    }
});

myApp.get('/logout', function(req, res){
    // delete  the whole session
    req.session.customername = ''; //here we are just resetting the whole data to null
    req.session.loggedIn = false;
    res.redirect('/login');
});

//printing the data by id 
myApp.get('/print/:elecid', function(req, res){
    
    var elecId = req.params.elecid;
    elec.findOne({_id: elecId}).exec(function(err, elec){ // finding the data by id
        res.render('elec', elec); // rendering elec.ejs with the data from data
    });
})



//deleting the data by finding an deleting the id
myApp.get('/delete/:elecid', function(req, res){
//this will delete the data premenantly
    var elecId = req.params.elecid;
    elec.findByIdAndDelete({_id: elecId}).exec(function(err, elec){
        res.render('elec', elec); // displaying the removing page after deleting the data
    });
})

// view just display the whole data of the entered forrm again
myApp.get('/view/:elecid', function(req, res){
    
    var elecId = req.params.elecid;
    elec.findOne({_id: elecId}).exec(function(err, elec){
        res.render('view', elec); // render view.ejs with data from data
    });
})


 // first we validate this and passing this process information to the editprocess
myApp.post('/process',[
    check('Name', 'Please enter your name').notEmpty(),//checking whether the name is empty or not if y displays error
    check('Membership', 'Please enter a  Membershipnumber'),//validating the membership  is empty or not
    check('vedio', 'Please enter number only ').matches(iRegular),
    check('camera', 'Please enter number only').matches(iRegular),
    check('monitors', 'Please enter number only').matches(iRegular)
], function(req,res){

    // checks the  errors
    const errors = validationResult(req);
    console.log(errors); // print the errors for the console
    if(!errors.isEmpty()) // if error is not empty execute the condition below 
    {
        res.render('home',{err: errors.array()});
    }
    
    else // if the errors are null execute the below data
    {
        //fetch all the data fields
        var Name = req.body.Name; // the main name attribute 
        var Membership = req.body.Membership;
        var vedio = req.body.vedio;
        var camera = req.body.camera;
        var monitors = req.body.monitors;
        
        const vediocost = 49.98; // declaring costs for the items
        const cameracost = 149.49;
        const monitorcost = 99.9
        var tax = 1.13; 
        var subtotal = vedio * vediocost + camera * cameracost + monitors * monitorcost; 
        var  total = subtotal + tax;
       
        // creating an object with the data to send to the view
        var pageData = {
            Name : Name,
            Membership : Membership,
            vedio : vedio,
            camera : camera,
            monitors : monitors,
            subtotal : subtotal,
            tax : tax,
            total : total,
        }

        // creating an object from the model to save to monog db
        var elecs = new elec(pageData);
        // save it to monog db
            elecs.save();

        // send the data to the view and render it
        res.render('elec', pageData);
    }
});


// settingup routes

myApp.get('/setup', function(req, res){

    let customerdata = [
        {
             customername: 'swetha', // ceredentials for login
            customerpassword: 'swetha'
        }
    ]
    customer.collection.insertMany(customerdata);
    res.send('data added');
});
//setiting  the port
myApp.listen(8020);
console.log('Everything executed fine.. website at port http://localhost:8020/');