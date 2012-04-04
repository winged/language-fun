(function(){

	var gui    = window.VMGUI(start, stop);
	var parser = window.PARSER(gui.log);
	var log    = gui.log; // convenience shortcut

	var stepTimer = null;

	function stop() {
		clearTimeout(stepTimer);
		log("USER: Stopped execution");
	}

	function start() {
		log("USER: Clicked start");

		log("RUNNER: Parsing");
		var program = parser.parse(gui.source);
		if (!parser.okay()) {
			log(parser.error());
			return;
		}

		log("RUNNER: Initializing VM");
		var vm = VM(
			program,
			gui.read,
			gui.write,
			gui.log
		);

		function step() {
			if(vm.step()) {
				stepTimer = setTimeout(step, 0);
			}
		}

		log("RUNNER: Starting execution");
		step();
	}
})();
