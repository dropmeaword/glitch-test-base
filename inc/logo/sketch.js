import  '../../build/pantera/pantera.bundle.js';

var serialconf = {
	port: "/dev/tty.SLAB_USBtoUART",
	baudRate: 115200
};

var speech;
var ard = new P6.MCU( serialconf );

// Update the following url based on the server address shown in your Runway app under Input--Network
//const url = 'http://localhost:8000/query';

function setup() {
	// create full-window canvas
	let cnvs = createCanvas(windowWidth, windowHeight);
	cnvs.parent('container');

	Logo.init();
	Logo.makeui();

	ard.init();
/*
	speech = new p5.Speech();
	getAudioContext().resume(); // this is needed to get the speech api to work
	//foo.speak("I said don't touch me");
	speech.listVoices()
*/
}

// resize canvas if window is resized
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	Logo.resize();
}
  
function draw() {
	Logo.draw();
}

// /////////////////////////////////////////////////////////////////////////

var logo = {
	rotation: 0.25,
	dimcross: 12,
	grid: 30,
	shadowcast: 40,
	background: [ 255,182,193 ],
	text: [ 255, 210, 210 ], 
	shadow: [ 155,57,57,128 ]
};

var Logo = {
	items: [],
	gridstart: logo.grid,
	gui: null,

	init: function() {
			this.items.length = 0;
			for(j = 0; j < height; j += logo.grid) {
					for(i = 0; i < width; i += logo.grid) {
							this.items.push(new Cross(i, j));
					}
			}
			this.gridstart = logo.grid;
	},

	makeui: function() {
			this.gui = new dat.gui.GUI();
			this.gui.remember(logo);
			this.gui.add(logo, 'rotation').min(0).max(1).step(0.0025).name('Spin');
			this.gui.add(logo, 'grid').min(20).max(80).step(5).name('Grid size');
			this.gui.add(logo, 'shadowcast').min(-40).max(40).step(1).name('Shadow');
			this.gui.add(logo, 'dimcross').min(0).max(60).step(1).name('Dimension');
			
			var f1 = this.gui.addFolder('Colors');
			f1.addColor(logo, 'background').name('Background');
			f1.addColor(logo, 'text').name('Text');
			f1.addColor(logo, 'shadow').name('Shadow');
	},

	resize: function() {
			this.init();
	},

	draw: function () {
			if(logo.grid != this.gridstart) {
					init_crosses();
			}
			// draw PANTERA interactive logo
			let bg = color(logo.background); //(255,182,193);
			colorMode(RGB);
			background(bg);
	
			// draw all the spinning lines
			this.items.forEach( item => { item.paint() });
	
			// draw the foreground text
			let off = dist(width/2, height/2, mouseX, mouseY);
			push();
					noStroke();
					translate(width/2, height/2);
					fill(bg);
					textFont("righteous");
					textSize(200);
					let tw = Math.trunc( textWidth("PANTERA")/2 );
					fill(logo.shadow);
					let xdisp = map(mouseX, 0, width, logo.shadowcast, -1*logo.shadowcast);
					let ydisp = map(mouseY, 0, height, logo.shadowcast, -1*logo.shadowcast);
					text("PANTERA", -tw+xdisp, 100+ydisp);
					fill(logo.text);
					text("PANTERA", -tw, 100);
			pop();
	} // draw
} // Logo


class Cross {
	constructor(x, y) {
		this.xpos = x;
		this.ypos = y;
		this.dim = logo.dimcross;
		this.rot = 0;
	}

	update() {
		let d = dist(mouseX, mouseY, this.xpos, this.ypos);
		
		//if(d < width * logo.influence) { // area of influence of our cursor is 25% of the width of our screen
			this.rot += ( 8 / d ) * logo.rotation;
		//} else {
			// past that area of influence we don't change any spinner
		//} 
	}

	paint() {
		this.update();
		push();
		translate(this.xpos, this.ypos);
		stroke(255, 224, 229);
		strokeWeight(2);
		line(0, -logo.dimcross, 0, logo.dimcross);
		rotate(this.rot);
		stroke(255, 128, 149);
		strokeWeight(2);
		line(0, -logo.dimcross, 0, logo.dimcross);
		line(-logo.dimcross, 0, logo.dimcross, 0);
		pop();
	}
}
