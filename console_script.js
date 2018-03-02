var bilans = 1000, round_count = 0, bet_price = 10, curr_bet = bet_price, mnoznik = 1.7, czy_grac = false, czy_obstawione = false;

var last_round_hash = document.getElementById('roundHash').innerHTML;
var last_rand_num = document.getElementById('randNum').innerHTML;
var t0 = performance.now();

function run(){
 var curr_rand_num = document.getElementById('randNum').innerHTML;
 if(curr_rand_num != last_rand_num){ 
  last_rand_num = curr_rand_num;
  if(czy_obstawione){
      czy_obstawione = false;
      var round_elem = document.querySelector('.bonus-game-state.back.bonus-game-end'); 
      var win_color = null;
      if(round_elem.classList.contains('red')){ win_color = "red"; }
      if(round_elem.classList.contains('green')){ win_color = "green"; }
      if(round_elem.classList.contains('black')){ win_color = "black"; }
      var is_win = win_color == "red";

      if(is_win){
        var kwota_wygranej = curr_bet * 2;
		curr_bet = bet_price;
      }else{
        var kwota_wygranej = 0;
        curr_bet = curr_bet * mnoznik;
      }

      bilans = bilans + kwota_wygranej; 
      console.log("Wynik rundy. Wygrana: ", kwota_wygranej,", bilans: ", bilans, curr_bet)
  }
 }

 var curr_round_hash = document.getElementById('roundHash').innerHTML;
 if(curr_round_hash != last_round_hash){
  last_round_hash = curr_round_hash;
  var t1 = performance.now(); var time = (t1 - t0); t0 = performance.now();
  console.log("Nowa runda -- ", round_count, curr_round_hash.slice(0, 10), parseInt(time / 1000) + "s");
  
  round_count++; 
  czy_grac = round_count >= 1 && round_count <= 10;

  if(czy_grac){
      czy_obstawione = true; bilans = bilans - curr_bet;
      console.log("Obstawiam za kwote: ", curr_bet, ", bilans : ", bilans)
  }
 }else{ console.log('czekam...'); }
}
var tm; clearInterval(tm); tm = setInterval(run, 1000);
