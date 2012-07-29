#!/usr/bin/python

# Tests the parser's functionality.

import parser
import tokenizer

inputdata = open('../samples/eratosthenes.txt', 'r').read()


tokens = tokenizer.DVM02Tokenizer(inputdata).get_tokens()

# Testing tokenizer: print all tokens
# for t in tokens:
# 	print(t)

# Testing parser: print all operations
the_parser = parser.Parser(tokens)
for o in the_parser.get_operations():
	print(o)

