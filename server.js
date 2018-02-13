// npm requirements
var express = require("express");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var request = require("request");

// require models
var db = require("./models");

// set a port
var PORT = process.env.PORT || 3000;

// initialize Express
var app = express();

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
// express.static serves the public folder as a static directory
app.use(express.static("public"));

// set up app to use handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoScraper database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoScraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Routes
// home page, find all articles and render landing handlebars
app.get("/", function(req, res) {
  db.Article.find({}, function(error, data) {
    if (error) throw error;
    res.render("landing", { articleData: data })
  });
});

// saved page, find all articles and render saved handlebars
app.get("/saved", function(req, res) {
  db.Article.find({}, function(error, data) {
    if (error) throw error;
    res.render("saved", { articleData: data })
  });
});

// route for scraping nhl.com/news
app.get("/scrape", function(req, res) {
  // find all articles already in db
  db.Article.find({}, function(err, currentArticles) {
    if (err) throw err;
    // create and populate an array with all current db article titles
    var currentArticleTitles = [];
    for (var i = 0; i < currentArticles.length; i++) {
      currentArticleTitles.push(currentArticles[i].title);
    }

    // then grab html body
    request("https://www.nhl.com/news", function(error, response, html) {
      // load html into cheerio
      var $ = cheerio.load(html);
      // grab every article from html and do the following:
      $("article").each(function(i, element) {
        // Save a result object
        var result = {};
        // if the nhl.com article doesn't already exist in the database, then...
        if (currentArticleTitles.indexOf($(element).data("title")) === -1) {
          // save title, summary, url as properties of the result object
          result.title = $(element)
            .data("title");
          result.summary = $(element)
            .find("h2")
            .text();
          result.link = $(element)
            .data("url");
          // save image property of result object, based on nhl.com's code, the image is either a src="..." or data-src="...", so building in function to check and fill
          // in with default if neither
          result.image = "";
            
          if ($(element).find("img").data("src")) {
            result.image = $(element).find("img").data("src");
          } 
          else if ($(element).find("img").attr("src")) {
            result.image = $(element).find("img").attr("src");
          }
          else {
            result.image = '/assets/images/default.png';
          }

          // Create a new Article using the `result` object built from scraping
          db.Article.create(result)
            .then(function(dbArticle) {
              // View the added result in the console
              console.log(dbArticle);
            })
            .catch(function(err) {
              // If an error occurred, send it to the client
              return res.json(err);
            });
        }
      });
      // If we were able to successfully scrape and save articles, redirect home
      res.redirect("/");
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("comment")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// // Route for saving/updating an Article's associated comment
// app.post("/articles/:id", function(req, res) {
//   // Create a new comment and pass the req.body to the entry
//   db.comment.create(req.body)
//     .then(function(dbcomment) {
//       // If a comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new comment
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbcomment._id }, { new: true });
//     })
//     .then(function(dbArticle) {
//       // If we were able to successfully update an Article, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
