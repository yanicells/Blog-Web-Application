import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { localsName } from "ejs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url"; // Add this
import { dirname } from "path"; // Add this
import pg from "pg";
import { resourceUsage } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let user = "";
let userID = -1;
const app = express();
const port = 3000;
let articles = [];

async function connectWithRetry() {
  const client = new pg.Client({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DBNAME,
    password: process.env.DBPASS,
    port: process.env.DBPORT,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database!");
    return client;
  } catch (err) {
    console.error("❌ Database not ready, retrying in 5s...", err.code);
    await new Promise((res) => setTimeout(res, 5000));
    return connectWithRetry();
  }
}

const db = await connectWithRetry();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

// Multer storage configuration for saving images to public/images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("public", "images"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

const upload = multer({ storage: storage });

app.get("/", async (req, res) => {
  articles = await queryArticles();

  // Get author names for each article
  for (let i = 0; i < articles.length; i++) {
    articles[i].authorName = await getAuthor(articles[i].id);
  }

  res.render("index.ejs", { article: articles });
});

app.get("/create", (req, res) => {
  if (user !== "") {
    res.render("create.ejs");
  } else {
    res.render("login.ejs");
  }
});

app.get("/create/:id", (req, res) => {
  const id = req.params.id;

  if (id) {
    if (user !== "") {
      res.render("create.ejs", { article: articles, index: id });
    } else {
      res.render("login.ejs");
    }
  } else {
    res.status(404).send("Article not found");
  }
});

app.get("/comment/:id", (req, res) => {
  const id = req.params.id;

  if (id) {
    if (user !== "") {
      res.render("comment.ejs", { index: id });
    } else {
      res.render("login.ejs");
    }
  } else {
    res.status(404).send("Article not found");
  }
});

app.post("/submit", upload.single("image"), (req, res) => {
  console.log(req.body);
  console.log(req.body.articleTitle);
  console.log(req.body.textBody);

  const uploadedImagePath = req.file ? "/images/" + req.file.filename : "";
  addArticles(
    req.body["articleTitle"],
    req.body["textBody"],
    uploadedImagePath
  );
  res.redirect("/");
});

app.post("/update/:id", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !articles[id]) {
    return res.status(404).send("Article not found");
  }

  console.log(articles[id].id);

  const currentImagePath = articles[id].imagePath || "";
  const newImagePath = req.file
    ? "/images/" + req.file.filename
    : currentImagePath;

  editArticles(
    articles[id].id,
    req.body["articleTitle"],
    req.body["textBody"],
    newImagePath
  );

  res.redirect(`/view/${id}`);
});

app.post("/comment/:id", (req, res) => {
  const id = req.params.id;
  addComment(articles[id].id, req.body.textBody);

  console.log(articles);
  res.redirect(`/view/${id}`);
});

app.get("/like/:id", (req, res) => {
  const id = req.params.id;

  addLikes(articles[id].id);
  res.redirect(`/view/${id}`);
});

app.post("/like/:id", (req, res) => {
  const id = req.params.id;

  addLikes(articles[id].id);
  res.redirect(`/view/${id}`);
});

app.get("/view/:id", async (req, res) => {
  const id = req.params.id;
  if (id) {
    const articles = await queryArticles();
    const comments = await queryComments(id);
    const likes = await queryLikes(id);
    const likesCount = likes.length;
    const author = await getAuthor(articles[id].id);

    res.render("view.ejs", {
      article: articles[id],
      comments: comments,
      likes: likesCount,
      index: id,
      user: user,
      author: author,
      authorID: articles[id].author_id,
      userID: userID,
    });
  } else {
    res.status(404).send("Article not found");
  }
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  deleteArticles(articles[id].id);
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { user: user });
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  const isValid = await validateUser(req.body.user, req.body.password);
  if (isValid) {
    userID = await getUserID(req.body.user);
    if (user === -1) {
      return res.redirect("/login");
    }
    user = req.body.user;
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  user = "";
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

async function deleteArticles(article_id) {
  try {
    const result = await db.query("DELETE FROM articles WHERE id = $1", [
      article_id,
    ]);
    console.log("Article deleted:", result.rowCount);
    articles = await queryArticles();
  } catch (err) {
    console.log(err);
  }
}

async function addLikes(article_id) {
  try {
    const result = await db.query(
      "INSERT INTO likes (article_id, user_id) VALUES ($1, $2) RETURNING *",
      [article_id, userID]
    );
    console.log("Like added:", result.rows[0]);
  } catch (err) {
    console.log(err);
  }
}

async function addArticles(titleArticle, bodyArticle, imagePath) {
  try {
    const result = await db.query(
      "INSERT INTO articles (title, body, image_url, author_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [titleArticle, bodyArticle, imagePath || "", userID]
    );
    console.log("Article added:", result.rows[0]);
    articles = await queryArticles();
  } catch (err) {
    console.log(err);
  }
}

async function editArticles(articleID, titleArticle, bodyArticle, imagePath) {
  try {
    const result = await db.query(
      "UPDATE articles SET title = $1, body = $2, image_url = $3 WHERE id = $4 RETURNING *",
      [titleArticle, bodyArticle, imagePath || "", articleID]
    );
    console.log("Article updated:", result.rows[0]);
    articles = await queryArticles();
  } catch (err) {
    console.log(err);
  }
}

async function addComment(article_id, textBody) {
  try {
    const result = await db.query(
      "INSERT INTO comments (article_id, author_id, content) VALUES ($1, $2, $3) RETURNING *",
      [article_id, userID, textBody]
    );
    console.log("Comment added:", result.rows[0]);
  } catch (err) {
    console.log(err);
  }
}

async function getAuthor(article_id) {
  try {
    const result = await db.query("SELECT * FROM articles WHERE id = $1", [
      article_id,
    ]);
    if (result.rows.length > 0) {
      const author_id = result.rows[0].author_id;
      const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
        author_id,
      ]);
      if (userResult.rows.length > 0) {
        return userResult.rows[0].username;
      } else {
        return "Unknown";
      }
    } else {
      return "Unknown";
    }
  } catch (err) {
    console.log(err);
    return "Unknown";
  }
}

async function validateUser(username, password) {
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      console.log(result.rows.length);
      const user = result.rows[0];
      if (user.password_hash === password) {
        return true;
      } else {
        return false;
      }
    } else {
      await db.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
        [username, password]
      );
      return true;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function getUserID(username) {
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    console.log(result.rows);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      return -1;
    }
  } catch (err) {
    console.log(err);
  }
}

async function queryArticles() {
  try {
    const result = await db.query("SELECT * FROM articles");
    let articles = result.rows;
    return articles;
  } catch (err) {
    console.log(err);
  }
}

async function queryComments(id) {
  articles = await queryArticles();
  try {
    const result = await db.query(
      `
      SELECT c.*, u.username 
      FROM comments c 
      JOIN users u ON c.author_id = u.id 
      WHERE c.article_id = $1 
      ORDER BY c.created_at ASC
    `,
      [articles[id].id]
    );
    let comments = result.rows;
    return comments;
  } catch (err) {
    console.log(err);
  }
}

async function queryLikes(id) {
  articles = await queryArticles();
  try {
    const result = await db.query("SELECT * FROM likes WHERE article_id = $1", [
      articles[id].id,
    ]);
    let likes = result.rows;
    return likes;
  } catch (err) {
    console.log(err);
  }
}
