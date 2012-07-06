Dave's VM - Try 01
==================

VM Features
-----------

* No functions
* No variables (addresses only)
* No registers - you can use a NOP slide at the beginning of the program to free some well-defined space. Then you can use that to simulate registers
* One address space
* Program counter is directly modifiable (stored at address 0)
* IO: only stdin/stdout available, very simplified: You can write (unicode) characters or integers, and read unicode characters. Internal representation is always as an integer.
* Only datatype: integer
* Variable-length opcodes
* Operands can be indirect or direct. Indirect uses the address that OP
  points to, direct uses OP literally (either as address or value).
    * SET     80     5      # set address 80 to value 5
    * WRITEI  @80           # output integer stored at address 80

  In other words: if a value is prefixes with an @, it is interpreted as
  an address, and the value at this address is used. This also works for
  non-addr operands, as can be seen by the following examples:

    * JZ 0    0      # always jumps to addr 0 (restart program).
    * JZ 0    @0     # Jump to addr 0 if value at that addr is 0

Opcodes
-------

* START                  Your program needs to start with this. It's actually
                         just an alias for NOP. However, you really need this to
                         make space for the program counter.
* NOP                    Doesn't do anything.
* READC   addr           Read character from stdin, storing it's integer (unicode) value at addr
* WRITEC  addr           Writes integer at addr as an unicode character to stdout
* WRITEI  addr           Writes integer at addr in decimal representation to stdout
* SET     addr  n        Sets value at given addr to value n
* ADD     addr  n        Adds value n to value at addr
* SUB     addr  n        Subtracts value n from value at addr
* MUL     addr  n        Multiplies value at addr by n
* DIV     addr  n        divides value at addr by n
* JZ      addr  n        Jumps to opcode at addr if n is zero
* JNZ     addr  n        Jumps to opcode at addr if n is not zero
* JGT     addr  n1 n2    Jumps to opcode at addr if n1 is greater than n2.
* COPY    addr1 addr2    Writes content of addr2 to addr1 (Use this to de-reference pointers)
* DUMP    addr1 addr2    Dumps the memory area between addr1 and addr2 (Useful for debugging)
* END                    Exits the program

