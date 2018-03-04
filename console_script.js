var bilans = 7757, round_count = 0, max_round = 1000, bet_price = 10, curr_bet = bet_price, mnoznik = 1.7, czy_grac = false, czy_obstawione = false;

var last_round_hash = document.getElementById('roundHash').innerHTML;
var last_rand_num = document.getElementById('randNum').innerHTML;
var t0 = performance.now();

var bilans_part1 = parseInt(document.querySelector('.coins-component.middle-block').innerHTML);
var bilans_part2 = parseInt(document.querySelector('.coins-component.middle-block .part').innerHTML);
var bilans_start = parseInt("" + bilans_part1 + bilans_part2);

bilans = bilans_start;

console.log("START --- ", "BILANS:", bilans, ",RUND: ", max_round,",MNOZ:", mnoznik, ",BET:",bet_price)

function run(){
 var curr_rand_num = document.getElementById('randNum').innerHTML;
 if(curr_rand_num != last_rand_num){ 
  last_rand_num = curr_rand_num;
  if(czy_obstawione){
      czy_obstawione = false;
      var round_elem = document.querySelector('.bonus-game-state.back.bonus-game-end'); 
      var win_color = null;
      if(round_elem.classList.contains('red')){ win_color = "red"; }
      if(round_elem.classList.contains('black')){ win_color = "black"; }
      if(round_elem.classList.contains('zero')){ win_color = "green"; }
      var is_win = win_color == "red";

      if(is_win){
        var kwota_wygranej = parseInt(curr_bet * 2);
		curr_bet = bet_price;
      }else{
        var kwota_wygranej = 0;
        curr_bet = parseInt(curr_bet * mnoznik);
      }

      bilans = bilans + kwota_wygranej; 
      console.log("Wynik rundy-KOL: ", win_color, ", KW: ", kwota_wygranej,
      ", BIL: ", bilans, ", BET: ", curr_bet, ", ZYSK: ", bilans_start - bilans)
  }
 }

 var curr_round_hash = document.getElementById('roundHash').innerHTML;
 if(curr_round_hash != last_round_hash){
  last_round_hash = curr_round_hash;
  var t1 = performance.now(); var time = (t1 - t0); t0 = performance.now();
  var game_id = document.querySelector('.bonus-game-info .value').innerHTML;
  console.log("Nowa runda -- ID: ", game_id, ", LP:", round_count, ", MAX:", (max_round - round_count),
    ",T:", parseInt(time / 1000) + "s - ", new Date());
  
  round_count++; 
  czy_grac = round_count >= 1 && round_count <= max_round;

  if(czy_grac){
      czy_obstawione = true; 
      bilans = bilans - curr_bet;

        document.querySelector('.button.clear').click();
        var el = document.querySelector('.bonus-game-bet-input');
        var cp = el.selectionStart;
        el.value = curr_bet;
        el.dispatchEvent(new Event('change'));
        el.selectionStart = cp;
        el.selectionEnd = cp;

        document.querySelector('.bonus-game-calc-place-bet').click();
      console.log("Obstawiam za kwote: ", curr_bet, ", bilans : ", bilans)
  }
 }else{ console.log('czekam...'); }
}
var tm; 
clearInterval(tm); 
tm = setInterval(run, 1000);
