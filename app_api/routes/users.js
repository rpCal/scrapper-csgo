var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {

  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://user_write:Test1234@ds121088.mlab.com:21088/csgo';
  const dbName = 'csgo';
  const collection_name = 'rounds';
  
  MongoClient.connect(url, function(err, client) {
    if(err){ return next(err);}
    var db = client.db(dbName);
    db.collection(collection_name, function(err, collection) {;
      if(err){ return next(err);}
      var result = collection
        .find({"id":
          // { "$gt": 1241201 } 
          { "$gt": 1255151 } 
        })
        .sort({ id: 1 })
        .toArray(function(err, result){
          if(err){ return next(err);}
          res.json(result);
          client.close();
        })
    })
  });
});

module.exports = router;
