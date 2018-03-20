
const winston = require('winston');
let logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({  format: winston.format.simple(),  level: "verbose" })
    ]
});

(async () => {
    
    const MongoClient = require('mongodb').MongoClient;

    const url = 'mongodb://user_read:Test1234@ds121088.mlab.com:21088/csgo';
    const client = await MongoClient.connect(url);
    const db = await client.db('csgo');
    logger.verbose("DB Connected successfully to server");
    
    // const local_url = 'mongodb://admin:password@172.19.0.2:27017/admin';
    // const local_client = await MongoClient.connect(local_url);
    // const local_db = await local_client.db('admin');
    // logger.verbose("local DB Connected successfully to server");

    const maxTimeMS = 1000000;
    const cursor = db.collection('crash').find({ 
        // "id": { "$gt": 1241201 },
        // "id": { "$gt": 1265950 },
        // "users.1": {"$exists": true}
    }, {"_id": 0, "coef": 1})
    .sort({ id: -1 })
    .limit(4000)
    .addCursorFlag('noCursorTimeout',true)
    .maxTimeMS(maxTimeMS);    

    const rounds_len = await cursor.count();
    console.log('Powinno byc rund ', rounds_len)
    let licznik_users = 0;
    let licznik_rund = 0;

    for (let round = await cursor.next(); round != null; round = await cursor.next()) {
        licznik_rund++;
        console.log('---------- Read Round ID: ', round.id, licznik_rund, rounds_len - licznik_rund, round);

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
})();