import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app=express();
const port=5000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));


// connecting to the data base
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"transportmadeeasy",
    password:"Algebra@1234",
    port:"5432"
});
db.connect();
app.get("/",(req,res)=>{
    res.render("login.ejs");
});

app.post("/login", async (req, res) => {
    const mail = req.body.email;
    const password = req.body.password;
    console.log(mail);
    console.log(password);

    let data = [];

    db.query("SELECT * FROM drivers WHERE contact_email =$1 ",[mail], (err, result) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            data = result.rows[0];
            console.log(data);
           
            console.log(rownum);
                res.render('profile.ejs', {
                    nameOfDriver: data.driver_name,
                    contactNumber: data.contact_phone,
                    contactEmail: data.contact_email,
                    LicenceEmail: data.contact_email,
                    ExpiryDate: data.license_expiry,
                    driverId: data.driver_id,
                    LicenceNum: data.license_number
                });
        }
    });
});














app.listen(port,()=>{
    console.log(`profile page is litening on port ${port}`);
});