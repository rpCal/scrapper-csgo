const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');
const moment = require("moment");



const winston = require('winston');
let logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({  format: winston.format.simple(),  level: "verbose" }),
        new winston.transports.File({ filename: 'LOG_chrom_scrapper_error.log', level: 'error' }),
        new winston.transports.File({ filename: 'LOG_chrom_scrapper_combined.log' })
    ]
});




// const url_history = 'https://csgofast.com/#history/double/all';
// const url_game = 'https://csgofast.com/#game/double';
const url_game = 'https://csgofast.com/#faq';


(async () => {
    logger.verbose('APP - start script');


    const MongoClient = require('mongodb').MongoClient;
    const url = 'mongodb://user_write:Test1234@ds121088.mlab.com:21088/csgo';
    const dbName = 'csgo';
    const collection_name = 'rounds';
    let client = await MongoClient.connect(url);
    logger.verbose("DB Connected successfully to server");
    const _db = await client.db(dbName);

    const _browser = await puppeteer.launch();
    // const _browser = await puppeteer.launch({headless: false});

/*
    const  moment = require('moment');
    // get the client
    const  mysql = require('mysql2/promise');
    // create the connection
    const connection = await mysql.createConnection({host:'172.20.0.2', user: 'admin', database: 'csgo', password : 'password'});
    // query database
    let rows, fields, raw_numer, dateString, row_exists;  
    logger.verbose("DB mysql Connected successfully to server");
*/
    const runNewScrapperPage = async (browser, db, callback) => {
        const page = await browser.newPage();
        let savedRoundCount = 0;
        let page_removed = false;
        await page.on('console', msg => {
            if(msg.text().includes("_SOCKET_")){
                logger.verbose(`LOG: ${msg.text()}`);
            }
            // logger.verbose(`LOG: ${msg.text()}`);
        });
        await page.exposeFunction('saveDoubleRound', (round) => {
            if(!page_removed){
                logger.info(`saveDoubleRound; ${round['id']}; ${round['c']}; Users: ${round['users'].length}`);
                db.collection('rounds').update({"id": round['id']}, round, { upsert: true });    
                    // try{
                    //     connection.query(`
                    //     SELECT EXISTS(SELECT 1
                    //         FROM rounds AS ur
                    //         WHERE   ur.round_id = ?
                    //     LIMIT 1
                    //     ) AS row_exists;    
                    //     `, [round.id], function (error, rows, fields) {
                    //         if (error) throw error;
                    //         row_exists = rows['0']['row_exists'] == 1;
                    //         if(!row_exists){
                    //             connection.query(`
                    //             INSERT INTO rounds(
                    //                 round_t, round_c, round_salt, round_hash,  round_id,
                    //                 round_sum_g, round_sum_r, round_sum_b, round_n, round_random_n, 
                    //                 round_users_count
                    //             )
                    //             VALUES (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'),?,?,?,?,?,?,?,?,?,?);    
                    //             `, [
                    //                 getDateTime(new Date(round.t)), round.c, round.salt, round.hash, round.id, 
                    //                 round.sum_g, round.sum_r, round.sum_b, round.n, round.num, 
                    //                 round.users.length
                    //             ], function (error, rows, fields) {
                    //                 if (error) throw error;
                    //                 logger.error("saveDoubleRound - MYSQL saved ");
                    //             });
                    //         }
                    //     });
                    // }catch(e){
                    //     logger.error("saveDoubleRound - mysql Problem with insert ROUND: ",e);
                    //     logger.error("saveDoubleRound - mysql Problem with insert ROUND: ",round.id);
                    // }


                    // if(round.users.length > 0){
                    //     for (let u of round.users) {

                    //         let rund_id = round.id;
                    //         let rund_t = round.t;
                    //         let c = round.c;
                    //         let bet = u.bet;
                    //         let user_id = u.id;
                    //         let sum = parseInt(u.sum);
                    //         let r = u.r;
                    //         let sum_win = 0;
                    //         let sum_change = -1 * sum;;
                
                
                    //         if(u.bet == "zero"){ bet = "green"; }
                    //         if(u.r == true){ 
                    //             sum_win = (sum * (round.c == "green" ? 14 : 2));
                    //             sum_change = sum_change + sum_win; 
                    //         }
                        
                    //         try{
                    //             connection.query(`
                    //             SELECT EXISTS(SELECT 1
                    //                 FROM user_rounds AS ur
                    //                 WHERE   ur.user_id = ?
                    //                     AND ur.rund_id = ?
                    //                     AND ur.bet = ?
                    //                     AND ur.sum = ?
                    //             LIMIT 1
                    //             ) AS row_exists;    
                    //             `, [user_id, rund_id, bet, sum], function (error, rows, fields) {
                    //                 if (error) throw error;
                    //                 row_exists = rows['0']['row_exists'] == 1;
                    //                 if(!row_exists){
                    //                     connection.query(`
                    //                     INSERT INTO user_rounds(user_id, rund_id, c, bet, sum, r, sum_win, sum_change, rund_t)
                    //                     VALUES (?,?,?,?,?,?,?,?,STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'));    
                    //                     `, [
                    //                         user_id, rund_id, c, bet, sum, r, sum_win, sum_change, getDateTime(new Date(rund_t))
                    //                     ],function (error, rows, fields) {
                    //                         if (error) throw error;
                    //                     });
                    //                 }
                    //             });
                    //         }catch(e){
                    //             logger.error("saveDoubleRound - mysql Save user: ",user_id, rund_id, bet, sum, e);
                    //         }
                    //     }
                    // }
                    
            }
            savedRoundCount++;
            logger.info(`-- savedRoundCount; ${savedRoundCount}`);
            // if(savedRoundCount > 150){
            //     runNewScrapperPage(browser, db, function(){
            //         setTimeout(function(){
            //             page_removed = true;
            //             page.close();
            //         }, 70000);
            //     });
            // }
        });
        await page.exposeFunction('saveCrashRound', (data) => {
            if(!page_removed){
                logger.info(`saveCrashRound; ${data['id']}; ${data['coef']}; ${data['rand']}; Users: ${data['playerBets'].length}`);
                db.collection("crash").update({"id": data['id']}, data, { upsert: true });
            }
        });
        await page.exposeFunction('saveXRound', (data) => {
            if(!page_removed){
                logger.info(`saveXRound; ${data['id']}; ${data['s']}; ${data['rand']}; Users: ${data['topPlayers'].length}`);
                db.collection("x50").update({"id": data['id']}, data, { upsert: true });
            }
        });
    
        await page.evaluateOnNewDocument( () => {
            var newRound = null;
            var totalSumValue = null;
            var totalUsers = [];
    
            var handleEventRoomsDoubleUpdate = function(stringData){
                var data = JSON.parse(stringData.slice(2))[1];
                var keys = Object.keys(data);
                
                if(keys.includes("number")){ // NOWA RUNDA i HISTORIA OSTATNIEJ RUNDY
                    // ["number","md5","salt","timeOldEnds","rand","history","totalSum","topPlayers"]
                    
                    // WYSLIJ EVENT Z PODSUMOWANIEM RUNDY
                    if(newRound !== null){
    
                        var number = data["history"][0];
                        newRound["n"] = number;
    
                        var color = null;
                        if(number == 0){ color = "green"; }
                        if(number >= 1 && number <= 7){ color = "red"; }
                        if(number >= 8 && number <= 14){ color = "black"; }
                        newRound["c"] = color;
    
                        for(var i = 0; i < totalUsers.length; i++){
                            if(totalUsers[i]['bet'] == "zero"){ totalUsers[i]['bet'] = "green"; }
                            totalUsers[i]['r'] = totalUsers[i]['bet'] == color;
                        }
    
                        newRound["users"] = totalUsers;
    
                        newRound["sum_g"] = totalSumValue['zero'];
                        newRound["sum_r"] = totalSumValue['red'];
                        newRound["sum_b"] = totalSumValue['black'];
    
                        try{
                            window.saveDoubleRound(newRound);
                        }catch(err) {
                            console.log('_SOCKET_ Problem z zapisem saveDoubleRound', err);
                        }
                        
                        // console.log(`_SAVE_RESULTS_${JSON.stringify(newRound)}`);
    
                        totalSumValue = null;
                        newRound = null;
                        totalUsers = [];
                        
                        // console.log('_SOCKET_ kolejna runda')
                    }else{
                        // console.log('_SOCKET_ omijam zapis rundy...')
                    }
                    
    
    
                    // ZAPIS NOWA RUNDE 
                    console.log('_SOCKET_ DOUBLE',  JSON.stringify( data["number"]) );
                    newRound = Object.assign({
                        "id": data["number"],
                        "hash": data["md5"],
                        "salt": data["salt"],
                        "t": data["timeOldEnds"],
                        "num": "",
                        "n": "",
                        "c": "",
                        "sum_g": "",
                        "sum_r": "",
                        "sum_b": "",
                        "users": []
                    });
                    data["topPlayers"].forEach(function(i){
                        var betType = i['betType'];
                        if(i['betType'] == "zero"){ betType = "green"; }
                        totalUsers.push({
                            "bet": betType,
                            "id": i['playerId'],
                            "sum": i['sum'],
                            "r": false
                        })
                    });
                }
                if(keys.length == 2 && 
                    keys.includes("totalSum") && 
                    keys.includes("topPlayers")){ // ZMIANA NA LISCIE OSOB
                    // ["totalSum","topPlayers"]
                    if(newRound !== null){
                        totalSumValue = data['totalSum'];
                        data["topPlayers"].forEach(function(i){
                            totalUsers.push({
                                "bet": i['betType'],
                                "id": i['playerId'],
                                "sum": i['sum'],
                                "r": false
                            })
                        });
                    }
                }
    
                if(keys.length == 3 && 
                    keys.includes("salt") && 
                    keys.includes("rand") && 
                    keys.includes("timeOldEnds")){ // WYNIK
                    // ["salt","timeOldEnds","rand"]
                    if(newRound !== null){
                        newRound['salt'] = data['salt'];
                        newRound['t'] = data['timeOldEnds'];
                        newRound['num'] = data['rand'];
                    }
                }
                data = null;
                keys = null;
            };
    
    
            var crashNewRound = null;
            var crashPlayerBets = [];
    
            var handleEventRoomsCrashUpdate = function(stringData){            
                // len 1 && playerBets -- aktualizacja ludzi
                // len 2 && gameRun,playerBets
                // len 4 && crashed,rand,coef,salt -- wynik
                // len 9 && id,number,md5,gameRunTs,gameRun,crashed,rand,coef,salt -- nowa runda
    
                var data = JSON.parse(stringData.slice(2))[1];
                var keys = Object.keys(data);
    
                if(keys.includes("crashed") && data["crashed"] == true){ // wynik rundy
			if(crashNewRound !== null){
                    crashNewRound['coef'] = data['coef'];
                    crashNewRound['rand'] = data['rand'];
                    crashNewRound['salt'] = data['salt'];
			}
                }
    
                if(keys.includes("playerBets")){ // aktualizacja betów
                    data["playerBets"].forEach(function(player){
                        crashPlayerBets.push({
                            "id": player['id'],
                            "playerId": player['playerId'],
                            "playerName": player['playerName'],
                            "coef": player['coef'],
                            "coefAutoStop": player['coefAutoStop'],
                            "amount": player['amount']
                        })
                    });
                }

                if(keys.includes("number")){ //Nowa runda
    
                    // WYSLIJ EVENT Z PODSUMOWANIEM RUNDY
                    if(crashNewRound !== null){
                        crashNewRound["playerBets"] = crashPlayerBets;
    
                        try{
                            window.saveCrashRound(crashNewRound);
                        }catch(err) {
                            console.log('_SOCKET_ Problem z zapisem saveCrashRound', err);
                        }
    
                        crashNewRound = null;
                        crashPlayerBets = [];
                    }
    
                    console.log('_SOCKET_ CRASH',  JSON.stringify( data["number"]) );
                    crashNewRound = {
                        "id": data["number"],
                        "hash": data["md5"],
                        "salt": data["salt"],
                        "rand": data["rand"],
                        "coef": data['coef'],
                        "t": data["gameRunTs"],
                        "playerBets": []
                    };
                }
    
                // console.log(`KEYS ${keys.length} ${keys}`);
            };
    
    
            var xNewRound = null;
            var xTotalSum = null;
            var xPlayerBets = [];
    
            
            var handleEventRoomsXUpdate = function(stringData){
                // len 1 && playerBets -- aktualizacja ludzi
                // len 2 && gameRun,playerBets
                // len 4 && crashed,rand,coef,salt -- wynik
                // len 9 && id,number,md5,gameRunTs,gameRun,crashed,rand,coef,salt -- nowa runda
    
                var data = JSON.parse(stringData.slice(2))[1];
                var keys = Object.keys(data);
   
                if(keys.includes("number")){ //Nowa runda
    
                    // WYSLIJ EVENT Z PODSUMOWANIEM RUNDY
                    if(xNewRound !== null){
    
                        for(var i = 0; i < xPlayerBets.length; i++){
                            xNewRound["topPlayers"].push(xPlayerBets[i]);
                        }
    
                        try{
                            window.saveXRound(xNewRound);
                        }catch(err) {
                            console.log('_SOCKET_ Problem z zapisem saveX50Round', err);
                        }
    
                        xNewRound = null;
                        xPlayerBets = [];
                    }
    
                    console.log('_SOCKET_  X50',  JSON.stringify( data["number"]) );
                    xNewRound = {
                        "id": data["number"],
                        "hash": data["md5"],
                        "salt": data["salt"],
                        "rand": data["rand"],
                        "s": null,
                        "t": data["timeOldEnds"],
                        "topPlayers": [],
                        "totalSum": {}
                    };
                }
    
    
                if(keys.includes("history")){ // wynik rundy
                    if(xNewRound !== null){
                        xNewRound['s'] = data['history'][0]['s'];
                    }
                }
    
                if(keys.length == 3 && 
                    keys.includes("salt") && 
                    keys.includes("rand") && 
                    keys.includes("timeOldEnds")){ // wynik z losową liczbą
                    // ["salt","timeOldEnds","rand"]
                    if(xNewRound !== null){
                        xNewRound['salt'] = data['salt'];
                        xNewRound['t'] = data['timeOldEnds'];
                        xNewRound['rand'] = data['rand'];
                    }
                }
    
                if(keys.includes("totalSum")){ // aktualizacja sumy obstawien
                    if(xNewRound !== null){
                        xTotalSum['totalSum']['blue'] = data["totalSum"]['blue'];
                        xTotalSum['totalSum']['gold'] = data["totalSum"]['gold'];
                        xTotalSum['totalSum']['green'] = data["totalSum"]['green'];
                        xTotalSum['totalSum']['red'] = data["totalSum"]['red'];
                    }
                }
    
                if(keys.includes("topPlayers")){ // aktualizacja betów
                    // console.log('_SOCKET_  X50 USERS COUNT',  JSON.stringify( data["topPlayers"].length) );
                    data["topPlayers"].forEach(function(player){
                        xPlayerBets.push({
                            "id": player['id'],
                            "playerId": player['playerId'],
                            "playerName": player['playerName'],
                            "betType": player['betType'],
                            "sum": player['sum']
                        })
                    });
                }
            };
    
    
            (function debugify_content_script(){
                var nativeWebSocket = window.WebSocket;
                var requests = window.requestLog = {}; 
                var WebSocket = window.WebSocket = function(uri) {
                    this.websocket = new nativeWebSocket(uri);
                    this.websocket.onopen = this.onOpen.bind(this);
                    this.websocket.onmessage = this.onMessage.bind(this);
                    this.listeners = {onmessage: null, onopen: null};
                    if (!window._openWebSockets) window._openWebSockets = [];
                    window._openWebSockets.push(this);
                };
                WebSocket.prototype.send = function(msg) {
                    this.websocket.send.apply(this.websocket, arguments);
                }
                WebSocket.prototype.onOpen = function(e){
                    this.listeners.onopen(e);
                }
                WebSocket.prototype.onMessage = function(e){
                    if(e.data.includes("rooms:double:update")){
                        handleEventRoomsDoubleUpdate(e.data);
                    }
                    if(e.data.includes("rooms:crash:update")){
                        handleEventRoomsCrashUpdate(e.data);
                    }
                    if(e.data.includes("rooms:x50:update")){
                        handleEventRoomsXUpdate(e.data);
                    }
                    this.listeners.onmessage(e);
                }
                Object.defineProperty(WebSocket.prototype, 'readyState', {
                    get: function() { return this.websocket.readyState; }
                });
                Object.defineProperty(WebSocket.prototype, 'onopen', {
                    get: function() {return this.listeners.onopen;},
                    set: function(fn) { this.listeners.onopen = fn;}
                });
                Object.defineProperty(WebSocket.prototype, 'onclose', {
                    get: function() { return this.websocket.onclose; },
                    set: function(fn) { this.websocket.onclose = fn; }
                });
                Object.defineProperty(WebSocket.prototype, 'onmessage', {
                    get: function() { return this.listeners.onmessage; },
                    set: function(fn) { this.listeners.onmessage = fn; }
                });
                Object.defineProperty(WebSocket.prototype, 'onerror', {
                    get: function() { return this.websocket.onerror; },
                    set: function(fn) { this.websocket.onerror = fn; }
                });
            })();
        });
        await page.goto(url_game);

        if(callback){
            callback();
        }
    };

    await runNewScrapperPage(_browser, _db);
})();






const run_game_logger = async () => {
    var last_round_hash = document.getElementById('roundHash').innerHTML;
    var last_rand_num = document.getElementById('randNum').innerHTML;
    var t0 = performance.now();

    function run(){
        var curr_rand_num = document.getElementById('randNum').innerHTML;
        if(curr_rand_num != last_rand_num){ 
            last_rand_num = curr_rand_num;
            var win_color = null;    
            var round_elem = document.querySelector('.bonus-game-state.back.bonus-game-end');
            if(round_elem.classList.contains('red')){ win_color = "red"; }
            if(round_elem.classList.contains('black')){ win_color = "black"; }
            if(round_elem.classList.contains('zero')){ win_color = "green"; }
            var game_id = document.querySelector('.bonus-game-info .value').innerHTML;
            console.log(`Wynik rundy - ID: ${game_id}, kolor: ${win_color}`);
        }

        var curr_round_hash = document.getElementById('roundHash').innerHTML;
        if(curr_round_hash != last_round_hash){
            last_round_hash = curr_round_hash;
            var t1 = performance.now(); var time = (t1 - t0); t0 = performance.now();
            var game_id = document.querySelector('.bonus-game-info .value').innerHTML;
            console.log(`Nowa runda - ID: ${game_id}, T:${parseInt(time / 1000)} - ${new Date()}`);
        }
    }

    var tm; 
    clearInterval(tm); 
    tm = setInterval(run, 1000);
}


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const evaluate_get_game_id = async () => {
    return document.querySelector('.game-num .value').innerHTML;
};

const evaluate_get_history_results = async () => {
    var res = {};
    var history_item = {id:"", t:"", r:"", c:"", hash: "", salt:"", num: ""}; 
    var history_results = $('body .history-content .history-item').map((e, i) => { 
        var _i = $(i);
        var _item = _i.find('.game-roulette-history-item');

        var g_num = _i.find('.history-game-number').text().split("#")[1];
        var g_timestamp = _i.find(".history-timestamp").text().split("at ")[1];
        var g_res = parseInt(_item.text(), 10);
        
        var g_col = null;
        if(_item.hasClass('red')){ g_col = 'red' }
        if(_item.hasClass('black')){ g_col = 'black' }
        if(_item.hasClass('zero')){ g_col = 'green' }	

        var hash = _i.find('.game-hash-info div:eq(0) span').text();
        var salt = _i.find('.game-hash-info div:eq(1) span').text();
        var num = _i.find('.game-hash-info div:eq(2) span').text();
        
        res[g_num] = { id: g_num, t: g_timestamp, n: g_res, c: g_col, hash: hash, salt: salt, num: num };
        return {};
    });
    return res;
};



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









// function randomInt (low, high) {
//   return Math.floor(Math.random() * (high - low) + low);
// }

// function millisToMinutesAndSeconds(millis) {
//   var minutes = Math.floor(millis / 60000);
//   var seconds = ((millis % 60000) / 1000).toFixed(0);
//   return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
// }

// async function runBrowser(session_uuid, logger) {
  
//   logger.verbose(session_uuid + ' BROWSER - start ok')

//   const browser = await puppeteer.launch();
//   logger.verbose(session_uuid + ' BROWSER - browser ok')
  
//   const page = await browser.newPage();
//   logger.verbose(session_uuid + ' BROWSER - page ok')
  
//   await page.goto('https://csgofast.com/#history/double/all');
//   logger.verbose(session_uuid + ' BROWSER - site ok')

//   const results = await page.evaluate(() => {
//     // logger.verbose(session_uuid + ' BROWSER - read history start')
//     var res = {};
//     var history_item = {id:"", t:"", r:"", c:"", hash: "", salt:"", num: ""}; 
//     var history_results = $('body .history-content .history-item').map((e, i) => { 
//       var _i = $(i);
//       var _item = _i.find('.game-roulette-history-item');

//       var g_num = _i.find('.history-game-number').text().split("#")[1];
//       var g_timestamp = _i.find(".history-timestamp").text().split("at ")[1];
//       var g_res = parseInt(_item.text(), 10);
      
//       var g_col = null;
//       if(_item.hasClass('red')){ g_col = 'red' }
//       if(_item.hasClass('black')){ g_col = 'black' }
//       if(_item.hasClass('zero')){ g_col = 'green' }	

//       var hash = _i.find('.game-hash-info div:eq(0) span').text();
//       var salt = _i.find('.game-hash-info div:eq(1) span').text();
//       var num = _i.find('.game-hash-info div:eq(2) span').text();
      
//       res[g_num] = { id: g_num, t: g_timestamp, n: g_res, c: g_col, hash: hash, salt: salt, num: num };
//       return {};
//     });

//     // logger.verbose(session_uuid + ' BROWSER - read history done')

//     return res;
//   });

//   var ids = Object.keys(results);
//   logger.verbose(session_uuid +' BROWSER - read history ok - ' + ids.length)

//   var fs = require('fs')
//   var filename = 'results.json'; 
//   logger.verbose(session_uuid +' FILE read start ')
//   fs.readFile(filename, function (err, data) {
//       if(err){
//         logger.error(session_uuid +' FILE read error - '+ err)
//       }

//       logger.verbose(session_uuid +' FILE read ok')

//       var json = JSON.parse(data);
     
//       let count = 0;
//       const moment = require("moment");
//       for(var i = 0; i < ids.length; i++){
//         if(!json[ids[i]]){
//           results[ids[i]].t = moment(results[ids[i]].t, 'hh:mm A').format("YYYY-MM-DDTHH:mm:ss");
//           json[ids[i]] = results[ids[i]];
//           count++;
//         }
//       }

//       logger.verbose(session_uuid +' FILE save start')
//       fs.writeFile(filename, JSON.stringify(json), function(err){
//         if(err){
//           logger.error(session_uuid +' FILE save error - '+ err)
//         }

//         logger.verbose(session_uuid +' FILE save ok');
//         logger.info(session_uuid +' new history successfully appended ' + count);
//       })
//   })

//   logger.verbose(session_uuid +' BROWSER - read history  successfully appended');

//   await browser.close();

//   logger.verbose(session_uuid + ' BROWSER - stop ok')
// };

// async function doSomething(session_uuid, logger) {
//   var t0 = new Date().getTime();
//   logger.verbose(session_uuid + " Execution start: " + moment(t0).format("YYYY-MM-DDTHH:mm:ss"));
//   try {
//     var quote = await runBrowser(session_uuid, logger);
//   } catch (error) {
//     logger.error(session_uuid + ' BROWSER --- ERROR in puppeteer: ' + error);
//   } finally {
//     var t1 = new Date().getTime();
//     var time = (t1 - t0);
//     logger.verbose(session_uuid + " Execution end: " + moment(t1).format("YYYY-MM-DDTHH:mm:ss"));
//     logger.verbose(session_uuid + ' Execution time: ' +  millisToMinutesAndSeconds(time));

//     logger.info(session_uuid + " Execution: "  +
//       millisToMinutesAndSeconds(time)  + "s; " +
//       moment(t0).format("YYYY-MM-DDTHH:mm:ss") + " - start; " +
//       moment(t1).format("YYYY-MM-DDTHH:mm:ss") + " - end " 
//       );
//   }
// }



// doSomething(uuidv4().slice(0, 8), _logger);

// (function loop(logger) {
  
//   var session_uuid = uuidv4().slice(0, 8);
//   var time__sec_min = 60 * 1000;
//   //var time__sec_min = 1000;
//   var time__min =  6 * time__sec_min;
//   var time__max = 14 * time__sec_min;
//   var time_rand = randomInt (time__min, time__max);
//   logger.verbose('----- NEXT LOOP ' + millisToMinutesAndSeconds(time_rand)+ ", sessionID: " + session_uuid);
//   setTimeout(function() {
//     doSomething(session_uuid, logger)
//       .then(() => loop(logger))
//   }, time_rand);
// })(_logger);



// + 5631102 - "™L✪L™CSGOFAST.COM CS.MONEY"
// 5681265 - Все заебало...🎧
// 448435 - "Loot Crate CSGOFAST.COM"
// 4119568 - "xen xu tian csgofast.com" - gdy 2000?
// 5559383 - "rVs csgofast.com"
// 6048492 - jgamm81
// - 5925086 - "Negan CSGOFAST.COM / CS.MONEY"
// + 422876 - "☣ Quckly;"
// 3878965 - "bel1"
// 3066297 - $carecrow - 
// 5365813 -creamyLVcsgofast.com
/*
FIBO
1, 1. 
2, 1. 
3, 2. 
4, 3. 
5, 5. 
6, 8. 
7, 13. 
8, 21. 
9, 34. 
10, 55. 
11, 89.
12, 144. 
13, 233. 
14, 377. 
15, 610. 
16, 987. 
*/

// setInterval(function(){
// document.querySelectorAll('[data-userid="5631102"]').length
// }, 500);
