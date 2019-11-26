let mongoose = require("mongoose"),
    Item     = require("./models/item"),
    Review   = require("./models/review");
    
let data = [
    {
        name : "One Plus 7T Pro",
        image : "https://ksassets.timeincuk.net/wp/uploads/sites/54/2019/05/OnePlus-7-Pro-2.jpg",
        description : "same as one plus 7 pro with 855 plus",
        price : 55000
    },
    {
        name : "One Plus 7T Pro",
        image : "https://ksassets.timeincuk.net/wp/uploads/sites/54/2019/05/OnePlus-7-Pro-2.jpg",
        description : "same as one plus 7 pro with 855 plus",
        price : 55000
    },
    {
        name : "One Plus 7T Pro",
        image : "https://ksassets.timeincuk.net/wp/uploads/sites/54/2019/05/OnePlus-7-Pro-2.jpg",
        description : "same as one plus 7 pro with 855 plus",
        price : 55000
    }
]

function seedDB(){
    Item.remove({} , (err)=>{
        if(err){
            console.log(err)
        }else{
            console.log("Item removed") 
            // add item
            data.forEach((item)=>{
                Item.create(item , (err , item)=>{
                    if(err){
                        console.log(err);
                    }else{
                        console.log("item added")
                        Review.create({
                            text: "blah blah blah",
                            author: "vizz"
                        } , (err , review)=>{
                            if(err){
                                console.log(err)
                            }else{
                                item.review.push(review);
                                item.save();
                                console.log("item created")
                            }
                        })
                    }
                })
            })
        }
    })
}

module.exports = seedDB;