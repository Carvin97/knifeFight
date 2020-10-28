function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function coordinatesExists(listOfCoordinates, newCoordinates) {
    for(let i = 0; i < listOfCoordinates.length; i++) {
        if(listOfCoordinates[i].row == newCoordinates.row && 
            listOfCoordinates[i].col == newCoordinates.col) {
            return true; 
        }
    }

    return false; 
}

function getOffset(element) {
    let top = 0, left = 0;

    do {
        top += element.offsetTop;
        left += element.offsetLeft;
    } while (element = element.offsetParent);

    return { 
        top: top,
        left: left
    };
}

function placeInBox(itemToPlace, box) {
    let posTop = (box.offsetHeight - itemToPlace.offsetHeight) / 2,
    posLeft = (box.offsetWidth - itemToPlace.offsetWidth) / 2;

    posTop += getOffset(box).top;
    posLeft += getOffset(box).left;

    itemToPlace.style.top = posTop + 'px';
    itemToPlace.style.left = posLeft + 'px';
}

function addItem(tab, attr, value) {
    if(!tab[attr]) {
        tab[attr] = [];
    }

    tab[attr].push(value);
}

function getCurrentGripCoordinate(currentCoordinates, cell) {
    let currentGripCoordinate = {
        row: currentCoordinates.row + cell.row,
        col: currentCoordinates.col + cell.col  
    };
    
    return currentGripCoordinate; 
}

function createPerimeter(perimeter) {
    let listOfCoordinates = []
    const ray = Math.round(perimeter / 2);

    for(let row = (ray * -1); row <= ray; row++) {
        for(let col = (ray * -1); col <= ray; col++) {
            let coordinates = {row: row, col: col};

            listOfCoordinates.push(coordinates);
        }
    }

    return listOfCoordinates;
}


// KnifeFight --------------------------------------------------------


function KnifeFight(config = {nbrObstacles: 15}) {
    this.config = config;

    this.map = new KnifeFightMap();

    this.obstaclesClasses = ['bush-one', 'bush-two', 'bush-three', 'bush-four'];
    this.obstacles = [];

    this.weapons = [
        new Weapon('kitchen-knife'),
        new Weapon('kitchen-knife'),
        new Weapon('combat-knife'),
        new Weapon('dagger'),
        new Weapon('sword', [{row: 0, col: -1}, {row: 0, col: 0}, {row: 0, col: 1}]),
        new Weapon('trilance', [{row: 0, col: -1}, {row: 0, col: 0}, {row: 0, col: 1}])
    ];
    
    this.players = [
        new Player('player-one', [{row: 0, col: 0}], {'players': createPerimeter(8)}),
        new Player('player-two', [{row: 0, col: 0}], {'players': createPerimeter(8)}),
    ];

    this.indexPlayer = getRandomInt(this.players.length);

    this.placeItems();
}

KnifeFight.prototype.placeItems = function() {
    const obstaclesClasses = this.obstaclesClasses;

    let weapons = this.weapons,
        players = this.players;
    
    //Placement des obstacles 
    for(let i = 0; i < this.config.nbrObstacles; i++) {
        let indexObstacleClasse = getRandomInt(obstaclesClasses.length),
            obstacleClasse = obstaclesClasses[indexObstacleClasse];
        
        let obstacle = new Obstacle(obstacleClasse);
        this.obstacles.push(obstacle);
        
        this.map.placeAnItem(obstacle);
    }

    //Placement des armes
    for(let i = 0; i < weapons.length; i++) {
        let weapon = weapons[i];
        
        this.map.placeAnItem(weapon);
    }

    //Placement des joueurs
    for(let i = 0; i < players.length; i++) {
        let player = players[i];
        
        this.map.placeAnItem(player);
    }
};

KnifeFight.prototype.skipTurn = function() {
    let player = this.players[this.indexPlayer];
    player.skipTurn();

    this.indexPlayer++;
    
    if(this.indexPlayer ==  this.players.length) {
        this.indexPlayer = 0;
    }

    player = this.players[this.indexPlayer];
    player.takeTurn();
};

KnifeFight.prototype.startGame = function() {
    const player = this.players[this.indexPlayer];
    player.takeTurn();
};

// KnifeFightMap --------------------------------------------


function KnifeFightMap() {
    this.rootElt = document.getElementById('knifeFight-map');
    
    this.size  = { row: 10, col: 10 };
    this.listOfItem = [];
}

KnifeFightMap.prototype.placeAnItem = function(item) {
    let pos = this.findNewCoordinates(item),
        cellElt = this.selectCell(pos);
    
    item.setCurrentCoordinates(pos);
    cellElt.appendChild(item.elt);
    placeInBox(item.elt, cellElt);

    this.addItem(item);
};

KnifeFightMap.prototype.addItem = function(item) {
    addItem(this.listOfItem, item.type, item);
    addItem(this.listOfItem, 'all', item);
};

KnifeFightMap.prototype.selectCell = function(pos) {
    let rowElt = this.rootElt.getElementsByTagName('tr')[pos.row];
    return rowElt.getElementsByTagName('td')[pos.col];
};

KnifeFightMap.prototype.findNewCoordinates = function(item) {
    let impossibleCoordinates = this.getImpossibleCoordinates(item.grip, item.perimeterList),
        newCoordinates = {};

    do { 
        newCoordinates.row = getRandomInt(this.size.row);
        newCoordinates.col = getRandomInt(this.size.col);
    } while (coordinatesExists(impossibleCoordinates, newCoordinates))

    return newCoordinates;
};

KnifeFightMap.prototype.coordinatesOccupied = function(coordinates, targetObjet = 'all') {
    if(this.listOfItem[targetObjet]) {
        for(let i = 0; i < this.listOfItem[targetObjet].length; i++) {
            let item = this.listOfItem[targetObjet][i];

            if(coordinatesExists(item.currentCoordinates, coordinates)) {
                return true;
            }
        }
    }

    return false;
};

KnifeFightMap.prototype.getImpossibleCoordinates = function(grip, perimeterList) {
    let listOfImpossibleCoordinates = [];
    
    for(let row = 0; row < this.size.row; row++) {
        for(let col = 0; col < this.size.col; col++) {
            let currentCoordinates = {row: row, col: col};

            for(let i = 0; i < grip.length; i++) {
                let currentGripCoordinate = getCurrentGripCoordinate(currentCoordinates, grip[i]),
                    coordinatesOccupied = this.coordinatesOccupied(currentGripCoordinate); 
                
                if(coordinatesOccupied || currentGripCoordinate.row >= 10 || currentGripCoordinate.col >= 10 || currentGripCoordinate.row < 0 || currentGripCoordinate.col < 0) {
                    listOfImpossibleCoordinates.push(currentCoordinates); 
                }
            }

            for(const targetObject in perimeterList) {
                let perimeter = perimeterList[targetObject];

                for(let i = 0; i < perimeter.length; i++) {
                    let currentPerimeterCoordinate = getCurrentGripCoordinate(currentCoordinates, perimeter[i]),
                    coordinatesOccupied = this.coordinatesOccupied(currentPerimeterCoordinate, targetObject);

                    if(coordinatesOccupied) {
                        listOfImpossibleCoordinates.push(currentCoordinates);
                    }
                }
            }
        }
    }

    return listOfImpossibleCoordinates;
};


// Item --------------------------------------------------------


function Item(type, classe, grip, perimeterList) {
    if (this.constructor === Item) {
        throw new TypeError('Abstract class "AbstractConfig" cannot be instantiated directly');
    }
    
    this.type = type;
    this.classe = classe;
    this.grip = grip;
    this.perimeterList = perimeterList;
    
    this.currentCoordinates = [];
    this.elt = this.createElement();
}

Item.prototype.createElement = function() {
    let itemElt = document.createElement('div');
    itemElt.classList.add('icon-'+ this.type);
    itemElt.classList.add(this.classe);

    return itemElt;
};

Item.prototype.setCurrentCoordinates = function(coordinates) {
    for(let i = 0; i < this.grip.length; i++) {
        let currentGripCoordinate = getCurrentGripCoordinate(coordinates, this.grip[i]);
        this.currentCoordinates.push(currentGripCoordinate);
    }
};


// Obstacle --------------------------------------------------------------


function Obstacle(classe, grip = [{row: 0, col: 0}], perimeterList = {}) {
    Item.call(this, 'obstacles', classe, grip, perimeterList);
}

Obstacle.prototype = Object.create(Item.prototype, {
    constructor: {
        value: Obstacle,
        enumerable: false,
        writable: true,
        configurable: true
    }
});


// Weapon ---------------------------------------------------------------------


function Weapon(classe, grip = [{row: 0, col: 0}], perimeterList = {}) {
    Item.call(this, 'weapons', classe, grip, perimeterList);
};

Weapon.prototype = Object.create(Item.prototype, {
    constructor: {
        value: Weapon,
        enumerable: false,
        writable: true,
        configurable: true
    }
});


// Player -----------------------------------------------------------------------


function Player(classe, grip = [{row: 0, col: 0}], perimeterList = {}) {
    Item.call(this, 'players', classe, grip, perimeterList);
};

Player.prototype = Object.create(Item.prototype, {
    constructor: {
        value: Player,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

Player.prototype.takeTurn = function() {
  
};

Player.prototype.skipTurn = function() {

};