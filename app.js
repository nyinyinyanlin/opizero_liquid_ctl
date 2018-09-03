
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const pyshell = require('python-shell');
const schedule = require('node-schedule');
const port = process.env.PORT || 80;
const filename = process.env.SETTINGS || "setting.json";
const sense_script = process.env.SENSE || "python/hcsr04.py";
const relay_script = process.env.RELAY_CONTROL || "python/relay.py";
const flow_script = process.env.FLOW_SENSE || "python/flow.py";

var flowing = false;
var timestamp = null;
var timeout = 60;

var flowSchedule = schedule.scheduleJob('*/5 * * * * *',function(){
	pyshell.run(flow_script,{},function(err,results){
		if(err) throw err;
		console.log(results);
		if(parseInt(results[0])){
			flowing = true;
		}else{
			flowing = false;
		}
	});
});

function getLevel(){
	pyshell.run(sense_script,{},function(err,results){
		if(err) throw err;
		curLevel = (settings.tankHeight - parseFloat(results[0]))||settings.setLevel;
		if (curLevel < 0){
			curLevel = 0;
		}
	})
}

function setAutomode(){
	autoSchedule = schedule.scheduleJob('*/5 * * * * *', function(){
		if((settings.setLevel > (curLevel+settings.offset))&&timestamp&&(parseInt((new Date()-timestamp)/1000)>timeout)){
			console.log("Motor fill");
			setMotor("on");
			runMotor = "on";
			setTimeout(function(){
				if(!flowing){
					timestamp = new Date();
					setMotor("off");
					runMotor = "off";
				}else{
					timestamp = null;
				}
			},10000);
		}else{
			console.log("Motor stop");
			setMotor("off");
			runMotor = "off";
		}
	});
}

function setMotor(control){
	pyshell.run(relay_script,{args:[control]},function(err,results){
		if(err) throw err;
		console.log('results: %j',results);
	});
}

var sensorTrigger = schedule.scheduleJob('*/5 * * * * *',function(){
	getLevel();
	console.log("Sense");
});

console.log("Loading settings.");
let setting = fs.readFileSync(filename);
var settings = JSON.parse(setting);
var curLevel = 0;
var runMotor = "off";
var autoSchedule = null;
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
		'motor':runMotor,
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
		setMotor(runMotor);
		console.log("Mode Manual - ",runMotor);
		if(autoSchedule){
			autoSchedule.cancel();
			autoSchedule = null;
			console.log("Process Terminated");
		}
	}else{
		settings.mode = 'auto';
		setAutomode();
	}
	console.log(settings.mode);
	saveSettings(settings);
	res.send(200);
});

app.get('/setmotor',function(req,res){
	if(settings.mode=='manual'){
		if(req.param('set')=='on'){
			console.log(runMotor="on");
		}else if(req.param('set')=='off'){
			console.log(runMotor="off");
		}
		console.log("Motor",runMotor);
		setMotor(runMotor);
	}
	res.send(200);
});

setMotor("off");
if(settings.mode=="auto"){
	setAutomode();
}
app.listen(port);
