const express = require("express");
const bodyParser = require ("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB",{family:4});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to my To Do List"
});

const item2 = new Item({
  name: "Hit the + button to add a new items"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

 const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
   Item.find({})
      .then((foundItems) => {
        if(foundItems.length === 0){
          Item.insertMany(defaultItems)
            .then((docs) => {
              console.log("Successfully saved all default items to the Database.");
            })
            .catch((error) => {
              console.log(error);
            });
          res.redirect("/");
        }
        else{
          res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
      })
  });

// app.get("/:customListName", function(req,res){
//   const customListName= req.params.customListName;
//   List.findOne({name: customListName}, function(err,foundList){
//     if(!err){
//       if(!foundList){
//         const list = new List({
//         name: customListName,
//         items: defaultItems
//       });
//       list.save();
//       res.redirect("/" + customListName );
//     }
//     else{
//         res.render("list", {listTitle: foundList.name , newListItems: foundItems});
//     }
//   }
// });
app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/", function(req,res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({ name: listName })
  .then((foundList) => {
    foundList.items.push(item);
    return foundList.save();
  })
  .then(() => {
    res.redirect("/" + listName);
  })
  .catch((err) => {
    // Handle the error
    console.error(err);
  });

    // List.findOne({name: listName}, function(err,foundList){
    //   foundList.items.push(item);
    //   foundList.save();
    //   res.redirect("/"+ listName);
    // });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then((docs) => {
      console.log("Successfully deleted checked Items.");
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error);
    });
  }else{
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
  .then(foundList => {
    res.redirect("/" + listName);
  })
  .catch(err => {
    // Handle the error
  });

    // List.findOneAndUpdate({name:listName},{$pull:{items: {_id: checkedItemId}}},function(err,foundList){
    //   if(!err){
    //     res.redirect("/" + listName);
    //   }
    // });
  }

})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req,res){
  res.render("about");
})

app.listen(3000,function(){
  console.log("Server started on port 3000");
});
