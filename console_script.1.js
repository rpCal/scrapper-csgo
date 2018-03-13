// VER. 2 - graj tylko gdy bedzie seria koloru 5
var bet_poczatkowy = 100,
  mnoznik_po_przegranej = 1.5,
  gier_do_rozegrania = 10000;

var updateColorStats = function (win_color) {
  if (color_starts.last_color == null) {
    color_starts.last_color = win_color;
  }

  if (win_color == 'black') {
    if (color_starts.last_color == 'black') {
      color_starts.black++;
    } else {
      color_starts.black = 1;
    }
    color_starts.no_black = 0;
  } else {
    color_starts.black = 0;
    color_starts.no_black++;
  }

  if (win_color == 'zero') {
    if (color_starts.last_color == 'zero') {
      color_starts.green++;
    } else {
      color_starts.green = 1;
    }
    color_starts.no_green = 0;
  } else {
    color_starts.green = 0;
    color_starts.no_green++;
  }

  if (win_color == 'red') {
    if (color_starts.last_color == 'red') {
      color_starts.red++;
    } else {
      color_starts.red = 1;
    }
    color_starts.no_red = 0;
  } else {
    color_starts.red = 0;
    color_starts.no_red++;
  }

  if (win_color == color_starts.last_color) {
    color_starts.any++;
  } else {
    color_starts.last_color = win_color;
    color_starts.any = 1;
  }
}
var playRound = function (bet_value, bet_color) {
  document.querySelector('.button.clear').click();
  var el = document.querySelector('.bonus-game-bet-input');
  var cp = el.selectionStart;
  el.value = bet_value;
  el.dispatchEvent(new Event('change'));
  el.selectionStart = cp;
  el.selectionEnd = cp;

  // przycisk zagraj
  document.querySelector('.bonus-game-calc-place-bet[data-bet-type="' + bet_color + '"]').click();
  // console.log('1c. ', document.querySelector('.bonus-game-calc-place-bet[data-bet-type="' + bet_color + '"]'));
}
var getGameTime = function (time_start) {
  return parseInt((performance.now() - time_start) / 1000);
}
var readGameColor = function () {
  var round_elem = document.querySelector('.bonus-game-state.back.bonus-game-end');
  var win_color = null;
  if (round_elem.classList.contains('red')) {
    win_color = "red";
  }
  if (round_elem.classList.contains('black')) {
    win_color = "black";
  }
  if (round_elem.classList.contains('zero')) {
    win_color = "zero";
  }
  return win_color;
}
var readBilans = function () {
  var text_1 = document.querySelector('.coins-component.middle-block').innerHTML;
  var text_2 = document.querySelector('.coins-component.middle-block .part').innerHTML;
  var result = parseInt("" + parseInt(text_1) + parseInt(text_2));
  return isNaN(result) ? 0 : result;
}
var readGameId = function () {
  return document.querySelector('.bonus-game-info .value').innerHTML;
}
var readHash = function () {
  return document.getElementById('roundHash').innerHTML;
}
var readNum = function () {
  return document.getElementById('randNum').innerHTML;
}

var last_round_hash = readHash();
var last_rand_number = readNum();
var time_start = performance.now();
var bilans_poczatkowy = readBilans();
var round_count = 0;
var czy_obstawione = false;
var bet_aktualny = bet_poczatkowy;
var bilans = bilans_poczatkowy;
var wynik_odczytany = true;
var obstawiony_color = null;
var licznik_wygranych = 0;
var licznik_przegranych = 0;
var suma_wygranych = 0;
var suma_przegranych = 0;
var color_starts = {
  green: 0,
  red: 0,
  black: 0,
  any: 0,
  last_color: null,
  no_green: 0,
  no_red: 0,
  no_black: 0
};

console.log(`0. START --- KWOTA:${bilans}; RUND:${gier_do_rozegrania}; MNOZNIK:${mnoznik_po_przegranej}; BET:${bet_poczatkowy}`);

function run() {
  // czy zakonczenie rundy?
  //
  var rand_number = readNum();
  if (rand_number != last_rand_number) {
    last_rand_number = rand_number;
    if (!wynik_odczytany) {
      wynik_odczytany = true;
      var win_color = readGameColor();
      updateColorStats(win_color);
      console.log("2a. Wynik rundy: ", win_color, color_starts);

      if (czy_obstawione) { // Sprawdz wynik
        czy_obstawione = false;
        var kwota_wygranej = 0;
        var kwota_obstawienia = bet_aktualny;
        if (win_color == obstawiony_color) {
          suma_wygranych++;
          licznik_wygranych++;
          licznik_przegranych = 0;
          kwota_wygranej = parseInt(kwota_obstawienia * ((win_color == "zero") ? 14 : 2));
          bet_aktualny = bet_poczatkowy;
        } else {
          suma_przegranych++;
          licznik_przegranych++;
          licznik_wygranych = 0;
          bet_aktualny = parseInt(bet_aktualny * mnoznik_po_przegranej);
        }
        setTimeout(function(){
          bilans = readBilans();
          var str = `2b. W:${kwota_wygranej}; Obstawiono:${kwota_obstawienia} na ${obstawiony_color}; `;
          str += `Bilans:${bilans}; Zysk:${bilans - bilans_poczatkowy}; `;
          str += `Gry: ${licznik_wygranych};${licznik_przegranych}; SUM: ${suma_wygranych};${suma_przegranych}`;
          console.log(str)
        }, 500);
      }
    }
  }

  //  czy nowa runda?
  // 
  var round_hash = readHash();
  if (round_hash != last_round_hash) {
    last_round_hash = round_hash;
    var round_time = getGameTime(time_start);
    time_start = performance.now();
    round_count++;
    wynik_odczytany = false;
    console.log(`1a. Nowa runda - ID:${readGameId()}; lp:${round_count}/${(gier_do_rozegrania - round_count)}; T:${round_time}`, new Date());

    // czy obstawic?
    if (round_count >= 1 && round_count <= gier_do_rozegrania) { // maksymalna ilosc rund
      if (color_starts.any == 5) { // seria koloru jest rowna 5
        czy_obstawione = true;
        obstawiony_color = color_starts.last_color;
        playRound(bet_aktualny, obstawiony_color);
        bilans = bilans - bet_aktualny;
        console.log(`1b. Obstawiam. kwota: ${bet_aktualny} na ${obstawiony_color}, bilans: ${bilans}, zysk: ${bilans - bilans_poczatkowy}`)
      }
    }
  }
}
// start game
if (!tm) {
  var tm
} else {
  clearInterval(tm)
};
clearInterval(tm);
tm = setInterval(run, 1000);
