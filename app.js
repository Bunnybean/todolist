//jshint esversion:6

//basic set
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose set
mongoose.connect("mongodb+srv://admin-seol:Test123@cluster0.ngk2f.mongodb.net/listtodoDB",  { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);

//mongoose schema set
const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const titlesSchema = {
    names: []
};

//mongoose model set
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);
const Title = mongoose.model("Title", titlesSchema);

//mongoose create data
const item1 = new Item({
    name: "Welcome to your To Do List"
});
const item2 = new Item({
    name: "Click the + button to add a new item"
});
const item3 = new Item({
    name: "Click the check box to delete an item"
});
const title1 = new Title({
    name: "Today"
});

const defaultItems = [item1, item2, item3];
const defaultTitle = title1;


//express & ejs
//main page - get
app.get("/", function(req, resp){
   Item.find({}, function(err, foundItems){
       if(foundItems === 0) {
           Item.insertMany(defaultItems, function(err) {
               if (err) {
                   console.log(err);
               } else {
                   console.log("Sucessfully saved default items");
               }
           });
           Title.insertOne(defaultTitle, function(err) {
               if(!err) {
                   console.log("Sucessfully saved default Title");
               }
           });
           resp.redirect("/");
       } else {
           resp.render("list", {listTitle:"Today", newListItems: foundItems, titles: Title});
       }
   });
});

//custom page - get
app.get("/:customListName", function(req, resp){
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({name: customListName}, function(err, foundList){
       if(!err){
           if(!foundList){
               const list = new List({
                   name: customListName,
                   items: defaultItems
               });
               const listTitle = new Title({
                   names: []
               });
               list.save();
               listTitle.names.push(customListName);
               listTitle.save();
               resp.redirect("/" + customListName);
           } else {
               resp.render("list", {listTitle:foundList.name, newListItems:foundList.items, titles: Title});
           }
       }
    });
});


//main page - post
app.post("/", function(req, resp){
    //add new item
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        resp.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            resp.redirect("/" + listName);
        });
    }
});

//delete item
app.post("/delete", function(req, resp){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted");
                resp.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull:{items:{_id:checkedItemId}}}, function(err, foundList){
           if(!err) {
               console.log("Successfully deleted checked item from " + listName );
               resp.redirect("/" + listName);
           }
        });
    }
});

//create new list
app.post("/create", function(req, resp){
   const createNewList = req.body.createNewList;
   resp.redirect("/" + createNewList)
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});