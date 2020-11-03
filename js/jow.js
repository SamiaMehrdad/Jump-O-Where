/******************************************************
 * Jump-O-Where, a browser based solitaire game
 * Created by: Mehrdad Samia 2020 GA-SEI project
 * Software implementation license: GPL 3.0
 * Original game designed by Mehrdad Samia, based
 * on ancient chinese peg solitaire puzzle, adopted
 * to 4x4 minimal game board and multi level playing.
 * --------------------------------------------------
 * Project files: index.html , jow.css , this file
 * Resources : ./img , ./audio 
 * Repo:  https://github.com/SamiaMehrdad/Jump-O-Where
 * --------------------------------------------------
 * MVC pattern following
*******************************************************/
///NOTE: For this game addressing cells by row - column is less efficient
// so cell addressing is doing by single index

///TODO: Show win/lose popup
///TODO: Show help popup
///TODO: adding sounds
/*----- constants ---------------------------------------------------*/
const BOARDDIM = 4; // number of 
const TOTALCELLS = BOARDDIM * BOARDDIM;
 // Possible state of each single cell
const CELLSTATE = {
                    EMPTY: 0,
                    HILIGHT: 1, // it is potential move destination
                    PEG:  2, // it has peg 
                    PICKED: 3, // it has peg and is picked to move
                  };
const GAMESTATUS = {
                    PLAYING: 0,
                    PASSED: 1,
                    FAILED: 2,
                    PAUSED: 3,
                    FINISHED: 4, //all levels are passed
}
// Two possible move for each cell${i}
const POSSIBLEMOVES = [ [2,8], [3,9], [0,10], [1,11],
                        [6,12], [7,13], [4,14], [5,15],
                        [0,10], [1,11], [2,8], [3,9],
                        [4,14], [5,15], [6,12], [7,13]
                      ];
// Two possible target peg cell for each cell${i}
const TARGETPEGS = [    [1,4], [2,5], [1,6], [2,7],
                        [5,8], [6,9], [5,10], [6,11],
                        [4,9], [5,10], [6,9], [7,10],
                        [8,13], [9,14], [10,13], [11,14]
                      ];           
const LEVELS = [  // 20 levels name and init patterns
  ["Introducer",  "0000011001100000"],  //1
  ["Tiny boat",   "0011000110101100"],  //2
  ["North wall",  "1111111100000000"],  //3
  ["Windmill",    "0100011111100010"],  //4
  ["Prisoner",    "1111101110011111"],  //5
  ["Sumo",        "0110111101100110"],  //6
  ["Hi buddy!",    "0001111111100110"],  //7
  ["Light bulb",  "1111100101100110"],  //8
  ["Old phone",   "1111011010011111"],  //9
  ["Mad gorilla", "1001111101101001"],  //10
  ["The river",   "0010011111100100"],  //11
  ["Symmetry",    "1100011111100011"],  //12
  ["Bulldog",     "0110011010011001"],  //13
  ["Entropy",     "1101011010110110"],  //14
  ["Deepness",    "1011101110111111"],  //15
  ["Cross",       "0110111111110110"],  //16
  ["Boomerang",   "1110111100110011"],  //17
  ["Scorpion",    "0101011100101110"],  //18
  ["Basket",      "0110100111111111"],  //19
  ["The Last Rock","0111110111111111"]   //20
];

const SPRITRATIO = 33.33; // used for rendering proper image of cells
/*----- app's state (variables) -------------------------------------*/
let game = 
{
  selectedCell: null,
  level: 0,
  status: null,
  totalPegs: 16,
  tries: 0,
  time: 0,
};
// Defining main object prototype called cell
class cell  {
  constructor(index) {
    this.index = index;
    this.hasPeg = false;
    this.landing = false;
  }
}

let cells = []; // this array will keep TOTALCELLS of cell object

/*----- cached element references -----------------------------------*/
// g is main graphics object including render() , createCells() and cached elements 
// Every graphical elements are cached inside g object, like g.cellEl[i]

const g = { 
 
   cellEls : [], 
   boardEl :  document.getElementById("innerBoard"),
   levelNameEl : document.getElementById("levelName"),
   levelNumEl : document.getElementById("levelNum"),
   cellBuffer: { },
  // create cell elements method A based on images------------------
  createCellsByImg : () => {
    for( let i = 0; i < BOARDDIM; i++ )
      for( let j = 0; j < BOARDDIM; j++ )
      {
        let index = i * BOARDDIM  + j;
        g.cellEls[index] = document.createElement("div");
        g.cellEls[index].setAttribute("id" , 'c'+index);
        g.cellEls[index].setAttribute("class" , "cellImg");
        g.cellEls[index].addEventListener("click", cellClicked);
        ///TEST console.log(index);
        g.boardEl.appendChild( g.cellEls[index] );
      }    
  } ,
  // create cell elements method B based on elements-----------------
  createCellsByDiv : () => {
    for( let i = 0; i < BOARDDIM; i++ )
      for( let j = 0; j < BOARDDIM; j++ )
      {
        console.log('.');
      }
    
  } ,
  // rendering starting point of each level
  initLevel: () => {
    g.levelNameEl.innerText = LEVELS[game.level][0];
    g.levelNumEl.innerText = `Level ${game.level+1}`;
  } ,
  // main render function -------------------------------------------
  render : () => {
     console.log('Render fired.');
    
    for( let i = 0; i < TOTALCELLS; i++ ) // render pegs and landing cells
    {
      g.cellEls[i].style.backgroundPositionX = `${SPRITRATIO * cells[i].hasPeg *2 + 
                                                  SPRITRATIO * cells[i].landing  }%`;
      
    }
    if(game.selectedCell != null ) //CAUTION about index 0
      g.cellEls[game.selectedCell].style.backgroundPositionX = `${SPRITRATIO * CELLSTATE.PICKED }%`;
  } ,

  showPanel: () => {
    if( game.status === GAMESTATUS.PASSED )
      alert (" LEVEL PASSED ");
    if( game.status === GAMESTATUS.FAILED )
      alert (" LEVEL FAILED ");  
  },

};


/*----- event listeners -------------------------------------------*/
document.getElementById("help").addEventListener("click",showHelp);

/**-------------------------------
 *  cellClicked() will be run when a cell is clicked
 *  This function is an event handler
 *  Return : none
 *-------------------------------*/
function cellClicked(e)
{
  let cellIndex = parseInt(e.target.id.substring(1));
  // first clear all landing cells
  cells.forEach( (cell)=>cell.landing = false );
  if( ! cells[ cellIndex ].hasPeg ) // if clicked cell is empty, it may be a destination point
      tryToMoveTo( cellIndex );
  else  // there is peg in clicked cell, o it should be elected 
  {
    game.selectedCell = cellIndex;
    setDestinations( cellIndex );
    console.log("Select cell"+cellIndex );
  }
  g.render();
  game.status = checkPass();
  console.log(game.status);
  if( game.status === GAMESTATUS.PLAYING )
    game.status = checkFail();
  console.log(game.status);
  if( game.status !== GAMESTATUS.PLAYING ) 
    g.showPanel();
  //g.cellEls[clickedCellIndex].style.backgroundPositionX = `${SPRITRATIO * CELLSTATE.HILIGHT}%`; ///TEST
  // console.log(`${ratio}%`);
}

 
/*----- functions -------------------------------------------------*/ 
/**-------------------------------
 *  initialize() will be called once in very beginning of app
 *  This function will create cell objects 
 *  and initialize game states variables. Level state variables
 *  will be initialized in initLevel function
 *  Return : none
 *-------------------------------*/
function initGame ()
{
  for( let i = 0; i< TOTALCELLS; i++ )
  {
    cells[i] = new cell( i );
    cells[i].hasPeg = parseInt(LEVELS[0][1][i]); //TEST: move it to level init
  }
  console.log(cells);
  g.createCellsByImg(); ///test
  game.level = 19; /// TODO: read saved level from file
  initLevel();
  g.initLevel(); // to render level number and name
  g.render();
}
/**-------------------------------
 *  initLevel() will be called when a level starts
 *  This function will initialize level states variables. 
 *  Return : none
 *-------------------------------*/
function initLevel()
{
  game.totalPegs = 0;
  for( let i = 0; i< TOTALCELLS; i++ )
  {
    let peg = parseInt(LEVELS[game.level][1][i])
    cells[i].hasPeg = peg; 
    game.totalPegs += peg;
  }
  game.status = GAMESTATUS.PLAYING;
  console.log(game);
}

/**-------------------------------
 *  tryToMoveTo
 *  this function will be called when clickedCellIndex IS EMPTY
 *-------------------------------*/
function tryToMoveTo( clickedCellIndex )
{
  if( game.selectedCell != null ) // if there is a selected peg check to move it if it's possible
  {                               //CAUTION: using !game.selectedCell will disable cell0
    let src = game.selectedCell;
    for(let i =0; i < 2; i++ ) // try possibility for both direction
    // check if clicked cell is a possible move for selected peg and there is a target peg between
      if( POSSIBLEMOVES[src][i] === clickedCellIndex && cells[TARGETPEGS[src][i]].hasPeg )
      { 
        console.log("try to move " + i);
        //move peg from selected to dest
        cells[clickedCellIndex].hasPeg = true;
        cells[src].hasPeg = false;
        // remove target peg
        cells[TARGETPEGS[src][i]].hasPeg = false;
        game.totalPegs--;
        break;
      }
  }
  game.selectedCell = null ; // finally clear selection
}
/**-------------------------------
 *  setDestinations(cellIndex) 
 *  This function set landing property of cells if they can
 *  be destination for selected cell
 *-------------------------------*/
function setDestinations( cellIndex )
{
  for(let i = 0; i < 2; i++ )
    {
      let destCell = cells[ POSSIBLEMOVES [ cellIndex ][i] ];
      let targetCell = cells[ TARGETPEGS [ cellIndex ][i] ];
      if( ! destCell.hasPeg && targetCell.hasPeg )
        destCell.landing = true;
    }
}
/**-------------------------------
 *  checkPass
 * 
 *-------------------------------*/
function checkPass()
{
  if( game.totalPegs < 2 )
   return GAMESTATUS.PASSED;
  return GAMESTATUS.PLAYING; 
}
/**-------------------------------
 *  checkFail
 * 
 *-------------------------------*/
function checkFail()
{
  for( let i = 0; i < TOTALCELLS; i++ )
   for( let j = 0; j < 2; j++ )
   {
   //  console.log(`${i}: pig = ${cells[i].hasPeg}, target = ${cells[TARGETPEGS[i][j]].hasPeg}, dest = ${cells[POSSIBLEMOVES[i][j]].hasPeg}`);
    if ( cells[i].hasPeg && cells[TARGETPEGS[i][j]].hasPeg && !cells[POSSIBLEMOVES[i][j]].hasPeg )
        return GAMESTATUS.PLAYING;
   }
  return GAMESTATUS.FAILED;
}

/**-------------------------------
 *  showHelp
 * 
 *-------------------------------*/
function showHelp()
{
  g.render();
    // document.getElementById("shade").style.display = "inline-block";
    // document.getElementById("popup").style.display = "block";
    // document.getElementById("shade").style.opacity = "none";
}



initGame();