
const moment = require("moment");
var fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var {promisify} = require('util');

const readFile = promisify(fs.readFile);

// Connection URL
const url = 'mongodb://user_write:Test1234@ds121088.mlab.com:21088/csgo';

// Database Name
const dbName = 'csgo';
const collection_name = 'rounds';

var filename = 'results.json';

(async () => {

// Use connect method to connect to the server
let client = await MongoClient.connect(url);
console.log("Connected successfully to server");

const db = await client.db(dbName);
let time = new Date();
let ROW = {"id":"1235891","t":time.toString(),"n":2,"c":"red","hash":"68dc985c4d111747471621444d0b63ce4b1fa4e3d06cdbab013abd31","salt":"a979786b2c62abde842382da7c4796c1c58fe995932d4342e16e982c","num":"0.141415641443202182413766645406"};
await db.collection(collection_name).update({"id": ROW['id']}, ROW, {upsert: true});

console.log('FILE read start ');

let data = await fs.readFileSync(filename);

if(!data){ console.error(' FILE read error - '+ data) }
console.log(' FILE read ok')

var json = JSON.parse(data);

var keys = Object.keys(json);

for(var i = 0; i < keys.length; i++){
    var row = json[keys[i]];
}
console.log(' FILE keys ', keys.length)

client.close();
})();


 