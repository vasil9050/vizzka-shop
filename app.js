var express        = require("express"),
    methodoverride = require("method-override"),
    bodyparser     = require("body-parser"),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    Item           = require("./models/item"),
    Review         = require("./models/review"),
    User           = require("./models/user"),
    seedDB         = require("./seeds"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

var app = express();
app.use(methodoverride( "_method"))
app.use(bodyparser.urlencoded({extended : true}));
app.set("view engine" , "ejs");

mongoose.connect("mongodb://localhost/shop_app" , {useUnifiedTopology : true , useNewUrlParser: true , useCreateIndex: true});
// seedDB();

app.use(flash());
app.use(express.static(__dirname + "/public"));
app.use(require("express-session")({
    secret : "shop it up",
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

app.use(function(req , res , next){
    res.locals.currentuser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.get("/" , (req , res)=> {
    res.render("landing")
})

app.get("/shop" , (req , res)=> {
    Item.find((err , items)=>{
        if(err){
            console.log(err)
        }else{
            res.render("index" , {items : items , currentuser : req.user});
        }
        })
})

app.get("/shop/new" , isLoggedIn , (req , res)=>{
    res.render("new");
})

app.post("/shop" , isLoggedIn , (req , res)=>{
    let name = req.body.name,
        image = req.body.image,
        description = req.body.description,
        price = req.body.price,
        author = {
            id : req.user._id,
            username : req.user.username
        }
        let newitem = {name : name , image : image , description : description , price : price , author : author}
    Item.create(newitem , (err , item)=>{
        if(err){ 
            console(err);
        }else{
            req.flash("success" , "New Item "+req.body.name+" Added");
            res.redirect("/shop")
        }
    })
}) 

app.get("/shop/wishlist/:id" , (req , res)=>{
    Item.findById(req.params.id).populate("review").exec(function(err , item){
                if(err){
                    console.log(err)
                }else{
                    console.log(item);
                    res.render("wishlist" , {item : item})
                }
                })
        })

app.get("/shop/wishlist/:id/edit", checkOwnerShip , (req , res)=>{
        Item.findById(req.params.id , (err , itemfound)=>{
                    res.render("edit" , {item : itemfound})
})
})

app.put("/shop/wishlist/:id", checkOwnerShip , (req , res)=>{
    Item.findByIdAndUpdate(req.params.id , req.body.item , (err , updateitem)=>{
        if(err){
            console.log(err)
        }else{
            req.flash("success" , "Item Updated Successfully!!")
            res.redirect("/shop/wishlist/"+ req.params.id)
        }
    })
})

app.delete("/shop/wishlist/:id", checkOwnerShip , (req , res)=>{
    Item.findByIdAndRemove(req.params.id , (err , updateitem)=>{
        if(err){
            console.log(err)
        }else{
            req.flash("success" , "Item deleted Successfully!!")
            res.redirect("/shop")
        }
    })
})

// method for checking ownerShip of item 

function checkOwnerShip(req , res , next){
    if(req.isAuthenticated()){
        Item.findById(req.params.id , (err , itemfound)=>{
            if(err){
                req.flash("error" , "Item not found")
                res.redirect("back")
            }else{
                // the user owns it or not
                if((itemfound.author.id).equals(req.user._id)){
                    next();
                }else{
                    req.flash("error" , "You are not allowed to do that")
                    res.redirect("back");
                }
            }
        })
    }else{
        req.flash("error" , "You need to login to do that")
        res.redirect("back");
    }
}

// Review Routes

app.get("/shop/wishlist/:id/reviews/new", isLoggedIn , (req ,res)=>{
    Item.findById(req.params.id , (err , item)=>{
        if(err){
            console.log(err)
        }else{
            res.render("reviews/new" , {item : item})
        }
    })
})

app.post("/shop/wishlist/:id/reviews", isLoggedIn , (req ,res)=>{
    console.log(req.body.review);
    Item.findById(req.params.id , (err , item)=>{
        if(err){
            console.log(err)
        }else{
            Review.create(req.body.review , (err , review)=>{
                if(err){
                    console.log(err)
                }else{
                    //add username and id to review
                    review.author.id = req.user._id;
                    review.author.username = req.user.username;
                    //save review
                    review.save();
                    item.review.push(review);
                    item.save();
                    req.flash("success" , "Review Added Successfully!!")
                    res.redirect("/shop/wishlist/"+item._id)
                }
            })
        }
    })
})

app.get("/shop/wishlist/:id/reviews/:review_id/edit" , checkOwnerShipReview , (req , res)=>{
    Review.findById(req.params.review_id , (err , foundreview)=>{
        if(err){
            res.redirect("back")
        }else{
            res.render("reviews/editreview" , {item_id : req.params.id , review : foundreview})
        }
    })
})

app.put("/shop/wishlist/:id/reviews/:review_id" , checkOwnerShipReview , (req , res)=>{
    Review.findByIdAndUpdate(req.params.review_id , req.body.review , (err , updatereview)=>{
        if(err){
            res.redirect("back")
        }else{
            req.flash("success" , "Review Updated Successfully!!")
            res.redirect("/shop/wishlist/" + req.params.id)
        }
    })
})

app.delete("/shop/wishlist/:id/reviews/:review_id", checkOwnerShipReview , (req , res) => {
    Review.findByIdAndRemove(req.params.review_id , (err , updateitem)=>{
        if(err){
            res.redirect("back")
        }else{
            req.flash("success" , "Review Deleted Successfully!!")
            res.redirect("/shop/wishlist/"+ req.params.id)
        }
    })
})

// method for checking review ownership


function checkOwnerShipReview(req , res , next){
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id , (err , reviewfound)=>{
            if(err){
                req.flash("error" , "Review not found")
                res.redirect("back")
            }else{
                // the user owns it or not
                if((reviewfound.author.id).equals(req.user._id)){
                    next();
                }else{
                    req.flash("error" , "You are not allowed to do that")
                    res.redirect("back");
                }
            }
        })
    }else{
        req.flash("error" , "You need to login to do that")
        res.redirect("back");
    }
}


//===========================
// AUTH ROUTE
//==========================

// REGISTER
app.get("/register" , (req , res)=>{
    res.render("register");
})

app.post("/register" , (req , res)=>{
    const {username , password}  = req.body;
    newUser = new User({username : username})
    User.register(newUser , password , (err , user)=>{
        if(err){
            req.flash("error" , err.message )
            return res.render("register");
        }

        passport.authenticate("local")(req , res , ()=>{
            req.flash("success" , "WELCOME to VIZZKA "+req.body.username)
            res.redirect("/shop")
        });
    });
});

//  LOGIN
app.get("/login" , (req , res)=>{
    res.render("login")
})

app.post("/login" , passport.authenticate('local' , {
    successRedirect : "/shop",
    failureRedirect : "/login"
}) , (req , res )=>{

})

//LOGOUT
function isLoggedIn(req , res , next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error" , "you need to login to that!!")
    res.redirect("/login")
}

app.get("/logout" , (req , res)=>{
    req.logout();
    req.flash("success" , "You are Logged Out")
    res.redirect("/shop")
})


app.listen("3000" , (req , res)=>{
    console.log("App Server Started......")
})