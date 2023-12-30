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
    database : "Transport-ease",
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
//hashing the password befor storing 
const password = await bcrypt.hash(pass,13);
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
           const result = response.rows[0];
            if(passCheck === true && response.rows[0].verified === true){
                var busRoute = {
                    origin : "ranchi",
                    destination : "chaibasa"
                   }
                var busSchedule = [{day_of_week : "Monday",departure_time : "7:25 A.M",arrival_time: "7:20 A.M" },{day_of_week : "tuesday",departure_time : "7:25 A.M",arrival_time: "7:20 A.M" }];
            res.render("student_profile.ejs",{
                student_name : result.student_name,
                school_id : result.school_id,
                grade : result.grade,
                parent_guardian_name :result.parent_guardian_name,
                contact_phone: result.contact_phone,
                contact_email : result.contact_email,
                address : result.address,
                rollno : result.rollno,
                busSchedule : busSchedule,
                busRoute : busRoute
            })
            }
            else if(passCheck === true & response.rows[0].verified === false){
                res.render("not_verified.ejs")
            }
            else{
                res.render('login.ejs',{
                    error : "invalid username/password",
                });
            }
    }
    catch(err){
        console.log("error: " + err)
        res.render('login.ejs',{
            error : "invalid username/password",
        });
    }
}
else if(type === 'driver'){
    try{
   const response =await db.query("SELECT * FROM drivers WHERE contact_email=$1",[email]);
   const data = response.rows[0];
   if(pass == data.password){
    var busRoute = {
        origin : "ranchi",
        destination : "chaibasa"
       }
    var busSchedule = [{day_of_week : "Monday",departure_time : "7:25 A.M",arrival_time: "7:20 A.M" },{day_of_week : "tuesday",departure_time : "7:25 A.M",arrival_time: "7:20 A.M" }];
    res.render('profile.ejs', {
        nameOfDriver: data.driver_name,
        contactNumber: data.contact_phone,
        contactEmail: data.contact_email,
        LicenceEmail: data.contact_email,
        ExpiryDate: data.license_expiry,
        driverId: data.driver_id,
        LicenceNum: data.license_number,
        busSchedule : busSchedule,
        busRoute : busRoute
    });
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