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
          { "$gt": 1241201 } 
          // { "$gt": 1255151 } 
        },{
          sort: { id: 1 },
          limit: 50000,
          fields: {
            "_id": 0,
            // "id":1,
            // "t":1,
            // "n":1,
            // "c":1,
            // "sum_g": 1,
            // "sum_r": 1,
            // "sum_b": 1,
            "hash":0,
            "salt":0,
            "num":0,
            "users": 0,
          }
        })
        .toArray(function(err, result){
          if(err){ return next(err);}
          res.json(result);
          client.close();
        })
    })
  });
});

router.get('/all', function(req, res, next) {
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
          { "$gt": 1241201 } 
          // { "$gt": 1255151 } 
        },{
          sort: { id: 1 },
          limit: 50000,
          // fields: {
            // "_id": 0,
            // "id":1,
            // "t":1,
            // "n":1,
            // "c":1,
            // "sum_g": 1,
            // "sum_r": 1,
            // "sum_b": 1,
            // "hash":0,
            // "salt":0,
            // "num":0,
            // "users": 0,
          // }
        })
        .toArray(function(err, result){
          if(err){ return next(err);}
          res.json(result);
          client.close();
        })
    })
  });
});

module.exports = router;


// Do sprawdzenia: DZIAŁA!
// Zagraj gdy jest == 6, to graj
// Jesli przegrales to zwieksz stawke

// Do sprawdzenia:
// Jesli serwer duzo przegral to moze zmienic sie dlugość wagonów
// Czy jest korelacja pomiedzy przegrana/wygrana jest zwiazana z dlugoscia wagonow...



// var sum = 0;
// var bet = 10;
// var count_lose = 0;
// var count_win = 0;
// var break_number = 6; 
// db.getCollection('crash').find({ }, { "_id":0, "id": 1, "coef": 1, "t":1, "rand":1 })
// .toArray()
// .forEach(function(raw){
//     var coef = parseFloat(raw['coef']);
//     sum = sum - bet;
//     if(coef > break_number){
//         count_win++;
//         sum = sum + (bet * break_number);
//     }else{
//         count_lose++;
//     }
// });
// var A = [sum, count_lose, count_win]
// A