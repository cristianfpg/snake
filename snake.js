var puntajesVal = {};

function initSnake(containerId, rowsCount, colsCount) {
    var board = new Board(containerId, rowsCount, colsCount);
    var speed = 230;
    board.render();
    board.startButton().addEventListener("click", function () {
        board.hidePreview();
        var snake = new Snake(board, speed, new Cell(2, 2, "right"));
        snake.start();
    });
}

function Board(containerId, rowsCount, colsCount) {
    this.containerId = containerId;
    this.rowsCount = rowsCount;
    this.colsCount = colsCount;

    this.render = function () {
        var html = "<div class='snake-board'><table>";
        for (var i = 0; i < this.rowsCount; i++) {
            html += "<tr id='row-" + i + "' class='row'>";
            for (var j = 0; j < this.colsCount; j++) {
                html += "<td id='" + cellId(i, j) + "' class='col'></td>";
            }
            html += "</tr>"
        }

        html += "</table><div class='preview'></div><div class='score'><p class='mensaje'></p><p>Su puntaje fue: </p><p class='score-value'></p></div><button type='button'>Inicio</button><div class='puntajes'></div></div>";
        document.getElementById(containerId).innerHTML = html;
    };

    this.hidePreview = function () {
        var container = document.getElementById(containerId);
        container.getElementsByClassName("preview")[0].style.display = "none";
        container.getElementsByTagName("button")[0].style.display = "none";
        container.querySelector(".score").style.display = "none";
        container.querySelector(".puntajes").style.display = "none";
    };

    this.startButton = function () {
        return document.getElementById(this.containerId).getElementsByTagName("button")[0];
    };

    this.setScoreValue = function (value) {
        document.getElementById(containerId).querySelector(".score-value").innerHTML = value;
    };

    this.showResults = function () {
        var container = document.getElementById(containerId);
        var cells = container.getElementsByTagName("td");
        var puntajeFinal = document.getElementById('actual-score').innerText;
        var puntajesDivs = '';
        var mensaje = '';

        function getKeyByValue(object, value) {
            return Object.keys(object).find(key => object[key] === value);
        }
        
        var puntajesOrden = Object.values(puntajesVal).sort(function(a,b){
            return b-a;
        });
        
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            removeClass(cell, "fruit");
            removeClass(cell, "snake");
        }

        var ultimoKey = Object.values(puntajesOrden)[Object.keys(puntajesVal).length-1];
        var keyDiez = Object.values(puntajesOrden)[9];

        // var ultimoVal = getKeyByValue(puntajesVal, Object.values(puntajesOrden)[Object.keys(puntajesVal).length-1]);

        console.log(keyDiez);

        if((keyDiez && keyDiez < puntajeFinal) || ultimoKey < puntajeFinal){
            mensaje = "Buena la rata!";
            container.querySelector(".mensaje").classList.add('positivo');

            var neim = prompt("Buena la rata! Cuál es su neim?", "");

            firebase.database().ref('puntajes').update({
                [neim]: puntajeFinal
                }).then(function() {
                    actualizarPuntajes();
            });
        }else{
            mensaje = "Perdió por loca";
            container.querySelector(".mensaje").classList.remove('positivo');
        }

        container.getElementsByClassName("preview")[0].style.display = "block";
        container.getElementsByTagName("button")[0].style.display = "block";
        container.querySelector(".score").style.display = "block";
        container.querySelector(".puntajes").style.display = "block";
        container.querySelector(".mensaje").innerText = mensaje;
        
        for(var j = 0; j<10;j++){
            var getVal = getKeyByValue(puntajesVal, Object.values(puntajesOrden)[j]);
            if(!getVal) continue;
            puntajesDivs += "<div>";
            puntajesDivs += "<span class='posicion'>"+(j+1)+". </span><span class='nombre'>"+getVal+"</span><span class='puntaje'> - "+puntajesOrden[j]+"</span>";
            puntajesDivs += "</div>"; 
        }

        container.querySelector(".puntajes").innerHTML = puntajesDivs;
    }
}

function Snake(board, speed, head) {
    this.head = head;
    this.tail = head;
    this.cells = [head];
    this.board = board;
    this.speed = speed;
    this.level = "";

    var $snake = this;
    this.start = function () {
        var _this = this;
        document.getElementById('actual-score').innerText = 1;
        addClass(document.getElementById(cellId(head.row, head.col)), "snake");

        addFruitToBoard(board, this);
        addKeyboardListener(this);
        addSwipeListener(this);

        var intervalId = function () {
            var newCells = [];

            var headMovingResult = moveHead();
            if (!headMovingResult) {
                // clearInterval(intervalo);
                $snake.board.setScoreValue($snake.cells.length);
                $snake.board.showResults();
                return;
            }
            newCells.push(headMovingResult.newHead);

            if ($snake.cells.length > 1) {
                newCells.push.apply(newCells, moveCellsAfterHead($snake));
            }

            $snake.head = newCells[0];
            $snake.tail = newCells[newCells.length - 1];
            $snake.cells = newCells;
            if (headMovingResult.fruit) {
                $snake.grow();
                addFruitToBoard($snake.board, $snake);
            }

            setTimeout(intervalId,_this.speed);
        };

        setTimeout(intervalId,_this.speed);

        function moveHead() {
            var newHead = $snake.head.next();
            var nextHeadElement = document.getElementById(cellId(newHead.row, newHead.col));
            if (!nextHeadElement || nextHeadElement.classList.contains("snake")) {
                return null;
            }

            var fruit = nextHeadElement.classList.contains("fruit");
            if (fruit) {
                removeClass(nextHeadElement, "fruit");
            }

            removeClass(document.getElementById(cellId($snake.head.row, $snake.head.col)), "snake");
            addClass(nextHeadElement, "snake");
            return {newHead: newHead, fruit: fruit};
        }

        function moveCellsAfterHead($snake) {
            var newCells = [];
            for (var i = 1; i < $snake.cells.length; i++) {
                var currentCell = $snake.cells[i];
                removeClass(document.getElementById(cellId(currentCell.row, currentCell.col)), "snake");

                var nextCell = $snake.cells[i - 1];
                addClass(document.getElementById(cellId(nextCell.row, nextCell.col)), "snake");

                newCells.push(nextCell);
            }
            return newCells;
        }
    };

    this.setHeadDirection = function (keywordDirection) {
        this.head.direction = keywordDirection;
        this.cells[0].direction = keywordDirection;
    };

    this.grow = function () {
        var newTail = this.tail.prev();
        this.cells.push(newTail);
        this.tail = newTail;
        document.getElementById('actual-score').innerText = this.cells.length;

        var longitudCulebra = this.cells.length;

        if(longitudCulebra >=3 && longitudCulebra < 7){
            this.speed = 200;
            this.level = " dos";
        }else if(longitudCulebra >=7 && longitudCulebra < 13){
            this.speed = 170;
        }else if(longitudCulebra >=13 && longitudCulebra < 20){
            this.speed = 140;
        }else if(longitudCulebra >=20 && longitudCulebra < 30){
            this.speed = 110;
        }else if(longitudCulebra >=30){
            this.speed = 80;
        }
    };

    this.containsCell = function (row, col) {
        for (var i = 0; i < this.cells.length; i++) {
            var cell = this.cells[i];
            if (cell.row === row && cell.col === col) {
                return true;
            }
        }
        return false;
    };
}

function addFruitToBoard(board, snake) {
    do {
        var row = Math.floor(Math.random() * board.rowsCount);
        var col = Math.floor(Math.random() * board.colsCount);
    } while (snake.containsCell(row, col));
    addClass(document.getElementById(cellId(row, col)), "fruit");
}

function addKeyboardListener(snake) {
    document.addEventListener("keydown", function (event) {
        event.preventDefault();
        var keywordDirection = direction(event.which);
        if (keywordDirection && isAllowedDirection(snake.head.direction, keywordDirection)) {
            snake.setHeadDirection(keywordDirection);
        }
    });
}

function addSwipeListener(snake) {
    var board = document.getElementsByClassName("snake-board")[0];
    var hammer = new Hammer(board);
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    hammer.on('swipe', function(event, arg1, arg2) {
      event.preventDefault();
      var keywordDirection = direction(event.direction);
      if (keywordDirection && isAllowedDirection(snake.head.direction, keywordDirection)) {
        snake.setHeadDirection(keywordDirection);
      }
    });
}

function isAllowedDirection(direction, keywordDirection) {
    return direction !== keywordDirection && !(direction === "right" && keywordDirection === "left") && !(direction === "left" && keywordDirection === "right") && !(direction === "up" && keywordDirection === "down") && !(direction === "down" && keywordDirection === "up");
}

function direction(keyCode) {
    // this.keyCodeToDirection = {2: "left", 4: "right", 8: "up", 16: "down", 37: "left", 38: "up", 39: "right", 40: "down"};
    this.keyCodeToDirection = 
        {
            38: "up", 
            87: "up", 
            40: "down",
            83: "down", 
            37: "left",
            65: "left", 
            39: "right", 
            68: "right", 
        };
    return this.keyCodeToDirection[keyCode];
}

function Cell(row, col, direction) {
    this.row = row;
    this.col = col;
    this.direction = direction;

    this.next = function () {
        switch (this.direction) {
            case "up":
                return new Cell(this.row - 1, this.col, this.direction);
            case "down":
                return new Cell(this.row + 1, this.col, this.direction);
            case "left":
                return new Cell(this.row, this.col - 1, this.direction);
            case "right":
                return new Cell(this.row, this.col + 1, this.direction);
        }
    };

    this.prev = function () {
        switch (this.direction) {
            case "up":
                return new Cell(this.row + 1, this.col, this.direction);
            case "down":
                return new Cell(this.row - 1, this.col, this.direction);
            case "left":
                return new Cell(this.row, this.col + 1, this.direction);
            case "right":
                return new Cell(this.row, this.col - 1, this.direction);
        }
    };
}

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    if (element.classList && element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

function cellId(row, col) {
    return "snake-board-" + row + "-" + col;
}

function actualizarPuntajes(){
    firebase.database().ref('puntajes').once('value').then(function(snapshot) {
        puntajesVal = snapshot.val();
    });
}

actualizarPuntajes();