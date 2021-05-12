var express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware"),
    multer = require('multer');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'opencage',
  httpAdapter: 'https',
  apiKey: 'YOUR-API-KEY',
  formatter:null
};

var geocoder = NodeGeocoder(options);

var cloudinary = require('cloudinary');
    cloudinary.config({ 
      cloud_name: 'sjg', 
      api_key: process.env.CLOUDINARY_API_KEY, 
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
        
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

//INDEX - show all campgrounds
router.get("/", function(req, res){
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
           if(err){
              console.log(err);
           } else {
              if(allCampgrounds.length<1){
                req.flash("error","No Campground found");
                return res.redirect("back");
              }
              res.render("campgrounds/index",{campgrounds:allCampgrounds});
           }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:allCampgrounds});
           }
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
            req.body.campground.image = result.secure_url;
            // add image's public_id to campground object
            req.body.campground.imageId = result.public_id;
            // add author to campground
            req.body.campground.author = {
              id: req.user._id,
              username: req.user.username
        };
        // .geocode(req.body.location, function(err, data){
        //   if(err || !data.length){
        //       req.flash('error', 'Invalid address');
        //       return res.redirect('back');
        //   } 

        //   const opencage = require('opencage-api-client');

          // geocodingClient
          //     .forwardGeocode({query:"Thailand" , limit : 1})
          //     .send()
          //     .then(data => {
          //       const match = data.body;
          //       console.log(match.features[0].center);
          //             });
            // console.log(JSON.stringify(data));
            // if (data.status.code == 200) {
            //   if (data.results.length > 0) {
            //     var place = data.results[0];
            //     console.log(place.formatted);
            //     console.log(place.geometry);
            //     console.log(place.annotations.timezone.name);
            //   }
            // } else if (data.status.code == 402) {
            //   console.log('hit free-trial daily limit');
            //   console.log('become a customer: https://opencagedata.com/pricing'); 
            // } else {
            //   // other possible response codes:
            //   // https://opencagedata.com/api#codes
            //   console.log('error', data.status.message);
            // }
     
          // .catch(error => {
          //   console.log('error', error.message);
          // });
          
          
          
          // //parse the object campground
          // req.body.campground.lat =     data[0].latitude;
          // req.body.campground.lng  =     data[0].longitude;
          // req.body.campground.location = data[0].formattedAddress;
        // geocodingClient
        //   .forwardGeocode(req.body.campground.location, function(err, data){
        //   if(err){
        //       req.flash('error', 'Invalid address');
        //       return res.redirect('back');
        //   } 
	      // //  let response = await geocodingClient
        // //       .forwardGeocode({
        // //         query: req.body.campground.location,
        // //         limit: 1
        // //       })
        // //       .send();
        // //   //parse the object campground
        //   req.body.campground.coordinates = data.body.features[0].geometry.coordinates;
          

          // console.log(response)
        Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
   });
      });
      
  //   });
  });



    
//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

///edit campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req,res){
    Campground.findById(req.params.id, function(err, foundCampground){
            res.render("campgrounds/edit", {campground: foundCampground});  
        });
});        

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  // geocoder.geocode(req.body.location, function (err, data) {
  //   if (err || !data.length) {
  //     req.flash('error', 'Invalid address');
  //     return res.redirect('back');
  //   }
    // req.body.campground.lat = data[0].latitude;
    // req.body.campground.lng = data[0].longitude;
    // req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
// });

//destroy campgroud route
router.delete('/:id', function(req, res) {
    Campground.findById(req.params.id, async function(err, campground) {
      if(err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      try {
          await cloudinary.v2.uploader.destroy(campground.imageId);
          campground.remove();
          req.flash('success', 'Campground deleted successfully!');
          res.redirect('/campgrounds');
      } catch(err) {
          if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
      }
    });
  });

  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;

