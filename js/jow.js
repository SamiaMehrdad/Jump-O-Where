/*
technic: 
-----------
const SPRITE_WIDTH = -11.25;
 elm.style.backgroundPositionX = `${wrongLetters.length * SPRITE_WIDTH}vmin`;
 in css:
 #elm {
  width: 11.25vmin;
  height: 30vmin;
  background-size: cover;
  background-image: url(../imgs/hangman.png);
}
*/

document.getElementById("help").addEventListener("click",showHelp);

function showHelp()
{
    alert("THIS IS HELP!");
}
