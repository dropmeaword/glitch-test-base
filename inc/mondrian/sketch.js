// largely based on the implementation by 
// tim homan  https://generativeartistry.com/tutorials/piet-mondrian/
var step;
var white = '#F2F5F1';
var colors = ['#D40920', '#1356A2', '#F7D842']

var squares;
var refreshed = false;

var parameters = {
    density: 12,
    vsplit: 0.5, /* probability of a vertical split */
	hsplit: 0.5, /* probability of a horizontal split */
	/* de stijl */
    red: '#D40920',
    blue: '#1356A2', 
    yellow: '#F7D842'
};

var gui;

function gui_init() {
    gui = new dat.gui.GUI();
    gui.remember(parameters);
	var ctrl = gui.add(parameters, 'density').min(0).max(35).step(1).name('Density').onFinishChange( function () {refresh()} );
	ctrl.onFinishChange( function () { refresh() } );
    gui.add(parameters, 'hsplit').min(0).max(0.99).step(0.05).name('H split').onFinishChange( function() {refresh()} );
    gui.add(parameters, 'vsplit').min(0).max(0.99).step(0.05).name('V split').onFinishChange( function() {refresh()} );
    var f1 = gui.addFolder('De Stijl');
    f1.addColor(parameters, 'red').name('Color 1');
    f1.addColor(parameters, 'blue').name('Color 2');
	f1.addColor(parameters, 'yellow').name('Color 3');
	gui.close();
}


function setup() {
	// create full-window canvas
	let cnvs = createCanvas(windowWidth, windowHeight);
	cnvs.parent('container');

	gui_init();
	refresh();
}

// resize canvas if window is resized
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function refresh() {
	console.log("refresh");
	step = width / parameters.density;
	squares = [{
		x: 0,
		y: 0,
		width: width,
		height: height
	}];
	for (var i = 0; i < width; i += step) {
		splitSquaresWith({ y: i });
		splitSquaresWith({ x: i });
	}

	refreshed = true;
}

function splitOnX(square, splitAt) {
	var squareA = {
		x: square.x,
		y: square.y,
		width: square.width - (square.width - splitAt + square.x),
		height: square.height
	};

	var squareB = {
		x: splitAt,
		y: square.y,
		width: square.width - splitAt + square.x,
		height: square.height
	};

	squares.push(squareA);
	squares.push(squareB);
}

function splitOnY(square, splitAt) {
	var squareA = {
		x: square.x,
		y: square.y,
		width: square.width,
		height: square.height - (square.height - splitAt + square.y)
	};

	var squareB = {
		x: square.x,
		y: splitAt,
		width: square.width,
		height: square.height - splitAt + square.y
	};

	squares.push(squareA);
	squares.push(squareB);
}
  
function splitSquaresWith(coordinates) {
	const { x, y } = coordinates;
  
	for (var i = squares.length - 1; i >= 0; i--) {
	  const square = squares[i];
	  
	  if (x && x > square.x && x < square.x + square.width) {
		if(Math.random() > parameters.hsplit) {
		  squares.splice(i, 1);
		  splitOnX(square, x); 
		}
	  }
  
	  if (y && y > square.y && y < square.y + square.height) {
		if(Math.random() > parameters.vsplit) {
		  squares.splice(i, 1);
		  splitOnY(square, y); 
		}
	  }
	}
}

function draw() {
	if( refreshed ) {
		strokeWeight(8);
		for (var i = 0; i < colors.length; i++) {
			squares[Math.floor(Math.random() * squares.length)].color = [parameters.red, parameters.blue, parameters.yellow][i];
		}

		for (var i = 0; i < squares.length; i++) {
			rect(
				squares[i].x,
				squares[i].y,
				squares[i].width,
				squares[i].height
			);
			if(squares[i].color) {
				fill(squares[i].color);
			} else {
				fill(255);
			}
		}
		refreshed = false;
	}
}
