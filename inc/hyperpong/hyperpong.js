'use strict';

// prototype for scoring calculations
// https://editor.p5js.org/zilog/sketches/G5WHssER1

var players = {
  player1: {
    bcode: '000000000017',
    score: 0,
    direction: 1
  },
  player2: {
    bcode: '000000000024',
    score: 0,
    direction: -1
  }
};

var midfield = null;
var limits = null;

var params = {
  debug: true,
  use_bitmap: false,
  drag: 0.004,
  scale: 0.5,
  orientation: 'vertical',
  speed: 8.0,
  strike: function() { Hyperpong.hitPuck( players.player1.bcode ); }
};

var tolerance = 0.75;

/** map barcode values to actual SVG files on disk **/
const bcode2asset = {
  '000000000017': 'media/barcode/player1-00000000001.svg',
  '000000000024': 'media/barcode/player2-00000000002.svg' 
};


// draw an arrow for a vector at a given base position
function drawArrow(base, vec, myColor) {
  push();
    stroke(myColor);
    strokeWeight(2);
    fill(myColor);
    translate(base.x, base.y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    let arrowSize = 5;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

var Hyperpong = {
  _assets: [],

  puck: null,

  preload: function() {
    for (const [bcode, fname] of Object.entries(bcode2asset)) {
      var svg = loadImage(fname);
      console.log("Loading asset: " + fname + " for barcode value " + bcode);
      this._assets.push( svg );
    }
  },

  resize: function() {
    /* do nothing for now */
  },

  init: function() {
    this.gui = new dat.gui.GUI();
    this.gui.remember(params);
    this.gui.add(params, 'debug').name('Debug view');
    this.gui.add(params, 'use_bitmap').name('Use bitmap');

    this.puck = new Puck(this._assets[0], this._assets[1]);
    this.arena = new Arena(this.puck);

    var f1 = this.gui.addFolder('Puck');
    f1.add(params, 'drag').min(0).max(0.02).step(0.00025).name('Drag');
    f1.add(params, 'scale').min(0.1).max(2.0).step(0.05).name('Scale').onChange( function(val) { Hyperpong.puck.resize(val) } );
    f1.add(params, 'orientation', [ 'vertical', 'horizontal' ]).name('Barcode');
    f1.add(params, 'speed', {stupid: 1.0, slow: 3.0, meh: 5.0, fast: 8.0, faster: 12.0, superduper: 20.0, hyper: 30.0} ).name('Impulse');
    f1.add(params, 'strike').name('Strike');
    f1.open();

    midfield = { 
      point: createVector(width / 2, height / 2), /* midfield position */
      vector: createVector(0, -height/2).sub(this.point) /* point vertically up */
    }

    // calculate scoring areas based on position of goals
    let s1 = this.arena.p1goal;
    let puck = this.puck;
    limits = [];

    let v1 = createVector(s1.bbox.x, s1.bbox.y+puck.rad * tolerance);
    v1.sub( midfield.point );
    limits.push( p5.Vector.angleBetween(v1, midfield.vector) );
  
    let v2 = createVector(s1.bbox.x, s1.bbox.y+s1.bbox.height-puck.rad * tolerance);
    v2.sub(  midfield.point );
    limits.push( p5.Vector.angleBetween(v2, midfield.vector) );
  },

  update: function() {
    this.puck.update();
    this.arena.update( this.puck );
  },

  draw: function() {
    background(255);

    this.arena.draw(this.puck);

    push();
      noFill();
      stroke(0);
      textFont("Aldrich");
      textSize(200);

      translate(width/2, height-50);

      text(players.player1.score, -160, 0);
      text(players.player2.score, 30, 0);
    pop();

    this.puck.draw();

    if( params.debug ) {
      drawArrow(midfield.point, midfield.vector, 'red');
      let pp = p5.Vector.sub(this.puck.pos, midfield.point);
      drawArrow(midfield.point, pp, 'green');
      let radians = p5.Vector.angleBetween( midfield.vector, pp );
      noStroke();
      fill(0);
      text("angle: " + nf(degrees(radians), 4, 2) + " radians: " + nf(radians, 4, 2), 40, 40);
      text("scoring angle: " + nf(limits[0], 4, 2) + ", " + nf(limits[1], 4, 2), 40, 50);
    }
  },

  score: function(player) {
    console.log(player + " scored!!!");
    player.score++;
    this.restartGame();
  },

  restartGame: function() {
    this.puck.reset();
  },

  hitPuck: function( barcodestr ) {
    let impulse = null;
    // console.log("impulse: " + params.speed);
    // console.log("barcode" + barcodestr);
    // check which player hit the puck and push the ball towards the opposite field
    if(players.player2.bcode === barcodestr) {
      impulse = createVector(random(-params.speed*0.8, -params.speed), random(-8, 8));
    } else if (players.player1.bcode === barcodestr) {
      impulse = createVector(random(params.speed*0.8, params.speed), random(-8, 8));
    }

    this.puck.applyImpulse( impulse );
  }
};

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
class Goal {
  constructor(id, sx, sy, sw, sh) {
    this.id = id;
    this.bbox = { x: sx, y: sy, width: sw, height: sh };
    this.color = color(0, 0, 0);
    this.hit = false;
    this.inside = false;

    console.log( this.bbox );
  }

  draw_scoring_area() {
    push();
      fill(255, 255, 0, 128);
      stroke(255, 0, 0, 128);
      beginShape();
      vertex(this.bbox.x, this.bbox.y+ Hyperpong.puck.rad * tolerance);
      vertex(midfield.point.x, midfield.point.y);
      vertex(this.bbox.x, this.bbox.y+this.bbox.height - Hyperpong.puck.rad * tolerance);
      endShape(CLOSE);
    pop();
  }

  draw() {
    push();
      noStroke();
      fill(255);
      translate(this.bbox.x, this.bbox.y);
      for(let i = 0; i < 16; i+=3) {
        fill(200-(i*14));
        rect(i, i, 22-i*1.5, this.bbox.height-i*4.5);
      }
    pop();
    // draw debug lines
    if( params.debug ) {
      this.draw_scoring_area();
      push();
        noFill();
        strokeWeight(4);
        stroke( this.color );
        translate(this.bbox.x, this.bbox.y);
        rect(0, 0, this.bbox.width, this.bbox.height);
      pop();
    }
  }

  update(puck) {
    let green = color(0, 255, 0);

    if(this.isInside(puck)) {
      this.inside = true;
      this.color = color(200, 200, 255);
      return;
    } else {
      this.color = green;
      this.inside = false;
    }

    if(this.isHit(puck)) {
      this.color = color(255, 0, 0);
      this.hit = true;
      return;
    } else {
      this.color = green;
      this.hit = false;
    }
  }

  isInside(puck) {
    var collidePointRect = function (pointX, pointY, x, y, xW, yW) {
      if (pointX >= x &&         // right of the left edge AND
          pointX <= x + xW &&    // left of the right edge AND
          pointY >= y &&         // below the top AND
          pointY <= y + yW) {    // above the bottom
              return true;
      }
      return false;
    };
      
    let rect2 = puck.boundingbox();
    let rect1 = this.bbox;
    let coltop = collidePointRect(rect2.x, rect2.y, rect1.x, rect1.y, rect1.width, rect1.height);
    let colbot = collidePointRect(rect2.x+rect2.width, rect2.y+rect2.height, rect1.x, rect1.y, rect1.width, rect1.height);
    
    return (coltop && colbot);
  }

  isHit(puck) {
    let rect1 = puck.boundingbox();
    let rect2 = this.bbox;
    return (rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y);
  }
} // class Goal


// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
class Arena {
  constructor(puck) {
    let padding = 8;
    // this.goal1 = new Goal(0, 2*puck.rad, padding);
    // this.goal2 = new Goal(PI, 2*puck.rad, width-padding);

    let d = 2*puck.rad;
    let w = 20+ 2*puck.rad;
    let h = height*0.33;

    this.p1goal = new Goal('p1goal', -w+20, height/2-h/2, w, h, 0);
    this.p2goal = new Goal('p2goal', width-20, height/2-h/2, w, h, PI);
  }

  update(puck) {
    this.p1goal.update( puck );
    this.p2goal.update( puck );

    if(this.p1goal.inside) {
      Hyperpong.score( players.player2 );
    }
    if(this.p2goal.inside) {
      Hyperpong.score( players.player1 );
    }

    puck.update( this.p1goal, this.p2goal );
  }

  draw(puck) {
    let mx = 8;
    let my = 8;
    push();
      stroke(100);
      strokeWeight(6);
      noFill();

      // draw outer ring
      beginShape();
        vertex(mx, my);
        vertex(width-mx, my);
        vertex(width-mx, height-my);
        vertex(mx, height-my);
      endShape(CLOSE);

      // draw middle line
      beginShape(LINES);
        vertex(width/2, my);
        vertex(width/2, height-my);
      endShape();

      // draw areas
      arc(mx, height/2, width*0.2, height*0.8, -HALF_PI, HALF_PI);
      arc(width-mx, height/2, width*0.2, height*0.8, HALF_PI, -HALF_PI);
    pop();

    this.p1goal.draw();
    this.p2goal.draw();
  }
} // class Arena

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
class Puck {

  constructor(bcode1, bcode2) {
    this.p1bcode = bcode1;
    this.p2bcode = bcode2;
    this.reset();

    this.resize( this.scale );
  }

  reset() {
    this.pos = createVector(width/2, height/2);
    this.vel = createVector(random(-5, 5), random(-3.5, 3.5));
    this.acc = createVector(0, 0);
    this.pre = this.pos.copy();
    this.drag = 0.004;
    this.scale = params.scale;
  }

  resize(pcent) {
    this.scale = pcent;
    let h1 = (this.p1bcode.width)/2;
    let h2 = (this.p1bcode.height)/2;
    this.rad = Math.sqrt(h1*h1, h2*h2) * pcent * 1.17;

    // resize boundingbox as well
    this.bbox = { 
      x: -this.rad,
      y: -this.rad,
      width:  2*this.rad,
      height: 2*this.rad
    };
  }

  boundingbox() {
    return { 
            x: this.bbox.x + this.pos.x, 
            y: this.bbox.y + this.pos.y,
            width: this.bbox.width,
            height: this.bbox.height
          };
  }

  update() {
    this.pre = this.pos.copy();
    this.vel.add( this.acc );
    this.vel.mult(1.0 - params.drag);
    this.pos.add( this.vel );

    //console.log(this.acc);

    // this.pre = this.pos.copy(); // store previous position
    // this.pos.x = mouseX;
    // this.pos.y = mouseY;
  
    let gonnaScore = Hyperpong.arena.p2goal.isHit(this) || Hyperpong.arena.p1goal.isHit(this);
    //let gonnaScore = false;
  
    // if(gonnaScore) {
    //   console.log("Hitting it");
    // }

    noStroke();
    fill(0);

    let v0 = p5.Vector.sub(this.pos, midfield.point);
    let angle = p5.Vector.angleBetween(midfield.vector, v0);
    text("puck angle: " + nf(angle, 4, 2), 40, 70);

    if( gonnaScore && ((angle > limits[0]) && (angle < limits[1])) ) {
      text("SCORED!", 10, width-40);
      console.log("scored!!!");
    }

    // check if our puck is about to fall through the hole
    let falling = gonnaScore  && ((angle > limits[0]) && (angle < limits[1]));
    if(!falling) {
      // if not, check for boundary conditions
      if( ( (this.pos.y+this.rad) >= height) || ( (this.pos.y-this.rad) < 0) ) {
        this.vel.y = -1.0 * this.vel.y; // invert vertical speed
      }

      if( ( (this.pos.x+this.rad) >= width) || ( (this.pos.x-this.rad) < 0) ) {
        this.vel.x = -1.0 * this.vel.x; // invert horizontal speed
      }
    } else {
      this.vel.mult(1.25);

      // if it is falling, check if it has scored yet
      if( Hyperpong.arena.p2goal.isInside(this) ) {
        Hyperpong.score( players.player1 );
        console.log("scored!!!");
      }

      if( Hyperpong.arena.p1goal.isInside(this) ) {
        Hyperpong.score( players.player2 );
        console.log("scored!!!");
      }
    }

  } // update

  applyForce(force) {
    this.acc.add(force)
  }

  applyImpulse(imp) {
    this.vel.add(imp)
  }

  draw() {
    push();
      // draw debug bounding box
      // if(params.debug) {
      //   // rectMode(CENTER);
      //   let bb = this.boundingbox();
      //   noFill();
      //   stroke(0, 0, 255);
      //   rect(bb.x, bb.y, bb.width, bb.height);

      //   let v0 = createVector(width/2, height/2);
      //   drawArrow(v0, this.pos, 'red');
      //   drawArrow(v0, this.midv, 'green');
      // } else {
        translate(this.pos.x, this.pos.y);
        //scale(params.scale, params.scale);
        noFill();
        //noStroke();
        stroke(220);
        //strokeWeight(4);
        ellipse(0, 0, 2*this.rad, 2*this.rad);

        // rotate in the direction of the barcode orientation
        if('vertical' === params.orientation) {
          rotate(HALF_PI);
        }
        // decide which barcode to draw depending on where in the arena we are
        let bcodeimg = null;
        if(this.pos.x > width/2) {
          bcodeimg = this.p2bcode;
        } else {
          bcodeimg = this.p1bcode;
        }

        // draw the barcode image
        imageMode(CENTER);
        image(bcodeimg, 0, 0, this.p1bcode.width * this.scale, this.p1bcode.height * this.scale);
      // }
    pop();
  }
} // class Puck
