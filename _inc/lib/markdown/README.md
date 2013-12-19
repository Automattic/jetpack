# Markdown parsing library

Contains you two libraries:

* `/extra`
	- Gives you `MardownExtra_Parser` and `Markdown_Parser`
	- Docs at http://michelf.ca/projects/php-markdown/extra/

* `/gfm` -- Github Flavored MArkdown
	- Gives you `WPCom_GHF_Markdown_Parser`
	- It has the same interface as `MarkdownExtra_Parser`
	- Adds support for fenced code blocks: https://help.github.com/articles/github-flavored-markdown#fenced-code-blocks
	- By default it replaces them with a code shortcode
	- You can change this using the `$use_code_shortcode` member variable
	- You can change the code shortcode wrapping with `$shortcode_start` and `$shortcode_end` member variables
