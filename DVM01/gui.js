window.VMGUI = function(cbStart, cbStop) {
	var input   = document.getElementById('input').value;
	var inptr   = 0;

	function readChar() {
		if (inptr >= input.length) {
			return 0;
		}
		var ret = input[inptr].charCodeAt(0);
		inptr += 1;
		return ret;
	}

	var stdout  = '', outElem = document.getElementById('output');
	var stdlog  = '', logElem = document.getElementById('log'   );
	
	function writeString(str) {
		stdout += str;
		outElem.textContent = stdout;
		outElem.scrollTop = outElem.scrollHeight;
	}

	var logEnabled = true;
	function log(str) {
		if(logEnabled) {
			stdlog += str + "\n";
			logElem.textContent = stdlog;
			logElem.scrollTop = logElem.scrollHeight;
		}
	}

	document.getElementById('logtoggle').onclick = function() {
		logEnabled = !logEnabled;

		if(logEnabled) {
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
		cbStart();
	}
	document.getElementById('stop').onclick = function() {
		log("USER: Stopped execution");
		cbStop();
	}

	function getSource() {
		return document.getElementById('code' ).value;
	}
	function resetInput() {
		input = document.getElementById('input').value;
		inptr = 0;
	}

	return {
		source: getSource,
		rewind: resetInput,
		read:   readChar,
		write:  writeString,
		log:    log,
	};
};

