#!/usr/bin/python

# Implements DVM02 in python - Tokenizer

import re

class Token(object):
	def __init__(self, line, token_type, content):
		self.line       = line
		self.token_type = token_type
		self.content    = content

	def __str__(self):
		return "Token(line=%d, token_type='%s', content='%s')" % (
			self.line,
			self.token_type,
			self.content
		)
	
	@staticmethod
	def label(line, content):
		return Token(line, 'label', content)

	@staticmethod
	def word(line, content):
		return Token(line, 'word', content)

	@staticmethod
	def error(line, content):
		return Token(line, 'error', content)


class BaseTokenizer(object):
	"""A generic tokenizer that can be constructed
	with any regex/callback combination to yield
	tokens of any type."""

	def register_event(self, regex, callback):
		self.checks.append((regex, callback))

	def __init__(self, text):
		"""Constructor. Initializes the parser with given program text"""
		self.text         = text
		self.current_line = 1

		self.checks = []

	def event_unexpected(self, data):
		return Token.error(self.current_line, data)

	def find_match(self, text):
		"""Returns a tuple containing the remaining text, and 
		a token (or None, if no token was found).
		"""
		for regex, callback in self.checks:
			match = re.match(regex, text)
			if match is not None:
				new_text = re.sub(regex, '', text)
				token = callback(*match.groups())
				return (new_text, token)

	def get_tokens(self):
		"""Yields tokens from the given text.
		
		A token is a bunch of information containing
		the line where it occurred in the input, and
		some payload data.
		"""
		text = self.text

		# Catch-all for unknown input. Simpler than the JS implementation
		# of comparing length before and after "eating away" the next token
		self.register_event(r'(.{1,5})',     self.event_unexpected)

		while len(text) > 0:
			text, token = self.find_match(text)
			if token is not None:
				yield token

class DVM02Tokenizer(BaseTokenizer):
	def __init__(self, text):
		super().__init__(text)

		# actual working thingies...
		self.register_event(r'^([\w\d]+):',  self.event_label)
		self.register_event(r'^([@\w\d]+)',  self.event_word)

		# Newline helps with debugging
		self.register_event(r'^[\n]',        self.event_newline)

		# Whitespace and comments
		self.register_event(r'^#[^\n]*',     self.event_comment)
		self.register_event(r'^[ \t]+',      self.event_whitespace)

	def event_comment(self):
		pass
	def event_label(self, data):
		return Token.label(self.current_line, data)
	def event_word(self, data):
		return Token.word(self.current_line, data)
	def event_newline(self):
		self.current_line += 1
	def event_whitespace(self):
		pass
