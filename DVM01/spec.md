Dave's VM - Try 01
==================
VM Features
-----------
* No functions
* No variables (addresses only)
* No registers - you can use a NOP slide at the beginning of the program to free some well-defined space. Then you can use that to simulate registers
* One address space
* Program counter is directly modifiable (stored at address 0)
* IO: only stdin/stdout available
* Only datatype: integer
* Variable-length opcodes
* Operands can be indirect or direct. Indirect uses the address that OP
  points to, direct uses OP literally (either as address or value).
    * READ @30   10      # reads 10 bytes to location that addr 30 points to
    * READ  30   10      # reads 10 bytes to addresses 30..39
  In other words: if a value is prefixes with an @, it is interpreted as
  an address, and the value at this address is used. This also works for
  non-addr operands, as can be seen by the following examples:
    * JZ 0    0      # always jumps to addr 0 (restart program).
    * JZ 0    @0     # Jump to addr 0 if value at that addr is 0
* Special address notation: +/- can be used to specify offset to current program counter
  (Note to self: How about we use address 0 for the program counter? Then manipulation
   could be done in a more generic way...)
Opcodes
-------
* START                  Your program needs to start with this. It's actually just an alias for NOP.
* NOP                    Doesn't do anything.
* READC   addr           Read character from stdin, storing it's integer (unicode) value at addr
* WRITEC  addr           Writes integer at addr as an unicode character to stdout
* WRITEI  addr           Writes integer at addr in decimal representation to stdout
* SET     addr  n        Sets byte at given addr to value n
* ADD     addr  n        Adds value n to value at addr
* SUB     addr  n        Subtracts value n from value at addr
* MUL     addr  n        Multiplies value at addr by n
* DIV     addr  n        divides value at addr by n
* JZ      addr  n        Jumps to opcode at addr if n is zero
* JNZ     addr  n        Jumps to opcode at addr if n is not zero
* JGT     addr  n1 n2    Jumps to opcode at addr if n1 is greater than n2.
* COPY    addr1 addr2    Writes content of addr2 to addr1 (de-reference pointer)
* DUMP    addr1 addr2    Dumps the memory area between addr1 and addr2
* END                    Exits the program
Opcode macro ideas
------------------
Following "macros" show how to handle abstract data types. Maybe some kind
of pre-processing could allow some interpolation
Stack
.....
* Stack allows pushing values on top, popping them off again, and inspecting
  the top value.
* Data structure:
           +------------------+
           | Current size     |
           | Item 0           |
           | Item 1           |
           | ...              |
           | Item n           |
           +------------------+
* INITSTACK $STACK $TOP
     SET $STACK      1
     SET 0           $STACK
     ADD 0           1
     SET @0          $TOP
* PUSH $STACK $VALUE
     ADD $STACK      1         # increase stack size
     SET 0           $STACK    # set addr 0 to stack address
     ADD 0           @$STACK   # add stack size to value at addr 0
     SET @0          $VALUE    # store value at new location
* POP $STACK $DEST
     SET 0           $STACK    # set addr 0 to stack address
     ADD 0           @$STACK   # add stack size to value at addr 0
     SET $DEST       @0        # Copy value from top of stack to $DEST
     SUB $STACK 1

