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
const BOARDDIM = 4;
const CELLSTATE = 
{
  EMPTY: 0,
  HILIGHT: 1,
  PEG:  2,
  PICKED: 3,
};
const SPRITRATIO = "33.33%";

let game = 
{
  level: 0,

};

// let cellEls = [];
// let boardEl =  document.getElementById("innerBoard");
const g = { 

  
   cellEls : [], 
   boardEl :  document.getElementById("innerBoard"),
  // create cell elements method A based on images
  createCellsByImg : () => {
    for( let i = 0; i < BOARDDIM; i++ )
      for( let j = 0; j < BOARDDIM; j++ )
      {
        
        let index = i * BOARDDIM  + j;
        g.cellEls[index] = document.createElement("div");
        // g.cellEls[index].setAttribute("id" , `c${i}r${j}`);
        g.cellEls[index].setAttribute("id" , 'c'+index);
        g.cellEls[index].setAttribute("class" , "cellImg");
        g.cellEls[index].addEventListener("click", cellClicked);
        console.log(index);
        g.boardEl.appendChild( g.cellEls[index] );
      }    
  } ,
  // create cell elements method B based on elements
  createCellsByDiv : () => {
    for( let i = 0; i < BOARDDIM; i++ )
      for( let j = 0; j < BOARDDIM; j++ )
      {
        console.log('.');
      }
    
  } ,
  // main render function -------------------------------------------
  render : () => {
    console.log('Render fired.');
  } ,

};

function cellClicked(e)
{
  console.log(e.target.id+ ":"+typeof e.target.id+ " clicked.");
}

document.getElementById("help").addEventListener("click",showHelp);

function showHelp()
{
  g.render();
    // document.getElementById("shade").style.display = "inline-block";
    // document.getElementById("popup").style.display = "block";
    // document.getElementById("shade").style.opacity = "none";
}
 
g.createCellsByImg();