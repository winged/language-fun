(function(){

	var opcodes = {
		// MSB defines opcode base, LSB defines variant
		'START':  {base: 0x00, needlength: 1},
		'NOP':    {base: 0x00, needlength: 1},
		'READC':  {base: 0x10, needlength: 2},
		'WRITEC': {base: 0x20, needlength: 2},
		'WRITEI': {base: 0x30, needlength: 2},
		'SET':    {base: 0x40, needlength: 3},
		'ADD':    {base: 0x50, needlength: 3},
		'SUB':    {base: 0x60, needlength: 3},
		'MUL':    {base: 0x70, needlength: 3},
		'DIV':    {base: 0x80, needlength: 3},
		'JZ':     {base: 0x90, needlength: 3},
		'JNZ':    {base: 0xA0, needlength: 3},
		'DUMP':   {base: 0xE0, needlength: 3},
		// ...
		'END':    {base: 0xF0, needlength: 1},
	}

	function VM(init_mem, fn_in_char, fn_out_char, fn_out_int) {
		var memory = init_mem;

		var running = true;

		function _opsize(base) {
			// TODO: implement in more generic / clean way.
			// Right now, there's two places that know about
			// opcode size.
			switch(base) {
				// nop, start, dump, end need no parameter (size 1). start is alias of NOP, so no change
				case 0x0:
				case 0xF:
					return 1;

				// read, write etc need 1 parameter (size 2)
				case 0x1:
				case 0x2:
				case 0x3:
					return 2;

				// All others need 2 parameters (size 3)
				default:
					return 3;
			}
		}

		function readmem(addr) {
			return memory[addr];
		}
		function readptr(addr) {
			return memory[readmem(addr)];
		}

		/** make sure addr exists. adds zeroes to end of memory until addr exists. */
		function fixaddr(addr) {
			while(addr > memory.length) {
				memory.push(0);
			}
		}

		function op_nop() {
		}
		function op_add(addr, diff) {
			log("    ADD "+addr + " " + diff);
			fixaddr(addr);
			memory[addr] += diff;
		}
		function op_sub(addr, diff) {
			log("    SUB "+addr + " " + diff);
			fixaddr(addr);
			memory[addr] -= diff;
		}
		function op_set(addr, val) {
			log("    SET "+addr + " " + val);
			fixaddr(addr);
			memory[addr] = val;
		}
		function op_readc(addr) {
			log("    READC "+addr);
			op_set(addr, fn_in_char());
		}
		function op_writei(val) {
			log("    WRITEI "+val);
			fn_out_int(val);
		}
		function op_writec(val) {
			log("    WRITEC "+val);
			fn_out_char(val);
		}
		function op_jnz(addr, val) {
			log("    JNZ "+addr + " " + val);
			fixaddr(addr);
			if(val != 0) {
				memory[0] = addr;
			}
		}
		function op_jz(addr, val) {
			log("    JZ "+addr + " " + val);
			fixaddr(addr);
			if(val == 0) {
				memory[0] = addr;
			}
		}
		function op_dump(addr1, addr2) {
			log("    DUMP "+addr1 + " " + addr2);
			fixaddr(addr1);
			fixaddr(addr2);

			var chars = ": \n";
			for (var i = addr1; i <= addr2; i++) {
				fn_out_int(i+1); // lineno

				fn_out_char(chars.charCodeAt(0)); // ":"
				fn_out_char(chars.charCodeAt(1)); // " "

				fn_out_int(memory[i]); // memory content

				fn_out_char(chars.charCodeAt(2)); // "\n"
			}
		}
		function op_end() {
			log("    END");
			running = false;
		}


		function _step() {
			if(!running) {
				return false;
			}
			// get program counter
			var pc = memory[0];

			// read opcode
			var opcode = memory[pc];

			// decode opcode into base (function) and variant (param handling)
			var variant = opcode  %  16;
			var opbase  = opcode  >>  4;

			var opinfo = "["+pc+"] "+opbase.toString(16)+"."+variant.toString(16);

			// move program counter ahead in memory
			var os = _opsize(opbase);
			memory[0] += os;

			// for each operand, variant is a bitmap on whether
			// to use value directly or indirectly (pointer).
			function param(pos) {
				
				if(variant & (1 << pos)) {
					log("    DECODED: p" + pos + " ptr=" + readmem(pc+pos+1) + ", val="+readptr(pc+pos+1));
					return readptr(pc+pos+1);
				}
				else {
					log("    DECODED: p" + pos + " val=" + readmem(pc+pos+1));
					return readmem(pc+pos+1);
				}
			}

			switch(opbase) {
				case 0x0: log("VM: "+opinfo+" NOP   "); op_nop   ();                   break;
				case 0x1: log("VM: "+opinfo+" READC "); op_readc (param(0));           break;
				case 0x2: log("VM: "+opinfo+" WRITEC"); op_writec(param(0));           break;
				case 0x3: log("VM: "+opinfo+" WRITEI"); op_writei(param(0));           break;
				case 0x4: log("VM: "+opinfo+" SET   "); op_set   (param(0), param(1)); break;
				case 0x5: log("VM: "+opinfo+" ADD   "); op_add   (param(0), param(1)); break;
				case 0x6: log("VM: "+opinfo+" SUB   "); op_sub   (param(0), param(1)); break;
				case 0x7: log("VM: "+opinfo+" MUL   "); op_mul   (param(0), param(1)); break;
				case 0x8: log("VM: "+opinfo+" DIV   "); op_div   (param(0), param(1)); break;
				case 0x9: log("VM: "+opinfo+" JZ    "); op_jz    (param(0), param(1)); break;
				case 0xA: log("VM: "+opinfo+" JNZ   "); op_jnz   (param(0), param(1)); break;
				case 0xE: log("VM: "+opinfo+" DUMP  "); op_dump  (param(0), param(1)); break;
				case 0xF: log("VM: "+opinfo+" END   "); op_end   ();                   break;
				default:
					// error!
					log("VM: "+opinfo+" ERROR: INVALID OP base="+opbase + " variant="+variant+", ABORTING");
					op_end();
					break;
			}

			return running;
		}


		return {
			step:   _step,
		}
	}

	var stdout  = '', outElem = document.getElementById('output');
	var stdlog  = '', logElem = document.getElementById('log'   );


	
	function getCode() {
		return document.getElementById('code').value;
	}
	function getStdin() {
		return document.getElementById('input').value;
	}
	function writeString(str) {
		stdout += str;
		outElem.textContent = stdout;
		outElem.scrollTop = outElem.scrollHeight;
	}

	var log = log_out;

	function toggle_log() {
		if (log == log_nop) {
			log = log_out;
			return true;
		}
		else {
			log = log_nop;
			return false;
		}
	}

	function log_nop(str) {
	}
	function log_out(str) {
		stdlog += str + "\n";
		logElem.textContent = stdlog;
		logElem.scrollTop = logElem.scrollHeight;
	}

	function parseLine(line, lineno) {
		var chomped = line
			.replace(/^\s*/, '') // remove leading space
			.replace(/\s*$/, '') // remove trailing space
			.replace(/#.*/, ''); // remove comments

		if(chomped.length == 0) {
			// empty line, or (already-removed) comment
			return [];
		}
		var words = chomped.split(/\s+/);


		log("PARSER: LINE " + lineno + ": " + line);

		// see if opcode is valid
		if(words[0] in opcodes) {
			var op_text = words[0];
			var opinfo = opcodes[op_text];
			// convert opcode text to integer
			words[0] = opinfo.base;
			
			// check operation length
			if (opinfo.needlength != words.length) {
				var error = "Syntax error at line " + lineno + ": " +
					"Opcode " + op_text + " requires " + (opinfo.needlength-1) +
					" parameters, got " + (words.length-1);
				log("PARSER: " + error);
				return error;
			}

		}
		else {
			var error = "Syntax error at line " + lineno + ": " + "Opcode not known: " + words[0];
			log("PARSER: " + error);
			return error;
		}

		// parse parameters
		var variant = 0;
		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			if (word[0] == '@') {
				// indirect param. set variant for that position
				var pos = i - 1;
				log("        Param "+i+" is indirect");
				var mask = 1 << pos;
				variant = variant | mask;
				words[i] = parseInt(word.substr(1));
			}
			else {
				words[i] = parseInt(word);
			}
		}

		words[0] = words[0] + variant;
		log("        OP combined: "+words[0].toString(16));
		
		return words;
	}

	function parse(text) {
		var lines = text.split(/\n/);

		var ll = lines.length;
		memory = [];
		for (var i = 0; i < ll; i++) {
			var operation = parseLine(lines[i], i+1);
			if (typeof operation == 'string') {
				writeString(operation);
				return false;
			}
			for (var j = 0; j < operation.length; j++) {
				memory.push(operation[j]);
			}
		}

		return memory;
	}

	document.getElementById('logtoggle').onclick = function() {
		if(toggle_log()) {
			document.getElementById('logtoggle').textContent = 'Disable Log';
		}
		else {
			document.getElementById('logtoggle').textContent = 'Enable Log';
		}
	}
	document.getElementById('clearlog').onclick = function() {
		stdlog = '';
		logElem.textContent = '';
	}

	document.getElementById('clearoutput').onclick = function() {
		stdout = '';
		outElem.textContent = '';
	}

	document.getElementById('run').onclick = function() {
		log("USER: Clicked start");

		log("RUNNER: Parsing");
		var program = parse(getCode());

		if(program === false) {
			// error happened, abort. Error message
			// already written by parse(), no further
			// action required.
			return;
		}

		var input   = getStdin();
		var inptr   = 0;

		log("RUNNER: Initializing VM");
		var vm = VM(
			program,
			function()  { return input[inptr++].charCodeAt(0); },
			function(c) { writeString(String.fromCharCode(c))},
			function(c) { writeString(c.toString())}
		);

		var timer = null;
		function step() {
			if(vm.step()) {
				timer = setTimeout(step, 0);
			}
		}

		
		document.getElementById('stop').onclick = function() {
			clearTimeout(timer);
			log("USER: Stopped execution");
		}

		log("RUNNER: Starting execution");
		//while(vm.step());
		step();
	}
})();
