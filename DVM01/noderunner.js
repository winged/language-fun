#!/usr/bin/node

var MACHINE = require('./machine.js')
var PARSER  = require('./parser.js')
var fs      = require('fs')

var parser = PARSER.PARSER(do_log);

function do_log(text) {
	if(!do_log.disable) {
		console.error(text)
	}
}
do_log.disable = false;

function getsource() {
	if (process.argv.length < 3) {
		// TODO: Usage message would be better here. OR, assume
		// stdin
		console.error('Error: No input file specified')
		process.exit(1)
	}
	var source = null;
	var args   = process.argv.slice(2)

	args.forEach(function(opt) {
		if (opt[0] == '-') {
			switch(opt) {
				case '-nolog': do_log.disable = true; break;
				default:
					console.error('Unknown argument: ' + opt)
					process.exit(1)
			}
		}
		else {
			// we assume that an argument that doesn't start 
			// with "-" is the source file.
			source = opt
		}
	})
	return fs.readFileSync(source).toString()
}

function readchar() {
	// TODO: implementation
	return 0
}

var src = getsource()
do_log("RUNNER: Parsing");
var program = parser.parse(src);
if (!parser.okay()) {
	// Error already logged by parser
	return;
}

do_log("RUNNER: Initializing VM");
var vm = MACHINE.VM(
	program,
	readchar,
	console.log,
	do_log
);

do_log("RUNNER: Starting execution");
while(vm.step()) {
	// do nothing..
}

