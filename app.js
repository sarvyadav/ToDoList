const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

mongoose.connect("mongodb+srv://admin-sarv:radium1205@cluster0.vo39k.mongodb.net/todolistDB");

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = {
  name : String
};

//creating a collection for the items
const Item = mongoose.model("Item", itemSchema);

const task1 = new Item({
  name : "make food"
});

const task2 = new Item({
  name : "deliver items"
});

const task3 = new Item({
  name : "buy groceries"
});

const defaultTasks = [task1, task2, task3];

//specifying the new schema for the list
const listSchema = {
  name : String,
  items : [itemSchema]
};

//creating a new collection of our lists
const List = mongoose.model("List", listSchema);

//adding items to our default list
app.get("/", function(req, res){

  const day = date.getDate();

  Item.find({},function(err,foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultTasks, function(err){
        if(err){
          console.log(err);
        }
        else {
          console.log("items added successfully");
        }
      });
      res.redirect("/");
    }
    else{
        res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});

//for deleting checked out items from the db as well as the list
app.post("/delete", function(req,res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();

  if(listName === day){
    Item.findByIdAndRemove(checkItemId, function(err){
      if(err){
        console.log(err);
      }
      else {
        console.log("succesfully deleted checked item");
      }
      res.redirect("/");
  });
  }
  //deleting itmes from the custom list
  else {
    List.findOneAndUpdate({name:listName}, {$pull : {items : {_id:checkItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

//for adding new items in custom list and stay on the same page while adding the new items to the custom list
app.post("/", function(req, res){

  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const newlyAddedItem = new Item({
    name : itemName
  });
    if(listName === day){
      newlyAddedItem.save();
      res.redirect("/");
    }
    else {
        List.findOne({name:listName}, function(err, foundList){
          foundList.items.push(newlyAddedItem);
          foundList.save();
          res.redirect("/"+listName);
        });
    }
});

//creating new page/list for names that are entered to access that list
// e.g localhost:3000/work creates a new list with name work
app.get("/:customListName", function(req,res){
  const listName = _.capitalize(req.params.customListName);

List.findOne({name:listName}, function(err, lists){
  if(!err){
    if(!lists){
      const list = new List({
        name : listName,
        items : defaultTasks
      });
      list.save();
      res.redirect("/"+listName);
    }
    else{
      res.render("list",{listTitle: lists.name, newListItems: lists.items});
    }
  }
});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on dynamic port");
});
