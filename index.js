const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function runBrowser(session_uuid) {
  
  console.log(session_uuid,' BROWSER - start ok')

  const browser = await puppeteer.launch();
  console.log(session_uuid,' BROWSER - browser ok')
  
  const page = await browser.newPage();
  console.log(session_uuid,' BROWSER - page ok')
  
  await page.goto('https://csgofast.com/#history/double/all');
  console.log(session_uuid,' BROWSER - site ok')

  const results = await page.evaluate(() => {
    //console.log(session_uuid,' BROWSER - read history start')
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

    //console.log(session_uuid,' BROWSER - read history done')

    return res;
  });

  var ids = Object.keys(results);
  console.log(session_uuid,' BROWSER - read history ok - ', ids.length)

  var fs = require('fs')
  var filename = 'results.json'; 
  fs.readFile(filename, function (err, data) {
      var json = JSON.parse(data);
     
      for(var i = 0; i < ids.length; i++){
        if(!json[ids[i]]){
          const moment = require("moment");
          results[ids[i]].t = moment(results[ids[i]].t, 'hh:mm A').format("YYYY-MM-DDTHH:mm:ss");
          json[ids[i]] = results[ids[i]];
        }
      }

      fs.writeFile(filename, JSON.stringify(json), function(err){
        if(err){console.log(session_uuid,'BROWSER - ', err)}
      })
  })

  console.log(session_uuid,' BROWSER - read history  successfully appended');

  await browser.close();

  console.log(session_uuid,' BROWSER - stop ok')
};

async function doSomething(session_uuid) {
  var t0 = new Date().getTime();
  try {
    var quote = await runBrowser(session_uuid);
  } catch (error) {
    console.log(session_uuid,' BROWSER --- ERROR in puppeteer', error);
  } finally {
    var t1 = new Date().getTime();
    var time = (t1 - t0);
    console.log(session_uuid, ' Execution time: ' +  millisToMinutesAndSeconds(time));
  }
}


console.log('APP - start script');
(async function loop() {
  var session_uuid = uuidv4().slice(0, 8);
  var time__sec_min = 60 * 1000;
  // var time__sec_min = 1000;
  var time__min =  6 * time__sec_min;
  var time__max = 14 * time__sec_min;
  var time_rand = randomInt (time__min, time__max);
  console.log('----- NEXT TIME ', millisToMinutesAndSeconds(time_rand), ", sessionID: ", session_uuid);
  setTimeout(function() {
    doSomething(session_uuid)
      .then(() => loop())
  }, time_rand);
}();