import express from "express";
import bodyParser from "body-parser";
import { localsName } from "ejs";

let articles = [
  {
    title: "First Article",
    body: "This is the body of the first article.",
    comment: [],
    likes: 0
  },
  {
    title: "Second Article",
    body: "This is the body of the second article.",
    comment: [],
    likes: 0
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

app.get("/comment/:id", (req, res) =>{
  const id = req.params.id;
  console.log(articles[id]);
  
  if (id) {
    res.render("comment.ejs", {index: id });
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !articles[id]) {
    return res.status(404).send("Article not found");
  }
  articles[id] = {
    title: req.body.articleTitle,
    body: req.body.textBody,
    comment: articles[id].comment,
    likes: articles[id].likes
  };
  res.redirect(`/view/${id}`);
});

app.post("/comment/:id", (req, res) => {
  const id = req.params.id;

  articles[id].comment.push({
    username: req.body.username,
    textBody: req.body.textBody
  });
  console.log(articles);
  res.redirect(`/view/${id}`);
});

app.get("/like/:id", (req, res) =>{
  const id = req.params.id;
  
  articles[id].likes++;
  console.log(articles);
  res.redirect(`/view/${id}`);
});

app.post("/like/:id", (req, res) => {
  const id = req.params.id;
  
  articles[id].likes++;
  console.log(articles);
  res.redirect(`/view/${id}`);
});

app.get("/view/:id", (req, res) => {
  const id = req.params.id;
  if (id) {
    res.render("view.ejs", { article: articles, index: id });
  } else {
    res.status(404).send("Article not found");
  }
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  articles.splice(id, 1);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function addArticles(titleArticle, bodyArticle){
  articles.push({title: titleArticle, body: bodyArticle, comment: [], likes: 0})
}
