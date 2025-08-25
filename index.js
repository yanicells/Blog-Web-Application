import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs")
});

app.post("/submit", (req, res) => {
  let firstN = adj[Math.floor(Math.random() * adj.length)]
  let lastN = noun[Math.floor(Math.random() * noun.length)]
  res.render("index.ejs", {fName: firstN, lName: lastN})
  console.log(firstN, lastN);
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
