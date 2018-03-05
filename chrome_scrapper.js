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




const url_history = 'https://csgofast.com/#history/double/all';
const url_game = 'https://csgofast.com/#game/double';

(async () => {
    logger.verbose('APP - start script');


    const MongoClient = require('mongodb').MongoClient;
    const url = 'mongodb://user_write:Test1234@ds121088.mlab.com:21088/csgo';
    const dbName = 'csgo';
    const collection_name = 'rounds';
    let client = await MongoClient.connect(url);
    logger.verbose("DB Connected successfully to server");
    const db = await client.db(dbName);

    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({headless: false});

    const page = await browser.newPage();
    await page.on('console', msg => {
        if(msg.text().includes("_SAVE_RESULTS_")){
            var row = JSON.parse(msg.text().split('_RESULTS_')[1]);
            db.collection(collection_name).update({"id": row['id']}, row, {upsert: true});
            logger.info('UPDATE saved ', row['id']);
        }else{
            if(msg.text().includes("_SOCKET_")){
                logger.verbose(`LOG: ${msg.text()}`);
            }
        }
    });
    await page.evaluateOnNewDocument( () => {
        (function debugify_content_script(){
            
                var newRound = null;
                var totalSumValue = null;
                var totalUsers = [];
                var lastRoundNumber = null;
            
                var nativeWebSocket = window.WebSocket;
                var requests = window.requestLog = {}; 
                var WebSocket = window.WebSocket = function(uri) {
                //   console.log('new WebSocket created', uri);
                  this.websocket = new nativeWebSocket(uri);
                  this.websocket.onopen = this.onOpen.bind(this);
                  this.websocket.onmessage = this.onMessage.bind(this);
                  this.listeners = {onmessage: null, onopen: null};
              
                  if (!window._openWebSockets) window._openWebSockets = [];
                  window._openWebSockets.push(this);
                };
                WebSocket.prototype.send = function(msg) {
                    // console.log('>>',  msg);
                  this.websocket.send.apply(this.websocket, arguments);
                }
                WebSocket.prototype.onOpen = function(e){
                //   console.log('OPEN', arguments);
                  this.listeners.onopen(e);
                }
                WebSocket.prototype.onMessage = function(e){
                    if(e.data.includes("rooms:double:update")){
                        var data = JSON.parse(e.data.slice(2))[1];
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
                                    totalUsers[i]['r'] = totalUsers[i]['bet'] == color;
                                }

                                newRound["users"] = totalUsers;

                                newRound["sum_g"] = totalSumValue['zero'];
                                newRound["sum_r"] = totalSumValue['red'];
                                newRound["sum_b"] = totalSumValue['black'];

                                console.log(`_SAVE_RESULTS_${JSON.stringify(newRound)}`);

                                totalSumValue = null;
                                newRound = null;
                                totalUsers = [];
                                
                                // console.log('_SOCKET_ kolejna runda')
                            }else{
                                console.log('_SOCKET_ omijam zapis rundy...')
                            }
                            


                            // ZAPIS NOWA RUNDE 
                            console.log('_SOCKET_',  JSON.stringify( data["number"]) );
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
                    }
                  this.listeners.onmessage(e);
                }
                Object.defineProperty(WebSocket.prototype, 'readyState', {
                  get: function() {
                    return this.websocket.readyState;
                  }
                });
                Object.defineProperty(WebSocket.prototype, 'onopen', {
                  get: function() {
                    return this.listeners.onopen;
                  },
                  set: function(fn) {
                    this.listeners.onopen = fn;
                  }
                });
                Object.defineProperty(WebSocket.prototype, 'onclose', {
                  get: function() {
                    return this.websocket.onclose;
                  },
                  set: function(fn) {
                    this.websocket.onclose = fn;
                  }
                });
                Object.defineProperty(WebSocket.prototype, 'onmessage', {
                  get: function() {
                    return this.listeners.onmessage;
                  },
                  set: function(fn) {
                    this.listeners.onmessage = fn;
                  }
                });
                Object.defineProperty(WebSocket.prototype, 'onerror', {
                  get: function() {
                    return this.websocket.onerror;
                  },
                  set: function(fn) {
                    this.websocket.onerror = fn;
                  }
                });
              })();
        // .bind(this);
    });
    await page.goto(url_game);
    // await page.evaluate(() => console.log(`url is ${location.href}`));
    // await page.evaluate(() => console.log(`url is ${location.href}`));
    const rund_id = await page.evaluate(evaluate_get_game_id);
   
    // await delay(1000);
    // const page2 = await browser.newPage();
    // await page2.goto(url_history);
    // await page2.reload();
    // await delay(1000);
    // const results = await page2.evaluate(evaluate_get_history_results);
    
    logger.info(`wyniki ${rund_id}`);
    
    // await delay(1000);
    // await browser.close();
    // logger.info(`wyniki ${rund_id}`)
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

