#!/usr/bin/node

var MACHINE = require('./machine.js')
var PARSER  = require('./parser.js')
//var process = require('process')
var fs      = require('fs')

var parser = PARSER.PARSER(console.error);

// We want to be able to stop execution. So this is going to 
// contain a setTimeout() thingy when running
var stepTimer = null;

// Cancel running of next step
function stop() {
	clearTimeout(stepTimer);
}

function getsource() {
	if (process.argv.length != 3) {
		console.error('Need source file as first argument.')
		process.exit(1)
	}
	var source = process.argv[2]
	return fs.readFileSync(source).toString()
}

function readchar() {
	// TODO: implementation
	return 0
}

console.error("RUNNER: Parsing");
var program = parser.parse(getsource());
if (!parser.okay()) {
	// Error already logged by parser
	return;
}

console.error("RUNNER: Initializing VM");
var vm = MACHINE.VM(
	program,
	readchar,
	console.log,
	console.error
);

// execute one step, then set timer for the next one.
// If vm.step() returns false, the program ended.
function step() {
	if(vm.step()) {
		stepTimer = setTimeout(step, 0);
	}
}

console.error("RUNNER: Starting execution");
step();

