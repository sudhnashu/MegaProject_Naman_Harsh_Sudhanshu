import express from "express";


const app = express();
const port = 5000;
app.use(express.static("public"));

app.get("/" , (req,res) => {
    res.render("registration.ejs");
    });
    
app.post

app.listen(port,()=>{
    console.log(`listening on port ${port}`);
});

