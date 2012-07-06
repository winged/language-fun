Plans for DVM02
===============

* Keep the VM part of DVM01 exactly the same
* Extend the compiler to support aliases / named jump labels
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
