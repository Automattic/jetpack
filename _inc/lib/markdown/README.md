# Markdown parsing library

Contains you two libraries:

* `/extra`
	- Gives you `MardownExtra_Parser` and `Markdown_Parser`
	- Docs at http://michelf.ca/projects/php-markdown/extra/

* `/gfm` -- Github Flavored MArkdown
	- Gives you `WPCom_GHF_Markdown_Parser`
	- It has the same interface as `MarkdownExtra_Parser`
	- Adds support for fenced code blocks: https://help.github.com/articles/github-flavored-markdown#fenced-code-blocks
	- By default it replaces them with a sourcecode shortcode
	- You can change this using the `$use_sourcecode_shortcode` member variable
