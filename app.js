
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const pyshell = require('python-shell');
const schedule = require('node-schedule');
const port = process.env.PORT || 8000;
const filename = process.env.SETTINGS || "setting.json";
const sense_script = process.env.SENSE || "python/hcsr04.py";
const relay_script = process.env.RELAY_CONTROL || "python/relay.py";
/*
var tankType = 'box';
var tankRadius = 0;
var tankHeight = 0;
var tankWidth = 0;
var tankLength = 0;
var setLevel = 0;
var curLevel = 0;
var offset = 0;
var mode='auto';
var runMotor=false;
*/
var sensorShell = new pyshell(sense_script);
var relayShell = new pyshell(relay_script);

var autoSchedule = null;

sensorShell.on('message',function(message){
	curLevel = parseFloat(message) || settings.setLevel;
	console.log("Liquid Level (cm): ",curLevel);
});

sensorShell.on('error',function(err){
	console.log(err);
});

relayShell.on('message',function(message){
	console.log(message);
});

relayShell.on('error',function(err){
	console.log(err);
});

var sensorTrigger = schedule.scheduleJob('*/1 * * * *',function(){
	sensorShell.send('sense');
	console.log("Sense");
});

console.log("Loading settings.");
let setting = fs.readFileSync(filename);
var settings = JSON.parse(setting);
var curLevel = 0;
console.log("Loading completed.");

function saveSettings(content){
	let data = JSON.stringify(content,null,2);
	fs.writeFile(filename,data,(err)=>{
		if (err) throw err;
		console.log("Saved new settings.");
	});
}

app.use('/scripts/bootstrap/', express.static(__dirname + '/node_modules/bootstrap/dist/js/'));
app.use('/scripts/popper.js/', express.static(__dirname + '/node_modules/popper.js/dist/umd/'));
app.use('/scripts/jquery/', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/styles/bootstrap/', express.static(__dirname + '/node_modules/bootstrap/dist/css/'));

app.get('/',function(req,res){
	res.sendFile(path.join(__dirname+ '/static/dashboard.html'));
});

app.get('/gettank',function(req,res){
	var tank = {
		'type':settings.tankType,
		'height':settings.tankHeight,
		'level':curLevel,
		'threshold' : settings.setLevel,
		'offset':settings.offset,
		'mode':settings.mode,
		'motor':settings.runMotor,
	}
	if(settings.tankType=='cylindrical'){
		tank['radius'] = settings.tankRadius;
	}else{
		tank['width'] = settings.tankWidth;
		tank['length'] = settings.tankLength;
	}
	res.json(tank);
});

app.get('/setlevel',function(req,res){
	settings.setLevel = parseFloat(req.param('level')) || 0;
	saveSettings(settings);
	res.send(200);
});

app.get('/setoffset',function(req,res){
	settings.offset = parseFloat(req.param('offset')) || 0;
	saveSettings(settings);
	res.send(200);
});

app.get('/settank',function(req,res){
	if(req.param('type')=='cylindrical'){
		settings.tankType = 'cylindrical';
		settings.tankRadius = parseFloat(req.param('radius')) || 0;
		settings.tankHeight = parseFloat(req.param('height')) || 0;
	}else{
		settings.tankType = 'box';
		settings.tankWidth = parseFloat(req.param('width')) || 0;
		settings.tankLength = parseFloat(req.param('length')) || 0;
		settings.tankHeight = parseFloat(req.param('height')) || 0;
	}
	saveSettings(settings);
	res.send(200);
});

app.get('/setmode',function(req,res){
	if(req.param('mode')=='manual'){
		settings.mode = 'manual';
		//relayShell.send(settings.runMotor);
		console.log("Mode Manual - ",settings.runMotor);
	}else{
		settings.mode = 'auto';
		autoSchedule = schedule.scheduleJob('*/30 * * * * *', function(){
			if(curLevel < settings.setLevel){
				relayShell.send(true);
				console.log("Level Lower");
			}else{
				relayShell.send(false);
				console.log("Level Equal");
			}
		});
	}
	console.log(settings.mode);
	saveSettings(settings);
	res.send(200);
});

app.get('/setmotor',function(req,res){
	if(settings.mode=='manual'){
		if(req.param('set')=='on'){
			console.log(settings.runMotor=true);
		}else if(req.param('set')=='off'){
			console.log(settings.runMotor=false);
		}
		console.log("Motor",settings.runMotor);
		relayShell.send(settings.runMotor);
	}
	saveSettings(settings);
	res.send(200);
});

app.listen(port);
