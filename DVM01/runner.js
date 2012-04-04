(function(){

	// Initialize GUI. Pass callbacks for starting and stopping.
	var gui    = window.VMGUI(start, stop);

	// Initialize parser. Pass log callback from GUI, so parser can
	// inform user about stuff that happens
	var parser = window.PARSER(gui.log);

	// convenience shortcut
	var log    = gui.log;

	// We want to be able to stop execution. So this is going to 
	// contain a setTimeout() thingy when running
	var stepTimer = null;

	// Cancel running of next step
	function stop() {
		clearTimeout(stepTimer);
	}

	// Parse source from GUI, initialize VM, start execution
	function start() {
		// go back to beginning of input
		gui.rewind();

		log("RUNNER: Parsing");
		var program = parser.parse(gui.source());
		if (!parser.okay()) {
			// Error already logged by parser
			return;
		}

		log("RUNNER: Initializing VM");
		var vm = VM(
			program,
			gui.read,
			gui.write,
			gui.log
		);

		// execute one step, then set timer for the next one.
		// If vm.step() returns false, the program ended.
		function step() {
			if(vm.step()) {
				stepTimer = setTimeout(step, 0);
			}
		}

		log("RUNNER: Starting execution");
		step();
	}
})();
