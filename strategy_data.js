
const winston = require('winston');
let logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({  format: winston.format.simple(),  level: "verbose" })
    ]
});


/**
 * MONGO PARSE AND MAKE STATS in sql
 */

(async () => {
    
    const  moment = require('moment');
    // get the client
    const  mysql = require('mysql2/promise');
    // create the connection
    const connection = await mysql.createConnection({host:'172.20.0.2', user: 'admin', database: 'csgo', password : 'password'});
    // query database
    let rows, fields, raw_numer, dateString, row_exists;    

    const MongoClient = require('mongodb').MongoClient;
    const local_url = 'mongodb://admin:password@172.19.0.2:27017/admin';
    const local_client = await MongoClient.connect(local_url);
    const local_db = await local_client.db('admin');
    logger.verbose("local DB Connected successfully to server");

    const maxTimeMS = 1000000;
    const cursor = local_db.collection('rounds').find({ 
        // "id": { "$gt": 1241201 },
        // "id": { "$gt": 1257133 },
        
        "id": { "$gt": 1257231 },
        // "id": { "$gt": 1261201 },
        // "id": { "$gt": 1267201 }, +
        // "id": { "$gt": 1270000 }, + 
        "users.1": {"$exists": true}
    }).addCursorFlag('noCursorTimeout',true).maxTimeMS(maxTimeMS);    

    // 1253929-1257136 OK
    // 1261202-1262396 OK
    // 1267202-1268842 OK
    // 1270001-1270878 OK

    const rounds_len = await cursor.count();
    console.log('Powinno byc rund ', rounds_len)
    let licznik_users = 0;
    let licznik_rund = 0;

    for (let round = await cursor.next(); round != null; round = await cursor.next()) {
        licznik_rund++;
        console.log('---------- Read Round ID: ', round.id, licznik_rund, rounds_len - licznik_rund);

        row_exists = false;
        try{
            [rows, fields] = await connection.query(`
            SELECT EXISTS(SELECT 1
                FROM rounds AS ur
                WHERE   ur.round_id = ?
            LIMIT 1
            ) AS row_exists;    
            `, [round.id]);
            row_exists = rows['0']['row_exists'] == 1;
            // logger.verbose(`Select values  ${row_exists} `);
        }catch(e){
            logger.error("Problem with ROUND SELECT EXISTS: ", e);
        }

        if(!row_exists){ 
            try{
                [rows, fields] = await connection.query(`
                INSERT INTO rounds(
                    round_t, round_c, round_salt, round_hash,  round_id,
                    round_sum_g, round_sum_r, round_sum_b, round_n, round_random_n, 
                    round_users_count
                )
                VALUES (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'),?,?,?,?,
                        ?,?,?,?,?,
                        ?);    
                `, [
                    getDateTime(new Date(round.t)), round.c, round.salt, round.hash, round.id, 
                    round.sum_g, round.sum_r, round.sum_b, round.n, round.num, 
                    round.users.length
                ]);
                // logger.verbose(`Insert values  ${rows.length} `, rows);
            }catch(e){
                logger.error("Problem with insert ROUND: ",e);
                logger.error("Problem with insert ROUND: ",round.id);
            }
        }



        if(!round.users){ continue; }
        if(round.users.length == 0){ continue }
        
        for (let u of round.users) {

            let rund_id = round.id;
            let rund_t = round.t;
            let c = round.c;
            let bet = u.bet;
            let user_id = u.id;
            let sum = parseInt(u.sum);
            let r = u.r;
            let sum_win = 0;
            let sum_change = -1 * sum;;


            if(u.bet == "zero"){ bet = "green"; }
            if(u.r == true){ 
                sum_win = (sum * (round.c == "green" ? 14 : 2));
                sum_change = sum_change + sum_win; 
            }
        
            row_exists = false;
            try{
                [rows, fields] = await connection.query(`
                SELECT EXISTS(SELECT 1
                    FROM user_rounds AS ur
                    WHERE   ur.user_id = ?
                        AND ur.rund_id = ?
                        AND ur.bet = ?
                        AND ur.sum = ?
                LIMIT 1
                ) AS row_exists;    
                `, [user_id, rund_id, bet, sum]);
                row_exists = rows['0']['row_exists'] == 1;
                // logger.verbose(`Select values  ${row_exists} `);
            }catch(e){
                logger.error("Problem with SELECT EXISTS: ",user_id, rund_id, bet, sum, e);
            }

            if(row_exists){ continue; }

            try{
                [rows, fields] = await connection.query(`
                INSERT INTO user_rounds(user_id, rund_id, c, bet, sum, r, sum_win, sum_change, rund_t)
                VALUES (?,?,?,?,?,?,?,?,STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'));    
                `, [
                    user_id, rund_id, c, bet, sum, r, sum_win, sum_change, getDateTime(new Date(rund_t))
                ]);
                // logger.verbose(`Insert values  ${rows.length} `, rows);
            }catch(e){
                logger.error("Problem with insert: ",e);
                logger.error("Problem with insert: ",user_id, rund_id, c, bet, sum, r, sum_win, dateString);
            }
            // return  false;
        }
        // return false;
    }
})();


function getDateTime(date) {

    // var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

}



/**
 * MONGO PARSE AND MAKE STATS IN MONGO
 */

(async () => {
    
    const MongoClient = require('mongodb').MongoClient;

    // const url = 'mongodb://user_read:Test1234@ds121088.mlab.com:21088/csgo';
    // const client = await MongoClient.connect(url);
    // const db = await client.db('csgo');
    // logger.verbose("DB Connected successfully to server");
    
    const local_url = 'mongodb://admin:password@172.19.0.2:27017/admin';
    const local_client = await MongoClient.connect(local_url);
    const local_db = await local_client.db('admin');
    logger.verbose("local DB Connected successfully to server");

    const maxTimeMS = 1000000;
    const cursor = local_db.collection('rounds').find({ 
        // "id": { "$gt": 1241201 },
        "id": { "$gt": 1265950 },
        "users.1": {"$exists": true}
    }).addCursorFlag('noCursorTimeout',true).maxTimeMS(maxTimeMS);    

    const rounds_len = await cursor.count();
    console.log('Powinno byc rund ', rounds_len)
    let licznik_users = 0;
    let licznik_rund = 0;

    for (let round = await cursor.next(); round != null; round = await cursor.next()) {
        licznik_rund++;
        console.log('---------- Read Round ID: ', round.id, licznik_rund, rounds_len - licznik_rund);

        if(!round.users){ continue; }
        if(round.users.length == 0){ continue }
        
        for (let u of round.users) {
        
            // console.log('User with ID ', u.id);

            let db_user;
            try{
                db_user = await local_db.collection("double_users").findOne({ id: u.id });
            }catch(err){
                console.log('Problem z otwarciem UID : ', u.id, err);
                db_user = false;
            }
            

            if(!db_user){
                db_user = {
                    id: u.id,
                    licznik_wygranych: 0,
                    licznik_przegranych: 0,
                    licznik_sum_obstawien: 0,
                    licznik_sum_wygranych: 0,
                    procent_wygranych: 0,
                    procent_przegranych: 0,
                    max_obstawienie: 0,
                    bilans_koniec: 0,
                    zysk: 0,
                    procent: 0,
                    rozegranych_gier: 0,
                    bilans_zmiana: [],
                    bilans_kwota: [],
                    sumy_obstawien: [],
                    rundy: []
                }
            }

            // console.log("Czym jest?", db_user.id);

            var kwota_obstawienia = parseInt(u.sum)
            var zmiana_bilansu = -1 * kwota_obstawienia;
            if(u.r == true){
                wygrana = (kwota_obstawienia * (round.c == "green" ? 14 : 2));
                zmiana_bilansu = zmiana_bilansu + wygrana;
                db_user.licznik_wygranych++;
                db_user.licznik_sum_wygranych += wygrana;
            }else{
                db_user.licznik_przegranych++;
            }
            if(kwota_obstawienia >= db_user.max_obstawienie){
                db_user.max_obstawienie = kwota_obstawienia;
            }
            db_user.rozegranych_gier++;
            db_user.procent_wygranych = ((db_user.licznik_wygranych / db_user.rozegranych_gier)* 100);
            db_user.procent_przegranych = ((db_user.licznik_przegranych / db_user.rozegranych_gier)* 100);
            db_user.sumy_obstawien.push(kwota_obstawienia);
            db_user.licznik_sum_obstawien += kwota_obstawienia; 
            db_user.bilans_koniec += zmiana_bilansu;
            db_user.bilans_kwota.push(db_user.bilans_koniec);
            db_user.bilans_zmiana.push(zmiana_bilansu);
            db_user.zysk = db_user.licznik_sum_wygranych - db_user.licznik_sum_obstawien;
            db_user.procent = ((db_user.zysk / db_user.licznik_sum_obstawien ) * 100);
            if(u.bet == "zero"){
                u.bet = "green";
            }
            db_user.rundy.push({
                "rund_id": round.id,
                "rund_t": round.t,
                "c": round.c,
                "bet": u.bet,
                "id": u.id,
                "sum": u.sum,
                "r": u.r
            });


            try{
                await local_db.collection("double_users").update({"id": db_user['id']}, db_user, { upsert: true });
                licznik_users++;
                // console.log(' --- SAVED USER ID: ', db_user['id'], licznik_users)
            }catch(err){
                console.log(' PROBLEM WITH USER ID: ', db_user['id'], licznik_users, err)
            }
        };
    }
});



// 0. liczba osob ktore ma zysk ponizej 0 - 72459 versus Ci ktorzy sa na plus 19046
// - Patrze tylko na tych ktorzy sa na plus:
// 1. Ci ktorzy rozegrali ponad 100 gier, to jedynie 605 osob
// 2. ponad 50% wygranych ma az 15724 osob
// 3. jest az 135 osob, ktore rozegraly przynajmniej 10 gier i maja 100% skutecznosci

// 10:00 2018-03-16
// O NIE, okazuje sie ze są duplikaty :( - liczenie nie ma sensu w takim razie.
// Przenosze baze do SQL
// 172.20.0.2 » csgo » Table: user_rounds


// CHECK FOR DUPLICATES in ids
//
// db.getCollection('double_users').aggregate(
//     {"$group" : { "_id": "$id", "count": { "$sum": 1 } } },
//     {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } }, 
//     {"$sort": {"count" : -1} },
//     {"$project": {"name" : "$_id", "_id" : 0} }     
// )




// SELECT EXISTS(SELECT 1
//     FROM user_rounds AS ur
//     WHERE ur.user_id = 4481061
//           AND ur.rund_id = 1255231
//           AND ur.c = 'green'
//           AND ur.sum = 10
// LIMIT 1
// ) AS row_exists;



// INSERT INTO user_rounds(user_id, rund_id, c, bet, sum, r, sum_win, rund_t)
// VALUES (4481061, 1255231, 'green', 'green', 10, 1, 140, STR_TO_DATE('2018-03-12T20:57:07.926Z', '%Y-%m-%dT%H:%i:%sZ'));


// GET STATS INFO PER USER ID
//
// SELECT user_id,
// ((SUM(sum_change) / SUM(sum)) * 100) as procent_zysku,
// SUM(sum) as sum_obstawien,
// SUM(sum_change) as zysk,
// COUNT(*) as licznik_rund,
// SUM(CASE WHEN r=1 THEN 1 ELSE 0 END) as licznik_wygranych,
// SUM(CASE WHEN r=0 THEN 1 ELSE 0 END) as licznik_przegranych,
// ((SUM(CASE WHEN r=1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as procent_wygranych,
// ((SUM(CASE WHEN r=0 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as procent_przegranych,
// max(sum_win) as max_obstawienie

// FROM user_rounds
// Group By user_id
// HAVING Count(*) > 10
// AND ((SUM(CASE WHEN r=1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) > 50
// AND ((SUM(sum_change) / SUM(sum)) * 100) > 10
// ORDER BY SUM(sum_change) DESC
// LIMIT 10