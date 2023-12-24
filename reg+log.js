import express from "express";
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//data base connect
const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "",
    password:"",
    port:5432,
    });
    db.connect();

//registration
app.get("/register" , (req,res) => {
    //render registration page
    res.render('registration.ejs');
    });
app.post('/register-submit',async(req,res)=>{
const student_name = req.body.fname;
const grade = req.body.grade;
const rollnum = req.body.rollnum;
const parent_guardian_name = req.body.parentname;
const contact_phone = req.body.phonenum;
const contact_email = req.body.emailadd;
const school_name = req.body.schoolname;
const address = req.body.address;
const pass = req.body.password;
console.log(pass);
//hashing the password befor storing 
const password = await bcrypt.hash(pass,13);
console.log(password);
 const response = await db.query("SELECT school_id FROM schools where school_name = $1",[school_name]);
try{
    await db.query("INSERT INTO students (student_name,school_id,grade,parent_guardian_name,contact_phone,contact_email,verified,password,address,rollno) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[student_name,response.rows[0].school_id,grade,parent_guardian_name,contact_phone,contact_email,'FALSE',password,address,rollnum]);
   //if successfully registered then redirected to login page else redirect to register page with error messaage.
    res.redirect('/login');
}
catch(err){
    res.render('registration.ejs',{
        error : "Email/phone Number already in use",
    });
}
});

//login
app.get("/login",async (req,res)=>{
res.render("login.ejs");
});
app.post('/login',async (req,res)=>{
const email = req.body.email;
const pass = req.body.password;
const type = req.body.type;
if(type === 'student'){
    try{
        const response = await db.query("SELECT * FROM students WHERE contact_email = $1",[email]);
        const passCheck = await bcrypt.compare(pass,response.rows[0].password);
        if(passCheck == true){
            console.log("render student profile page");
        }
        else{
            res.render('login.ejs',{
                error : "invalid username/password",
            });
        }
    }
    catch(err){
        res.render('login.ejs',{
            error : "invalid username/password",
        });
    }
}
else if(type === 'driver'){
    try{
        const response = await db.query("SELECT * FROM drivers WHERE contact_email = $1",[email]);
        const passCheck = await bcrypt.compare(pass,response.rows[0].password);
        if(passCheck == true){
            console.log("render driver profile page");
        }
        else{
            res.render('login.ejs',{
                error : "invalid username/password",
            });
        }
    }
    catch(err){
        res.render('login.ejs',{
            error : "invalid username/password",
        });
    }
}
});

app.listen(port,()=>{
    console.log(`listening on port ${port}`);
});
