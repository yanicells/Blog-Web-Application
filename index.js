import express from "express";
import bodyParser from "body-parser";
import { localsName } from "ejs";

let articles = [
  {
    title: "First Article",
    body: "This is the body of the first article."
  },
  {
    title: "Second Article",
    body: "This is the body of the second article."
  }
]
const app = express();
const port = 3000;

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs", {article: articles})
});

app.get("/create", (req, res) =>{
  res.render("create.ejs")
});

app.get("/create/:id", (req, res) =>{
  const id = req.params.id;
  console.log(id);
  
  if (id) {
    res.render("create.ejs", { article: articles, index: id });
  } else {
    res.status(404).send("Article not found");
  }
});

app.post("/submit", (req, res) => {
  console.log(req.body);
  addArticles(req.body["articleTitle"], req.body["textBody"])
  res.render("index.ejs", {article: articles})
});

app.post("/update/:id", (req, res) => {
  const id = req.params.id;
  articles[id] = {
    title: req.body.articleTitle,
    body: req.body.textBody
  };
  res.redirect("/");
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  articles.splice(id, 1);
  res.redirect("/");
});

app.get("/view/:id", (req, res) => {
  const id = req.params.id;
  if (id) {
    res.render("view.ejs", { article: articles, index: id });
  } else {
    res.status(404).send("Article not found");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function addArticles(titleArticle, bodyArticle){
  articles.push({title: titleArticle, body: bodyArticle})
}
