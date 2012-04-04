window.VMGUI = function(cbStart, cbStop) {
	var source  = document.getElementById('code' ).value;
	var input   = document.getElementById('input').value;
	var inptr   = 0;

	function readChar() {
		return input[inptr++].charCodeAt(0);
	}

	var stdout  = '', outElem = document.getElementById('output');
	var stdlog  = '', logElem = document.getElementById('log'   );
	
	function writeString(str) {
		stdout += str;
		outElem.textContent = stdout;
		outElem.scrollTop = outElem.scrollHeight;
	}

	function write(value, mode) {
		if (mode == 'char') {
			writeString(String.fromCharCode(value))
		}
		else {
			writeString(value.toString());
		}
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
		cbStart();
	}
	document.getElementById('stop').onclick = function() {
		cbStop();
	}

	return {
		source: source,
		read:   readChar,
		write:  write,
		log:    log,
	};
};

