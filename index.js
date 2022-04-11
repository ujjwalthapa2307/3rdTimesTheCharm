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
    recipeMain: Boolean,
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

//PDF Document
const PDFDocument = require('pdfkit');

//HTML to text
const { convert } = require('html-to-text');

//PDF route 
myApp.get('/pdf/:recipeid', (req, res, next) => {
    var recipeid = req.params.recipeid;
    Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
        console.log('Error: ' + err);
        console.log('recipe: ' + recipe);
        if(recipe){
            const stream = res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment;filename=${recipe.recipetitle}.pdf`,
              });
              buildPDF(
                (chunk) => stream.write(chunk),
                () => stream.end(),recipe.recipetitle,recipe.recipesteps,recipe.recipeimage,recipe.recipecomment
              );
        }
        else{
            res.send('No recipe found with that id...');
        }
    });

    function buildPDF(dataCallback, endCallback,title,steps,image,comment) {
        const stepsconverted = convert(steps, {
            wordwrap: 130
          });
        const doc = new PDFDocument({ bufferPages: true, font: 'Courier' });
        doc.on('data', dataCallback);
        doc.on('end', endCallback);
        
        doc
            .fontSize(50)
            .text(
                `${title}`,{bold: true,
                align: 'center'}
            );
        doc.moveDown();
        doc.image('public/uploads/'+image, 180, 120,{fit: [250, 250], align:'center', valign: 'center'});
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc
        .fontSize(30)
        .text(
            `Recipe Steps`,{bold: true,
            align: 'center'}
        );
        doc.moveDown();
        doc
        .fontSize(20)
        .text(
            `${stepsconverted}`,{
            align: 'center'}
        );
        doc.moveDown();
        doc
        .fontSize(30)
        .text(
            `Comments`,{bold: true,
            align: 'center'}
        );
        doc.moveDown();
        doc
        .fontSize(20)
        .text(
            `${comment}`,{
            align: 'center'}
        );
        doc.end();
    }

  });

//home page
myApp.get('/', function (req, res) {
    Recipe.find({}).exec(function (err, recipes) {
        res.render('home', { recipes: recipes });
    });
});

//select recipe version page
myApp.get('/select', function (req, res) {
    Recipe.find({}).exec(function (err, recipes) {
        res.render('select', { recipes: recipes });
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
            recipeMain: true,
            recipetitle: recipetitle,
            recipesteps: recipesteps,
            recipeimage: recipeimage,
            recipecomment: recipecomment
        }
        var myRecipe = new Recipe(pageData);
        myRecipe.save().then(function () {
            console.log('New Recipe saved');
        });

        /* var statusMessage = "Recipe Stored Successfully!";
        Recipe.find({}).exec(function (err, recipes) {
            res.render('home', {recipes: recipes,statusMessage:statusMessage});
        }); */

        res.render('form', pageData);
    }
});

myApp.get('/delete/:recipeid', function(req, res){
        //delete
        var recipeid = req.params.recipeid;
        console.log(recipeid);

        Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
            console.log('Error: ' + err);
            console.log('recipe: ' + recipe);
            if(recipe){
                if(recipe.recipeMain){
                    Recipe.find({}).exec(function (err, recipes){
                        for(let r of recipes){
                            if(r.recipetitle==recipe.recipetitle)
                            {
                                Recipe.findByIdAndDelete({_id: r._id}).exec(function(err, recipe){
                                    console.log('Error: ' + err);
                                    console.log('recipe: ' + recipe);
                                });
                            }
                        }
                    });
                }
                else{
                    Recipe.findByIdAndDelete({_id: recipeid}).exec(function(err, recipe){
                        console.log('Error: ' + err);
                        console.log('recipe: ' + recipe);
                    });
                }
            }
            else{
                res.send('No recipe found with that id...');
            }
            
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

myApp.get('/:recipeid', function(req,res){ 
    Recipe.find({}).exec(function(err, recipes){  
        var recipeId = req.params.recipeid;
        console.log(recipeId);
        Recipe.findOne({_id: recipeId}).exec(function(err,recipe){ 
            console.log('Error: ' + err);
            console.log('recipe found: ' + recipe);

            if(recipe){
                res.render('recipedetails', {
                    id: recipe._id,
                    rtitle: recipe.recipetitle,
                    recipes: recipes
                });
            }
            else{
                res.status(404).send('Error 404');
            }
        });
    });
});

myApp.get('/addversion/:recipeid', function(req, res){
    var recipeid = req.params.recipeid;
    console.log(recipeid);
    Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
        console.log('Error: ' + err);
        console.log('recipe: ' + recipe);
        if(recipe){
            Recipe.find({}).exec(function (err, recipes){
                for(let r of recipes){
                    if(r.recipetitle==recipe.recipetitle)
                    {
                       recipe=Object.assign(recipe,r);
                    }
                }
                res.render('addversion', {recipe:recipe});
            });
        }
        else{
            res.send('No recipe found with that id...');
        }
    });

});

myApp.post('/addversion/:recipeid', [
    check('recipetitle', 'Must have a recipetitle').not().isEmpty(),
    check('recipesteps', 'Please enter a recipesteps.').not().isEmpty(),

], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        var recipeid = req.params.id;
        Recipe.findOne({_id: recipeid}).exec(function(err, recipe){
            console.log('Error: ' + err);
            console.log('recipe: ' + recipe);
            if(recipe){
                res.render('addversion', {recipe:recipe, errors:errors.array()});
            }
            else{
                res.send('No recipe found with that id...');
            }
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
            recipeMain: false,
            recipetitle: recipetitle,
            recipesteps: recipesteps,
            recipeimage: recipeimage,
            recipecomment: recipecomment
        }

        var myRecipe = new Recipe(pageData);
        myRecipe.save().then(function () {
            console.log('New Version saved');
        });

        res.render('editsuccess', pageData);
    }
});

myApp.listen(8080);

console.log('Everything executed fine.. website at port 8080....');