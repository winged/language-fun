Plans for DVM02
===============

* Keep the VM part of DVM01 exactly the same
* Extend the compiler to support aliases / named jump labels (DONE)
   * Update sample-eratosthenes.txt (TODO)
   * Update sample-fibonacci.txt (DONE)
   * Update sample-stack.txt     (DONE)
* Extend the compiler to support definition and execution
  of macros.
* Provide a runtime collection of macros:
   * Stack management:
      - Push
      - Pop
   * Rudimentary Subroutine utilities
      - Helpers for defining subroutines
      - Calling
      - Returning


Jump labels
-----------

Jump labels are named labels that specify the address that they're
at. They can then be used just like numbers - of course, this is most
useful in jump instructions, but can be used for other things as well.

Here's an example on how to define a jump label: You just "invent" a
word and append a colon to it, like follows:

    increment_reg1:
    ADD 1 1

Afterwards, you can use that label in a jump, for example:

    JNZ increment_reg1  1

Of course, you can also use it to name memory locations (which we
sometimes called registers):

    program_counter: START
    stack_operand:   NOP
    stack_pointer:   NOP

Which can then be used in operations, instead of the fixed number:

    ADD stack_pointer 1

This should lead to much, much more readable code.

Macros
------

A macro definition is just a set of instructions that can be
grouped together, possibly with parameters. I'm thinking about
some syntax like follows (See [sample-stack.txt](sample-stack.txt) for
implementation details of this example):

    !MACRO 1 PUSH      # 1 for one-parameter macro
        SET  1   *A    # *A is the first parameter replacement
        SET  2   @0
        JNZ @3    1
    !ENDMACRO

When used in the code, it would then look like this:

    NOP  # some code..
    !PUSH  17   # Push value 17 onto stack

This would be expanded by the compiler to the following instructions:

    SET  1   17    # First param of macro
    SET  2   @0    # Return address
    JNZ @3    1    # Actually call PUSH code


Subroutines
-----------

I have no concrete idea for how subroutines should work, yet.
A simple idea would be to provide a few helper macros:

* A macro for spacing out a big piece of memory, so you can
  JNZ to some space below your subroutine in an initializer
* A macro for registering a function at a well-known address
* A macro for calling a function, using the stack
* A macro for returning from a function, using the stack
