// NodeJS app that takes requests from Twilio SMS services and converts them to
// TTS on the raspberry pi

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var fs = require('fs');
var contacts = require('./contacts.js').list;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set our port
var port = process.env.PORT || 3000;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

// middleware to timelog all requests
router.use(function(req, res, next) {
	// Log the time when a request is made
    var currentdate = new Date();
    var datetime = "LOG: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    console.log(datetime);
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'API IS UP!' });
});

// on routes that end in /api/twilio
// ----------------------------------------------------
router.route('/twilio')
    // accessed by POST'ing to http://localhost:8080/api/twilio
    .post(function(req, res) {
        // gather the
		var name = req.body.From;
        var command = req.body.Body;

		// if the incoming phone number is registered,
		if (req.body.From in contacts){
			name = contacts[req.body.From];
			console.log("Message from :: " + name);
			setTimeout(function() {
				execVoiceCommand( "Alexa ... " + command );
			}, 3000);
		}

        // write to log
		writeToLog(name+":"+command);

        // send response back
		res.setHeader('content-type', 'text/plain');
        res.send("Thanks "+ name +", you just messaged a Raspberry Pi TTS service!");
    })

// REGISTER OUR ROUTE -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic port: ' + port);

// helper function to exec commands
function execVoiceCommand( command ) {

	// fork off and execute the espeak command on the raspberry pi
	var sys = require('util');
	var exec = require('child_process').exec;
	var child;
	var tts = "espeak -ven+f2 -k5 -s150 "

	// stringify command
	command = "'" + command + "'"

	// executes `command` on raspberry pi
	child = exec(tts + command , function (error, stdout, stderr) {
		console.log('stdout: \n' + stdout);
		console.log('stderr: \n' + stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});
}

function writeToLog(text){
    var currentdate = new Date();
    var datetime = "[" + currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds() + "]";
    fs.appendFile("log.txt", datetime+text+'\n', function(err) {
        if(err) {
            return console.log("Logging error: ", err);
        }
    });
}
