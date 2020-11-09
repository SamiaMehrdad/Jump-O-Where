/******************************************************
 * * Jump-O-Where, a browser based solitaire game
 * * Created by: Mehrdad Samia 2020 GA-SEI project
 * Software implementation license: GPL 3.0
 * Original game designed by Mehrdad Samia, based
 * on ancient chinese peg solitaire puzzle, adopted
 * to 4x4 minimal game board and multi level playing.
 * --------------------------------------------------
 * Project files: index.html , jow.css , this file
 * Resources : ./img , ./audio 
 * * Repo:  https://github.com/SamiaMehrdad/Jump-O-Where
 * --------------------------------------------------
 * * MVC pattern following
*******************************************************/
/* 
* NOTE: 
 For this game addressing cells by row - column is less efficient
 so cell addressing is doing by single index 
*/

/*----- constants ---------------------------------------------------*/
const BOARDDIM = 4; // number of cells in each direction
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
                  };
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
  ["Hi buddy!",   "0001111111100110"],  //7
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
  ["The Last Rock","0111110111111111"]  //20
];

const SPRITRATIO = 33.33; // used as x offset step to render proper image for cells
/*----- app's state (variables) -------------------------------------*/
const game = {
  selectedCell: null,
  level: 0,
  started: false,
  status: null,
  paused: false,
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
const shadeEl = getElemById("shade");
const popupEl = getElemById("winLosePanel");
const popMsgEl = getElemById("popMsg");
const popLevNameEl = getElemById("popLevelName");
const popLevNumEl = getElemById("popLevelNum");
const helpPopEl = getElemById("helpPanel");
const btNextEl = getElemById("btNext");
const levelNameEl = getElemById("levelName");
const levelNumEl = getElemById("levelNum");
const sndGrab = new Audio('./audio/grab1.mp3');
const sndMove = new Audio('./audio/move1.mp3');
const sndRelease = new Audio('./audio/release1.mp3');
const sndOk = new Audio('./audio/ok1.mp3');
const sndFail = new Audio('./audio/fail1.mp3');
const sndWin = new Audio('./audio/win1.mp3');
const sndback = new Audio('./audio/background1.mp3');
const sndWoosh = new Audio('./audio/woosh1.mp3');

/* g is main graphics object including render() , createCells() and cached elements 
   Every graphical elements are cached inside g object, like g.cellEl[i] */

const g = { 
 
   cellEls : [], 
   boardEl : getElemById("innerBoard"),
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
  // rendering starting point of each level -------------------------
  renderLevelLables: () => {
    levelNameEl.innerText = LEVELS[game.level][0];
    levelNumEl.innerText = `Level ${game.level+1}`;
  } ,
  // main render function -------------------------------------------
  render : () => {
    for( let i = 0; i < TOTALCELLS; i++ ) // render pegs and landing cells
      g.cellEls[i].style.backgroundPositionX = `${SPRITRATIO * cells[i].hasPeg *2 + 
                                                  SPRITRATIO * cells[i].landing  }%`;
    //render selected peg, if there is any
    if(game.selectedCell != null ) //CAUTION about index 0
      g.cellEls[game.selectedCell].style.backgroundPositionX = `${SPRITRATIO * CELLSTATE.PICKED }%`;
    if( game.status !== GAMESTATUS.PLAYING )
      g.showPanel();
  } ,
  
  // show popup panels in case ---------------------------------------
  showPanel: () => {
    if( game.status == GAMESTATUS.PASSED )
    {
      popMsgEl.innerText = "PASSED";
      btNextEl.style.display = "inline-block";
    }
    if( game.status == GAMESTATUS.FAILED )
    {
      popMsgEl.innerText = "FAILED";
      btNextEl.style.display = "none";   
    }
    // popMsgEl.innerText = game.status === GAMESTATUS.PASSED ? "PASSED" : "FAILED";
    popLevNameEl.innerText = LEVELS[ game.level ][0];
    popLevNumEl.innerText = `Level ${game.level+1}`;
    shadeEl.style.display = "block";
    popupEl.classList.add("show");
  },

};


/*----- event listeners -----------------------------------------------------*/
/**-------------------------------
 *  initEvents() Just a wrapper to help code looks cleaner
 *  This function also is using setEvent() to looks more clean.
 *  * Return : none
 *-------------------------------*/
function initEvents()
{
  setEvent("helpLabel", "click", showHelp );
  setEvent("levelName", "mouseenter",showResetLevel);
  setEvent("levelName", "mouseleave",()=> g.renderLevelLables() );
  setEvent("levelName", "click",initLevel);
  setEvent("btAgain", "click",btAgainClicked);
  setEvent("btNext", "click",btNextClicked);
  setEvent("btClose", "click", btCloseHelpClicked );
}
/*----- functions -----------------------------------------------------------------*/ 
/**-------------------------------
 *  cellClicked() Will be run when a cell is clicked
 *  * event handler
 *  * return : none
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
    sndGrab.play();
  }
  // Now check if level is passed or failed 
  game.status = checkPass();
  if( game.status === GAMESTATUS.PLAYING )
    game.status = checkFail();
  g.render(); 
}

/**-------------------------------
 *  initialize() Will be called once in very beginning of app.
 *  This function will create cell objects 
 *  and initialize game states variables.
 *  * Level state variables will be initialized in initLevel function.
 *  * Return : none
 *-------------------------------*/
function initGame ()
{
  for( let i = 0; i< TOTALCELLS; i++ )
  {
    cells[i] = new cell( i );
    cells[i].hasPeg = parseInt(LEVELS[0][1][i]); //TEST: move it to level init
  }
  g.createCellsByImg(); ///test
  game.level = 0; /// TODO: read saved level from file
  initLevel();
  g.renderLevelLables(); // to render level number and name
  g.render();
}
/**-------------------------------
 *  initLevel() will be called when a level starts
 *  This function will initialize level states variables. 
 *  Return : none
 *-------------------------------*/
function initLevel()
{
  sndRelease.play();
  game.totalPegs = 0;
  for( let i = 0; i< TOTALCELLS; i++ )
  {
    let peg = parseInt(LEVELS[game.level][1][i]);
    cells[i].hasPeg = peg; 
    game.totalPegs += peg;
    cells[i].landing = null;
  }
  game.selectedCell = null;
  game.status = GAMESTATUS.PLAYING;
  game.started = false;
  g.renderLevelLables();
  g.render();
}

/**-------------------------------
 *  tryToMoveTo()
 *  Will be called every time user press 
 *  an empty cell and try to move a peg there.
 *  * return: none
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
        sndMove.play();
        //move peg from selected to dest
        cells[clickedCellIndex].hasPeg = true;
        cells[src].hasPeg = false;
        // remove target peg
        cells[TARGETPEGS[src][i]].hasPeg = false;
        game.totalPegs--;
        game.started = true;
        break;
      }
  }
  game.selectedCell = null ; // finally clear selection
}
/**-------------------------------
 *  setDestinations(cellIndex) 
 *  Set landing property of all cells which can
 *  be destination for given cell.
 *  * return: none
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
 *  checkPass() Check if level is passed
 * * return: GAMESTATUS.PLAYING or GAMESTATUS.PASSED
 *-------------------------------*/
function checkPass()
{
  if( game.totalPegs < 2 )
  {
    sndOk.play();
    return GAMESTATUS.PASSED;
  }
  return GAMESTATUS.PLAYING; 
}
/**-------------------------------
 *  checkFail() Check if level is failed
 * * return: GAMESTATUS.PLAYING or GAMESTATUS.FAILED
 *-------------------------------*/
function checkFail()
{
  for( let i = 0; i < TOTALCELLS; i++ )
   for( let j = 0; j < 2; j++ )
   {
    if ( cells[i].hasPeg && cells[TARGETPEGS[i][j]].hasPeg && !cells[POSSIBLEMOVES[i][j]].hasPeg )
        return GAMESTATUS.PLAYING;
   }
  sndFail.play(); 
  return GAMESTATUS.FAILED;
}

/**-------------------------------
 *  btAgainClicked() Will be called when 'try again' 
 *  button in a popup panel is clicked
 *  * event handler
 *  * return: none
 *-------------------------------*/
function btAgainClicked()
{
  sndRelease.play();
  initLevel();
  g.render();
  closePopup();
}

/**-------------------------------
 *  btNextClicked() Will be called when 'next' 
 *  button in a popup panel is clicked
 *  * event handler
 *  * return: none
 *-------------------------------*/
function btNextClicked()
{
  sndWin.play();
  if(game.level < LEVELS.length )
    game.level ++;
  initLevel();
  g.render();  
  closePopup();
}

/**-------------------------------
 *  showHelp() Shows help panel
 *  * return: none
 *-------------------------------*/
function showHelp()
{
  shadeEl.style.display = "block";
  helpPopEl.classList.add("show");
  game.paused = true;
  g.render();
  sndback.loop = "auto-loop";
  sndback.play();
}

/**-------------------------------
 *  btCloseHelpClicked()
 *  * event handler
 *  * return: none
 *-------------------------------*/
function btCloseHelpClicked()
{
  shadeEl.style.display = "none";
  helpPopEl.classList.remove("show");
  game.paused = false;
  sndback.pause();
  sndback.currentTime = 0;
  sndRelease.play();
}
/**-------------------------------
 *  closePopup() Close popup panel
 *  * return: none
 *-------------------------------*/
function closePopup()
{
  shadeEl.style.display = "none";
  popupEl.classList.remove("show");
}
/**-------------------------------
 *  showResetLevel() Shows reset label when mouse
 *  hovers on level name
 *  * event handler
 *  * return: none
 *-------------------------------*/
function showResetLevel()
{
  sndWoosh.play();
  levelNameEl.innerHTML = "Reset " + 
                            levelNameEl.innerText + 
                            "<x class='roundLbl'> \u21BA </x>";
}

/**-------------------------------
 *  getElemById(id) Make life a little easier.
 *  Show useful console log on errors
 *  *return: DOM element
 *-------------------------------*/
function getElemById(id)
{
  let result = document.getElementById(id);
  if( !result )
    console.log(` DEBUG WARNING! #${id} element is undefined.`);
  return result;
}

/**-------------------------------
 *  setEvent(id , type, funcName) Make life a little easier.
 *  Set event handler for given id.
 *  Show useful console log on errors
 *  *return: true if succeed
 *-------------------------------*/
function setEvent(id , type, funcName)
{
  let elem = document.getElementById(id);
  if( !elem )
  {
    console.log(` DEBUG WARNING! Eventlistener for #${id} is undefined.`);
    return false;
  }
    elem.addEventListener( type , funcName );
    return true;
}

//----------------------------------------- APP STARTING POINT -------------------------------------
initEvents(); // initialize event handlers
initGame();   // and initialize the game. event handlers will take care of rest of the app

///TODO: add motivation prompts
///TODO: check for js/css disabled
///TODO: disable right-click
///TODO: add time based color fading effect