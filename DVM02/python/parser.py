#!/usr/bin/python

# Implements DVM02 in python - Parser

def class_from_name(name):
	"Returns the class identified with the given name"

	return globals()[name]

def Operand(object):
	"""Represents a single operand.
	
	Stores whether it's direct or indirect.
	"""

	def __init__(self, content, is_indirect):
		self.content     = content
		self.is_indirect = is_indirect

	def __str__(self):
		return "Operand(content=%d, is_indirect=%s)" % (
			self.content,
			self.is_indirect
		)
	
def NewOperation(operator, rest_tokens):
	class_name = 'Operation%s' % operator.content.upper()
	cls = class_from_name(class_name)

	op = cls()
	for x in range(0, cls.args):
		operand_text = next(tokens)
		is_indirect = False
		if operand_text[0] == '@':
			is_indirect = True
			operand_text = operand_text[1:]
		op.operands.push(Operand(int(operand_text), is_indirect))


class BaseOperation(object):
	"""Represents an unencoded operation."""

	def __init__(self):
		self.operands = []

	def encode_op(self):

		# real_op is opcode shifted left by 4 places, so 
		# it's actually (in binary): xxxx 0000. The zeroes
		# are indicators for indirect or direct parameters
		# (1 is indirect)
		real_op = self.__class__.code << 4

		for offset, operand in zip(range(0,4), self.operands):
			if operand.is_indirect:
				real_op = real_op | (1 << offset)

		return real_op

	def get_encoded(self):
		yield self.encode_op()
		for operand in self.operands:
			yield operand.content

	def __str__(self):

		return "%s(%s)" % (
			self.__class__.__name__,
			", ".join(self.operands)
		)

class OperationNOP(BaseOperation):
	code = 0x0
	args = 0
class OperationSTART(OperationNOP):
	pass
class OperationREADC(BaseOperation):
	code = 0x1
	args = 1
class OperationWRITEC(BaseOperation):
	code = 0x2
	args = 1
class OperationWRITEI(BaseOperation):
	code = 0x3
	args = 1
class OperationSET(BaseOperation):
	code = 0x4
	args = 2
class OperationADD(BaseOperation):
	code = 0x5
	args = 2
class OperationSUB(BaseOperation):
	code = 0x6
	args = 2
class OperationMUL(BaseOperation):
	code = 0x7
	args = 2
class OperationDIV(BaseOperation):
	code = 0x8
	args = 2
class OperationJZ(BaseOperation):
	code = 0x9
	args = 2
class OperationJNZ(BaseOperation):
	code = 0xA
	args = 2
class OperationJGT(BaseOperation):
	code = 0xB
	args = 3
class OperationCOPY(BaseOperation):
	code = 0xC
	args = 2
class OperationDUMP(BaseOperation):
	code = 0xD
	args = 2
class OperationEND(BaseOperation):
	code = 0xF
	args = 0

class Parser(object):

	def __init__(self, tokens):
		"""Creates a new parser. Takes a list (or generator)
		that is expected to contain only valid tokens.

		If you're using the tokenizer module, you could do this:

		>>> tokenizer = DVM02Tokenizer(my_input)
		>>> parser    = Parser(tokenizer.get_tokens())
		
		"""

		# Trick to convert any iterable into a generator
		def loop_over(tokens):
			for t in tokens:
				yield t
		self.tokens = loop_over(tokens)
	
	def get_operations(self):
		"""Yields operations"""

		try:
			operator = next(self.tokens)
			if operator.token_type == 'word':
				yield NewOperation(operator, self.tokens)
			else:
				# TODO: store location for label
				pass
		except StopIteration:
			return
