import express from "express";
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ silent: process.env.NODE_ENV === 'production' });
const app = express();
const port = 5000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
//data base connect
const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "Transport-ease",
    password: process.env.dbPassword,
    port:5432,
    });
    db.connect();
const apiKey = process.env.apiKey; 

app.get("/", async (req, res) => {
    try {
        const response = await db.query("SELECT * FROM reviews WHERE stars >= 4 ");
        const data = response.rows;
        res.render("homepage.ejs", { data });  
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Error fetching data");
    }
});


// reviews page
app.post('/reviews', async (req, res) => {
    try {
      // Insert reviews into PostgreSQL database  
      await db.query("INSERT INTO reviews (name_of_student, review, stars) VALUES ($1, $2, $3)", [req.body.name, req.body.message,  JSON.parse(req.body.rating)]); 
      res.redirect('/');
    } catch (err) {
      console.error('Error submitting review:', err);
      res.status(500).send('Error submitting review');
    }
  });
    //registration
    app.get("/register" , (req,res) => {
        //render registration page
        res.render('registration.ejs',{
            apiKey : apiKey,
        });
        });
    app.post('/register-submit',async(req,res)=>{
            const student_name = req.body.fname;
            const grade = req.body.grade;
            const rollnum = req.body.rollnum;
            const parent_guardian_name = req.body.parentname;
            const contact_phone = req.body.phonenum;
            const contact_email = req.body.emailadd;
            const school_name = req.body.schoolname;
            const address = req.body.location;
            const pass = req.body.password;
        //hashing the password befor storing 
        const password = await bcrypt.hash(pass,13);
        //convert into coordinates
        const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                        address: address,
                        key: apiKey
                    }
                });
                // Extract latitude and longitude from the geocoding response
                const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
                const coordaddress = lat+","+lng;

            //*PENDING**use these coordinates to calculate which path is best for student and then add these coordinates to  respective route waypoint


        const response = await db.query("SELECT school_id FROM schools where school_name = $1",[school_name]);
        try{
            await db.query("INSERT INTO students (student_name,school_id,grade,parent_guardian_name,contact_phone,contact_email,verified,password,address,rollno,coordinates) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",[student_name,response.rows[0].school_id,grade,parent_guardian_name,contact_phone,contact_email,'FALSE',password,address,rollnum,coordaddress]);
        //if successfully registered then redirected to login page else redirect to register page with error messaage.
            res.redirect('/login');
        }
        catch(err){
            console.log(err.message);
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
        //student
        if(type === 'student'){
                try{
                        const response = await db.query("SELECT * FROM students WHERE contact_email = $1",[email]);
                        const passCheck = await bcrypt.compare(pass,response.rows[0].password);
                    const result = response.rows[0];
                        if(passCheck === true && response.rows[0].verified === true){
                        //route load from database
                    const busRouteResponse = await db.query("SELECT * from busroutes");
                    const busRouteResult = busRouteResponse.rows[0];
                    const origin = busRouteResult.origin;
                    const destination = busRouteResult.destination;
                    const waypointss = busRouteResult.waypoints;
                    const waypoints = [];
                    //converting it into correct format
                    for(var j=0;j<waypointss.length;j++){
                        const w = waypointss[j].split(',');
                        for(var i=0;i<w.length;i++){
                            waypoints.push({
                            lat : w[0],
                            lng : w[1]
                            });
                        }
                    }
             const start = {
               lat: parseFloat(origin.split(",")[0]),
               lng: parseFloat(origin.split(",")[1])
             };
             const end = {
               lat: parseFloat(destination.split(",")[0]),
               lng: parseFloat(destination.split(",")[1])
             };

                //call for origin
                var lati = parseFloat(origin.split(',')[0]);
                var lngi = parseFloat(origin.split(',')[1]);
                //conversion of coordinates to address
                const busrouteOrigin = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lati},${lngi}&key=${apiKey}`);
               //call destination
                lati = parseFloat(destination.split(',')[0]);
               lngi = parseFloat(destination.split(',')[1]);
               //conversion of coordinates to address
               const busrouteDestination = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lati},${lngi}&key=${apiKey}`);
                var busRoute = {
                    origin : busrouteOrigin.data.results[0].formatted_address,
                    destination : busrouteDestination.data.results[0].formatted_address
                   }
            var busSchedule = await db.query("SELECT day_of_week, departure_time, arrival_time FROM BusSchedule WHERE bus_id = ( SELECT DISTINCT b.bus_id FROM Students s JOIN BusReservations br ON s.student_id = br.student_id JOIN BusSchedule bs ON br.schedule_id = bs.schedule_id JOIN Buses b ON bs.bus_id = b.bus_id WHERE s.student_id = $1);",[result.student_id]);
            res.render("student_profile.ejs",{
                student_name : result.student_name,
                school_id : result.school_id,
                grade : result.grade,
                parent_guardian_name :result.parent_guardian_name,
                contact_phone: result.contact_phone,
                contact_email : result.contact_email,
                address : result.address,
                rollno : result.rollno,
                busSchedule : busSchedule.rows,
                busRoute : busRoute,
                start : start,
                end : end,
                waypoints : waypoints,
                apiKey : apiKey
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
//driver
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
app.listen(port,()=>{
    console.log(`listening on port the ${port}`);
});