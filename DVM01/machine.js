window.VM = function (init_mem, fn_readchar, fn_write, log) {
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

			// JGT needs 3 params (size 4): jumptarget, op1, op2
			case 0xB:
				return 4;

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
	function op_copy(addr1, addr2) {
		log("    COPY "+addr1 + " " + addr2);
		fixaddr(addr1);
		fixaddr(addr2);
		memory[addr1] = memory[addr2];
	}
	function op_readc(addr) {
		log("    READC "+addr);
		op_set(addr, fn_readchar());
	}
	function op_writei(val) {
		log("    WRITEI "+val);
		fn_write(val.toString());
	}
	function op_writec(val) {
		log("    WRITEC "+val);
		fn_write(String.fromCharCode(val))
	}
	function op_mul(addr, val) {
		log("    MUL "+addr + " " + val);
		fixaddr(addr);
		memory[addr] = memory[addr] * val;
	}
	function op_jnz(addr, val) {
		log("    JNZ "+addr + " " + val);
		fixaddr(addr);
		if(val != 0) {
			memory[0] = addr;
		}
	}
	function op_jgt(addr, val1, val2) {
		log("    JGT "+addr + " " + val1 + ", " + val2);
		fixaddr(addr);
		if(val1 > val2) {
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
			fn_write("DUMP: addr["+i+"] = " + memory[i] + "\n")
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
			case 0x0: log("VM: "+opinfo+" NOP   "); op_nop   ();                             break;
			case 0x1: log("VM: "+opinfo+" READC "); op_readc (param(0));                     break;
			case 0x2: log("VM: "+opinfo+" WRITEC"); op_writec(param(0));                     break;
			case 0x3: log("VM: "+opinfo+" WRITEI"); op_writei(param(0));                     break;
			case 0x4: log("VM: "+opinfo+" SET   "); op_set   (param(0), param(1));           break;
			case 0x5: log("VM: "+opinfo+" ADD   "); op_add   (param(0), param(1));           break;
			case 0x6: log("VM: "+opinfo+" SUB   "); op_sub   (param(0), param(1));           break;
			case 0x7: log("VM: "+opinfo+" MUL   "); op_mul   (param(0), param(1));           break;
			case 0x8: log("VM: "+opinfo+" DIV   "); op_div   (param(0), param(1));           break;
			case 0x9: log("VM: "+opinfo+" JZ    "); op_jz    (param(0), param(1));           break;
			case 0xA: log("VM: "+opinfo+" JNZ   "); op_jnz   (param(0), param(1));           break;
			case 0xB: log("VM: "+opinfo+" JGT   "); op_jgt   (param(0), param(1), param(2)); break;
			case 0xC: log("VM: "+opinfo+" COPY  "); op_copy  (param(0), param(1));           break;
			case 0xE: log("VM: "+opinfo+" DUMP  "); op_dump  (param(0), param(1));           break;

			case 0xF: log("VM: "+opinfo+" END   "); op_end   ();                             break;
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
};
