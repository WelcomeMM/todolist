//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todo list."
});

const item2 = new Item ({
  name : "Hit the + button to add new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItem = [item1, item2, item3];

const listSchema = mongoose.Schema({
	name: String,
	items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {

	Item.find({}, function (err, itemsFound) {

    	if (itemsFound.length === 0) {
			
			Item.insertMany(defaultItem, function (err) {
				if (err) {
				console.log(err);
				} else {
				console.log("Successfully added default items");
				}
			});

			res.redirect("/");  

    	} else {
			res.render("list", {listTitle: "Today", newListItems: itemsFound});
    	}
	});
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
	  name: itemName
  });

  if (listName === "Today") {
	item.save();
	res.redirect("/");

  } else {
	  List.findOne({name: listName}, (err, foundList) => {
		  foundList.items.push(item);
		  foundList.save();
		  res.redirect("/" + listName);
	  });
  }

});


app.post("/delete", function (req, res) {
	
	const checkIdItem = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndRemove(checkIdItem, (err) =>{
			if (err) {
				console.log(err); 
			} else {
				console.log("Sussccessfully deleted the checked item");
			}
		});
		res.redirect("/");
	} else {
		List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkIdItem}}}, (err, foundList) => {
			if (!err) {
				res.redirect("/" + listName);
			}
		});
	}
	
});

app.get("*/:customListName", (req, res) =>{
	
	const customListName = _.capitalize(req.params.customListName);
	
	List.findOne({name: customListName}, function (err, founList) {
		
		if (!err) {
			if (founList) {
				//show an existing list
				res.render("list", {listTitle: founList.name, newListItems: founList.items});
				
			} else {
				// creat a new list

				const list = new List({
					name: customListName,
					items: defaultItem
				});

				list.save();
				res.redirect("/" + customListName);
			}
		}

		
	});
		

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
