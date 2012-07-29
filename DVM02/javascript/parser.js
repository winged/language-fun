
exports.PARSER = function(log) {
	var opcodeInfo = {
		// MSB defines opcode base, LSB defines variant
		'START':  {base: 0x00, numArgs: 0},
		'NOP':    {base: 0x00, numArgs: 0},
		'READC':  {base: 0x10, numArgs: 1},
		'WRITEC': {base: 0x20, numArgs: 1},
		'WRITEI': {base: 0x30, numArgs: 1},
		'SET':    {base: 0x40, numArgs: 2},
		'ADD':    {base: 0x50, numArgs: 2},
		'SUB':    {base: 0x60, numArgs: 2},
		'MUL':    {base: 0x70, numArgs: 2},
		'DIV':    {base: 0x80, numArgs: 2},
		'JZ':     {base: 0x90, numArgs: 2},
		'JNZ':    {base: 0xA0, numArgs: 2},
		'JGT':    {base: 0xB0, numArgs: 3},
		'COPY':   {base: 0xC0, numArgs: 2},
		'DUMP':   {base: 0xE0, numArgs: 2},
		// ...
		'END':    {base: 0xF0, numArgs: 0},
	}


	var okay  = true;
	var error = '';
	function decode(opBase, operands, known_jumplabels) {
		// Last 4 bits of opBase are markers for indirect
		// access to the operand. They will be set to 1
		// if the operand starts with an @

		operation = [];
		for(i=0; i < operands.length; i++) {
			var operand = operands[i];
			if (operand.content[0] == '@') {
				// Indirect! Depending on which operand we're working on,
				// we need to set the corresponding bit:
				//       i = 0  -->  0b0001
				//       i = 1  -->  0b0010
				//       i = 2  -->  0b0100
				//       i = 3  -->  0b1000
				// then the last bit should be set to 1, resulting in 1101 0001
				opBase = opBase | (1 << i);

				// Remove the @ from the operand
				operand.content = operand.content.substr(1);
			}

			var decoded = null;
			if (operand.content in known_jumplabels) {
				decoded = parseInt(known_jumplabels[operand.content])
			}
			else {
				decoded = parseInt(operand.content);
			}

			if(isNaN(decoded)) {
				log("Parse error: Expected int, got something ("+operand.content+") else at line " + operand.line);
				return null;
			}
			operation.push(decoded);

		}

		// Before returning, we need to insert the operator
		// in front of our list. Not very efficient, but simple.
		operation.unshift(opBase);
		return operation;
	}

	function parse(text) {
		var tokens = tokenize(text);

		if(tokens == null) {
			// Something bad happened
			return null;
		}

		// Stores addresses of known jump labels
		var jumplabels = {};
		var jumplabelsLength = 0;


		// Double-scan tokens: First for jumplabels (so we
		// can do forward-jumps), then for actual code.
		// We have to do this, because otherwise, we might
		// encounter a jump label before it's actually defined,
		// leaving us with a rather complicated situation to
		// resolve it later on.


		for (i = 0; i < tokens.length; i++) {
			var op = tokens[i];
			if (op.type == 'jumplabel') {
				// The address is not directly mapped to the token position!
				// Since jumplabels don't end up in the memory image, every
				// jump label adds another bit to the gap between the token
				// index and the memory location. We compensate this by
				// calculating the difference between number of already-known
				// jump labels and the token index.
				//
				// Note that this will likely need some rework in the future,
				// as this won't be that easy when the memory model gets more
				// complicated. But for now, it suffices.
				var addr = i - jumplabelsLength;
				jumplabelsLength++;

				jumplabels[op.content] = addr;
				log("PARSER(line "+op.line+"): Jumplabel " + op.content + ": " + addr);
			}
		}

		// Now, scan for code
		var memory = [];
		var opcode;
		while (opcode = tokens.shift()) {
			var operands = [];

			// opcode.content MUST be an operation - otherwise
			// we have a syntax error.

			if (opcode.type == 'jumplabel') {
				// already handled above
				continue;
			}
			else if(!(opcode.content in opcodeInfo)) {
				log("Syntax error on line " + opcode.line + ": Opcode unknown:" + opcode.content)
				return null;
			}
			var info = opcodeInfo[opcode.content];

			while (operands.length < info.numArgs) {
				var op = tokens.shift();
				if (op.type == 'word') {
					operands.push(op);
				}
				else if (op.type == 'jumplabel') {
					// already handled above
				}
				else {
					// Error, unknown token type!
					log("Unknown token type on line " + op.line);
					return null;
				}
			}

			// Decode operation: Operands may still contain
			// indirections(@). Note that
			// we already pass the integer form of the opcode
			// to the decode function - the name is not required
			// anymore...

			var operation = decode(info.base, operands, jumplabels);
			log("PARSER(line "+opcode.line+"): OP " + opcode.content + "<" + operation.join(", ") + ">");

			// Store decoded operation in memory
			for (var j = 0; j < operation.length; j++) {
				memory.push(operation[j]);
			}
		}

		if (memory == []) {
			// No code, or other problem
			return null;
		}

		return memory;
	}

	function tokenize(text) {

		tokens = [];

		var currentLine = 1;

		function word(match) {
			tokens.push({
				line:    currentLine,
				content: match[1],
				type:    'word'
			});
		}
		function jumplabel(match) {
			tokens.push({
				line:    currentLine,
				content: match[1],
				type:    'jumplabel'
			});
		}
		function dontCare(match) {
			// Not interested, not doing anything
		}
		function newline(match) {
			currentLine++;
		}

		// Regexes used for parsing. The parser works as
		// follows: Each of those regexps is tried on the
		// input. If one matches, the corresponding callback
		// function is called with the match result, and the
		// matching part is removed from the input. This is
		// repeated until either the string didn't change it's
		// size (which means something unknown in input), or
		// the input string is reduced to an empty string
		// (parsing done).
		var checks = [
			{ re: /^([\w\d]+):/, cb: jumplabel }, // jump label definition
			{ re: /^([@\w\d]+)/, cb: word      }, // operator, operand
			{ re: /^#[^\n]*/,    cb: dontCare  }, // a comment
			{ re: /^[\n]/,       cb: newline   }, // newline
			{ re: /^[ \t]+/,     cb: dontCare  }  // other whitespace
		]

		while (text.length > 0) {
			var lenBefore = text.length;
			for (var i = 0; i < checks.length; i++) {
				var check = checks[i];
				var match = text.match(check.re);
				if (match == null) {
					continue;
				}
				// If we reach this line, we have a match!
				check.cb(match);
				text = text.replace(check.re, '');

				break;
			}
			var lenAfter = text.length;
			if (lenAfter == lenBefore) {
				// Oops, none of our matches worked! This means syntax error
				nextFewBytes = text.substr(0, 10);
				log("Error: Unknown input near ..." + nextFewBytes + "... on line " + currentLine);

				// Return null, so caller knows something went wrong
				return null;
			}
		}

		return tokens;
	}

	return {
		parse: parse,
		okay:  function() {return okay;  },
		error: function() {return error; }
	}

}
