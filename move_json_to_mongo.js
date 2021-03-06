const moment = require("moment");
var fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
var {promisify} = require('util');
const readFile = promisify(fs.readFile);

const url = 'mongodb://user_write:Test1234@ds121088.mlab.com:21088/csgo';
const dbName = 'csgo';
const collection_name = 'rounds';
const filename = 'results.json';

(async () => {
    let client = await MongoClient.connect(url);
    console.log("DB Connected successfully to server");
    const db = await client.db(dbName);

    
    console.log('FILE read start ');
    let data = await fs.readFileSync(filename);
    if(!data){ console.error(' FILE read error - '+ data) }
    console.log('FILE read ok')

    console.log('DB update start')
    var col = db.collection(collection_name);
    var json = JSON.parse(data);
    var keys = Object.keys(json);
    for(var i = 0; i < keys.length; i++){
        var row = json[keys[i]];
        var id = parseInt(row['id']);
        // var last_id = 1253658;
        // var last_id = 1241201;
        
        if(id >= 1235890 && id <= 1255152){
            var row_id = row['id'] + "";
            row['id'] = id;
            var result = await col.update({"id": row_id}, row, {upsert: true});
            console.log('UP saved ', result.result.ok, row_id)
        }
    }
    console.log('DB update ok')

    client.close();
})();

// LAST ID: 1253658
// SIZE: 15106
// SIZE: 7.61 MB
 