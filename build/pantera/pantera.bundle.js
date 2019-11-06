class MCU {

	constructor(config) {
		this.config = config;
		this.serial = null;
	}

	init() {
		// make an instance of the SerialPort object
		this.serial = new p5.SerialPort();
	
		// get a list of all the serial ports available
		// You should have a callback defined to see the results. See gotList, below:
		this.serial.list();
	
		// assuming the arduino is connected open a serial session on it
		this.serial.open(this.config.port, { 'baudRate' : this.config.baudRate });
	
		// When you get a list of serial ports that are available
		this.serial.on('list', onSerialList);
		this.serial.on('connected', onSerialConnected); // callback for connecting to the server
		this.serial.on('open', onSerialOpened);
		this.serial.on('error', onSerialError);
		this.serial.on('close', onSerialClosed);
	
		// When you some data from the serial port
		this.serial.on('data', onSerialData);
	}
	
	onSerialError(error) {
		console.log("(!!!) ERROR -> " + error);
	}
	
	// called when we receive the list of available serial ports
	onSerialList(thelist) {
		print("Available serial ports:");
		for (let i = 0; i < thelist.length; i++) {
			print(i + " " + thelist[i]);
		}
	}
	
	onSerialConnected() {
		console.log("bound to serial port");
	}
	
	onSerialOpened() {
		console.log("serial connection has been established");
	}
	
	onSerialClosed() {
		console.log("serial connection has been closed");
	}
	
	//  called when there is data available from the serial port
	onSerialData() {
		let currentString = serial.readLine();  // read the incoming data
		trim(currentString);                    // trim off trailing whitespace
		if (!currentString) return;             // if the incoming string is empty, do no more
		console.log(currentString);
	}

}

/** statusbar stuff */
class Rebar {
  constructor() {
    this.HIDE_KEY = 'h';

    this.template = '<div id="statusbar" class="status">' +
                        '<div class="mcu-status unavailable">&#8277;</div>'+
                        '<div>no hardware detected</div>'+
                        '<div>OSC listening on port 8081</div>'+
                        '<div>MQTT listening on port 8091</div></div>';

    this._visible = true;
  }

  toggle() {
    if(this._visible) {
        hide();
        this._visible = false;
    } else {
        show();
        this._visible = true;
    }
  }

  show() {
    document.getElementById("statusbar").style.visibility="visible";
    this._visible = true;
  }

  hide() {
    document.getElementById("statusbar").style.visibility="hidden";
    this._visible = false;
  }

  handleKeyUp(e) {
    if (e.key === 'h' || e.key === 'H') {
        if(rebar._visible === true) {
            rebar.hide();
        } else {
            rebar.show();
        }
    }
  }

}


var rebar = new Rebar();

class OSC {

  constructor( config ) {
    this.config = config;
  }

  receiveOsc(address, value) {
    console.log("received OSC: " + address + ", " + value);
    if (address === '/shape') {
      console.log("setting shape to: " + value[0] );
      console.log("setting color to: " + value[1] );
      shape = value[0];
      col = value[1];
    }
  }
  
  sendOsc(address, value) {
    socket.emit('message', [address, value]);
  }
  
  init(oscPortIn, oscPortOut) {
    socket = io.connect('http://127.0.0.1:8081', { port: 8081, rememberTransport: false });
    socket.on('connect', function() {
      socket.emit('config', {	
        server: { port: oscPortIn,  host: '127.0.0.1'},
        client: { port: oscPortOut, host: '127.0.0.1'}
      });
    });
    socket.on('connect', function() {
      isConnected = true;
    });
    socket.on('message', function(msg) {
      if (msg[0] == '#bundle') {
        for (var i=2; i<msg.length; i++) {
          receiveOsc(msg[i][0], msg[i].splice(1));
        }
      } else {
        receiveOsc(msg[0], msg.splice(1));
      }
    });
  }

}

/** DOM might not be ready when we first execute this */
document.addEventListener("DOMContentLoaded", function(event) { 
  // add it to the body on init
  document.body.innerHTML += rebar.template;
  document.addEventListener('keyup', rebar.handleKeyUp );
});

export { MCU, Rebar, rebar, OSC };
