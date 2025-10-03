import express from "express";
import bodyParser from "body-parser";
import { localsName } from "ejs";
import multer from "multer";
import path from "path";

let user = "";
const app = express();
const port = 3000;

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

app.get("/", (req, res) => {
  res.render("index.ejs", {article: articles, user: user})
});

app.get("/create", (req, res) =>{
  if(user !== ""){
    res.render("create.ejs", {user: user})
  } else {
    res.render("login.ejs", {user: user})
  }
});

app.get("/create/:id", (req, res) =>{
  const id = req.params.id;
  
  if (id) {
    if(user !== ""){
      res.render("create.ejs", { article: articles, index: id, user: user });
    } else {
        res.render("login.ejs", {user: user})
    }
  } else {
    res.status(404).send("Article not found");
  }
});

app.get("/comment/:id", (req, res) =>{
  const id = req.params.id;
  console.log(articles[id]);
  
  if (id) {
    if(user !== ""){
      res.render("comment.ejs", {index: id, user: user });
    } else {
        res.render("login.ejs", {user: user})
    }
  } else {
    res.status(404).send("Article not found");
  }
});

app.post("/submit", upload.single("image"), (req, res) => {
  console.log(req.body);
  const uploadedImagePath = req.file ? "/images/" + req.file.filename : "";
  addArticles(req.body["articleTitle"], req.body["textBody"], uploadedImagePath)
  res.render("index.ejs", {article: articles, user: user})
});

app.post("/update/:id", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !articles[id]) {
    return res.status(404).send("Article not found");
  }
  
  const currentImagePath = articles[id].imagePath || "";
  const newImagePath = req.file ? "/images/" + req.file.filename : currentImagePath;

  articles[id] = {
    title: req.body.articleTitle,
    body: req.body.textBody,
    comment: articles[id].comment,
    likes: articles[id].likes,
    imagePath: newImagePath
  };
  res.redirect(`/view/${id}`);
});

app.post("/comment/:id", (req, res) => {
  const id = req.params.id;

  articles[id].comment.push({
    username: user,
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
    res.render("view.ejs", { article: articles, index: id, user: user });
  } else {
    res.status(404).send("Article not found");
  }
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  articles.splice(id, 1);
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs", {user: user})
});

app.post("/login", (req, res) => {
  user = req.body.user;
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  user = "";
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function addArticles(titleArticle, bodyArticle, imagePath){
  articles.push({title: titleArticle, body: bodyArticle, comment: [], likes: 0, imagePath: imagePath || ""})
}


let articles = [
  {
    title: "The Future of Artificial Intelligence in Healthcare",
    body: "Artificial intelligence is revolutionizing the healthcare industry in ways we never imagined possible. From diagnostic imaging to drug discovery, AI algorithms are becoming increasingly sophisticated at analyzing vast amounts of medical data to identify patterns that human doctors might miss. Machine learning models can now predict patient outcomes with remarkable accuracy, helping physicians make more informed treatment decisions. The integration of AI-powered tools in hospitals has already shown promising results in reducing diagnostic errors and improving patient care efficiency. However, this technological advancement also brings new challenges, including concerns about data privacy, algorithmic bias, and the need for proper regulatory frameworks. As we move forward, the key will be finding the right balance between leveraging AI's capabilities and maintaining the human touch that is essential in healthcare. The future looks bright for AI in medicine, but it requires careful implementation and ongoing oversight to ensure it truly benefits patients and healthcare providers alike.",
    comment: [],
    likes: 0,
    imagePath: "/images/1.png"
  },
  {
    title: "Sustainable Living: Small Changes That Make a Big Impact",
    body: "In today's world, the concept of sustainable living has moved from a niche interest to a global necessity. Many people believe that making a difference requires drastic lifestyle changes, but the truth is that small, consistent actions can collectively create significant environmental impact. Simple practices like reducing single-use plastics, choosing energy-efficient appliances, and supporting local farmers can significantly reduce your carbon footprint. The beauty of sustainable living lies in its accessibility - everyone can participate regardless of their living situation or budget. From using reusable water bottles to composting kitchen waste, these small habits add up over time. What makes sustainable living particularly powerful is its ripple effect; when one person adopts eco-friendly practices, it often inspires others to do the same. The key is to start with manageable changes and gradually build upon them, creating a lifestyle that's both environmentally conscious and personally fulfilling.",
    comment: [],
    likes: 0,
    imagePath: "/images/5.png"
  },
  {
    title: "The Psychology of Productivity: Why We Procrastinate and How to Overcome It",
    body: "Procrastination is a universal human experience that affects nearly everyone at some point in their lives. Understanding the psychology behind why we procrastinate can be the first step toward overcoming this productivity killer. Research shows that procrastination often stems from our brain's natural tendency to avoid discomfort and seek immediate gratification. When faced with a challenging task, our minds create elaborate excuses to delay starting, even though we know the delay will only increase our stress later. The good news is that procrastination is not a character flaw but a habit that can be changed through conscious effort and strategic approaches. Techniques like breaking tasks into smaller, manageable chunks, using the Pomodoro Technique, and creating accountability systems can help overcome the urge to delay. The key insight is that motivation often follows action rather than preceding it - starting a task, even for just a few minutes, can create the momentum needed to continue. By understanding these psychological principles, we can develop better strategies for maintaining productivity and achieving our goals.",
    comment: [],
    likes: 0,
    imagePath: "/images/7.png"
  },
  {
    title: "The Art of Mindful Communication in the Digital Age",
    body: "In our hyperconnected world, the way we communicate has fundamentally changed, but the principles of effective communication remain timeless. Digital platforms have made it easier than ever to reach people instantly, yet meaningful connections seem harder to achieve. The art of mindful communication involves being fully present in our interactions, whether they occur face-to-face or through screens. This means actively listening, choosing our words carefully, and considering the impact of our message on the recipient. In the digital realm, where tone and context can easily be misinterpreted, taking a moment to pause before responding can prevent misunderstandings and preserve relationships. Mindful communication also involves recognizing when digital communication isn't the best choice - some conversations are better had in person or over the phone. The challenge in today's fast-paced world is finding the balance between efficiency and thoughtfulness. By practicing mindful communication, we can build stronger relationships, reduce conflicts, and create more meaningful connections in both our personal and professional lives.",
    comment: [],
    likes: 0,
    imagePath: "/images/9.png"
  }
]