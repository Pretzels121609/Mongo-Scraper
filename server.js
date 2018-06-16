// Dependencies
var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");
var axios = require("axios");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// HTML Routes (route you to the correct HTML page)

app.get("/", function(req, res) {
  db.Article.find({},function(err, data) {
    var hbsObject = {
      articles: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  db.Article.find({saved:true}, function(err, data) {
    var hbsObject = {
      articles: data
    };
    console.log(hbsObject);
    res.render("saved", hbsObject);
  });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("http://www.nytimes.com/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);


      // Now, we grab every theme-summary class, and do the following:
      $(".theme-summary").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children(".story-heading")
          .text();
        result.url = $(this)
          .children(".story-heading")
          .children("a")
          .attr("href");

        result.summary = $(this)
          .children(".summary")
          .text();  
        
        console.log(result)

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
      });
  
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
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

// API Routes (routes you to an spi endpoint to interact with mongodb using CRUD functions)

app.put('/api/save/:id', function(req,res) {
  // save an Article with ObjectId 'id' (UPDATE)

});

app.delete('/api/delete/:id', function(req,res){
  // delete an Article with ObjectId 'id' (DELETE)
})

app.post('/api/article/:id/note', function(req,res){
  // insert a Note for an Article with ObjectId 'id' (CREATE)

});

app.get('/api/article/:id/notes', function(req, res){
  // get all the notes for an Article with ObjectId 'id' (READ)
})

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });