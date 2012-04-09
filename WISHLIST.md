Wishlist for futher DVM implementations
=======================================


This is a wishlist of things that I want to have in future iterations of
the DVM virtual machine. As each implementation progresses, I hope to write
down more and more features and ideas on how to implement them.

Wishlist for DVM02
------------------

The following are the (missing) features whose absence hurt most in DVM01.
They're not in any particular order, and if they end up being too many,
maybe they'll have to be deferred until DVM03.

* A stack, as well as simple subroutine / function calls
* Parsing integers from STDIN
* Non-conditional JMP that is not a hack (Possible with abusing @0 in DVM01)
* Named jump labels
* Data sections
* Registers (?)
