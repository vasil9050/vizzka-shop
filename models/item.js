let mongoose= require("mongoose");

    var itemSchema = new mongoose.Schema
({
    name : String,
    image : String,
    description : String,
    price: Number,
    author: 
    {
        id :{
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        username : String
    },
    review : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Review"
        }
    ]
})

module.exports = mongoose.model("Item" , itemSchema);