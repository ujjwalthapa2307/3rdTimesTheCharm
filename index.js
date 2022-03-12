const express = require('express');
const path = require('path');

//Express Validator
const { check, validationResult } = require('express-validator');

//DB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/3rdTimesTheCharm', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//File upload
const fileUpload = require('express-fileupload');

const Recipe = mongoose.model('recipes', {
    recipetitle: String,
    recipesteps: String,
    recipeimage: String,
    recipecomment: String
});

// set up variable
var myApp = express();
myApp.use(express.urlencoded({ extended: false }));

// set path 
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//File upload
myApp.use(fileUpload());

//home page
myApp.get('/', function (req, res) {
    Recipe.find({}).exec(function (err, recipes) {
        res.render('home', { recipes: recipes });
    });
});

//Add recipe page
myApp.get('/form', function (req, res) {
    res.render('form'); 
});

myApp.post('/form', [
    check('recipetitle', 'Must have a recipetitle').not().isEmpty(),
    check('recipesteps', 'Please enter a recipesteps.').not().isEmpty(),

], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('form', {
            errors: errors.array()
        });
    }
    else {
        var recipetitle = req.body.recipetitle;
        var recipesteps = req.body.recipesteps;
        var recipecomment = req.body.recipecomment;

        var recipeimage = req.files.image.name;
        var imagefile = req.files.image;
        var imagepath = 'public/uploads/' + recipeimage;
        imagefile.mv(imagepath, function (err) {
            console.log(err);
        });

        var pageData = {
            recipetitle: recipetitle,
            recipesteps: recipesteps,
            recipeimage: recipeimage,
            recipecomment: recipecomment
        }

        var myRecipe = new Recipe(pageData);
        myRecipe.save().then(function () {
            console.log('New Recipe saved');
        });
        res.render('form', pageData);
    }
});

myApp.get('/delete/:recipeid', function(req, res){
        //delete
        var recipeid = req.params.recipeid;
        console.log(recipeid);
        Recipe.findByIdAndDelete({_id: recipeid}).exec(function(err, recipe){
            console.log('Error: ' + err);
            console.log('recipe: ' + recipe);
            if(recipe){
                res.render('delete', {message: 'Successfully deleted!'});
            }
            else{
                res.render('delete', {message: 'Sorry, could not delete!'});
            }
        });
 
});


myApp.get('/edit/:recipeid', function(req, res){
        var recipeid = req.params.recipeid;
        console.log(recipeid);
        Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
            console.log('Error: ' + err);
            console.log('recipe: ' + recipe);
            if(recipe){
                res.render('edit', {recipe:recipe});
            }
            else{
                res.send('No recipe found with that id...');
            }
        });
    
});


myApp.post('/edit/:id', [
    check('recipetitle', 'Must have a recipetitle').not().isEmpty(),
    check('recipesteps', 'Please enter a recipesteps.').not().isEmpty(),

],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        var recipeid = req.params.id;
        Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
            console.log('Error: ' + err);
            console.log('recipe: ' + recipe);
            if(recipe){
                res.render('edit', {recipe:recipe, errors:errors.array()});
            }
            else{
                res.send('No recipe found with that id...');
            }
        });

    }
    else{
        var recipetitle = req.body.recipetitle;
        var recipesteps = req.body.recipesteps;
        var recipecomment = req.body.recipecomment;

        var recipeimage = req.files.image.name;
        var imagefile = req.files.image;
        var imagepath = 'public/uploads/' + recipeimage;
        imagefile.mv(imagepath, function (err) {
            console.log(err);
        });

        var pageData = {
            recipetitle: recipetitle,
            recipesteps: recipesteps,
            recipeimage: recipeimage,
            recipecomment: recipecomment
        }

        var id = req.params.id;
        Recipe.findOne({_id:id}, function(err, recipe){
            recipe.recipetitle= recipetitle;
            recipe.recipesteps= recipesteps;
            recipe.recipeimage= recipeimage;
            recipe.recipecomment= recipecomment;
            recipe.save();     
        });
        res.render('editsuccess', pageData);
    }
});


myApp.listen(8080);

console.log('Everything executed fine.. website at port 8080....');