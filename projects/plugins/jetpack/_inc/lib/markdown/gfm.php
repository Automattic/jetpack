<?php
/**
 * GitHub-Flavoured Markdown. Inspired by Evan's plugin, but modified.
 *
 * @author Evan Solomon
 * @author Matt Wiebe <wiebe@automattic.com>
 * @link https://github.com/evansolomon/wp-github-flavored-markdown-comments
 *
 * Add a few extras from GitHub's Markdown implementation. Must be used in a WordPress environment.
 */

class WPCom_GHF_Markdown_Parser extends MarkdownExtra_Parser {

	/**
	 * Hooray somewhat arbitrary numbers that are fearful of 1.0.x.
	 */
	const WPCOM_GHF_MARDOWN_VERSION = '0.9.0';

	/**
	 * Use a [code] shortcode when encountering a fenced code block
	 * @var boolean
	 */
	public $use_code_shortcode = true;

	/**
	 * Preserve shortcodes, untouched by Markdown.
	 * This requires use within a WordPress installation.
	 * @var boolean
	 */
	public $preserve_shortcodes = true;

	/**
	 * Preserve the legacy $latex your-latex-code-here$ style
	 * LaTeX markup
	 */
	public $preserve_latex = true;

	/**
	 * Preserve single-line <code> blocks.
	 * @var boolean
	 */
	public $preserve_inline_code_blocks = true;

	/**
	 * Strip paragraphs from the output. This is the right default for WordPress,
	 * which generally wants to create its own paragraphs with `wpautop`
	 * @var boolean
	 */
	public $strip_paras = true;

	// Will run through sprintf - you can supply your own syntax if you want
	public $shortcode_start = '[code lang=%s]';
	public $shortcode_end   = '[/code]';

	// Stores shortcodes we remove and then replace
	protected $preserve_text_hash = array();

	/**
	 * Set environment defaults based on presence of key functions/classes.
	 */
	public function __construct() {
		$this->use_code_shortcode  = class_exists( 'SyntaxHighlighter' );
		/**
		 * Allow processing shortcode contents.
		 *
		 * @module markdown
		 *
		 * @since 4.4.0
		 *
		 * @param boolean $preserve_shortcodes Defaults to $this->preserve_shortcodes.
		 */
		$this->preserve_shortcodes = apply_filters( 'jetpack_markdown_preserve_shortcodes', $this->preserve_shortcodes ) && function_exists( 'get_shortcode_regex' );
		$this->preserve_latex      = function_exists( 'latex_markup' );
		$this->strip_paras         = function_exists( 'wpautop' );

		parent::__construct();
	}

	/**
	 * Overload to specify heading styles only if the hash has space(s) after it. This is actually in keeping with
	 * the documentation and eases the semantic overload of the hash character.
	 * #Will Not Produce a Heading 1
	 * # This Will Produce a Heading 1
	 *
	 * @param  string $text Markdown text
	 * @return string       HTML-transformed text
	 */
	public function transform( $text ) {
		// Preserve anything inside a single-line <code> element
		if ( $this->preserve_inline_code_blocks ) {
			$text = $this->single_line_code_preserve( $text );
		}
		// Remove all shortcodes so their interiors are left intact
		if ( $this->preserve_shortcodes ) {
			$text = $this->shortcode_preserve( $text );
		}
		// Remove legacy LaTeX so it's left intact
		if ( $this->preserve_latex ) {
			$text = $this->latex_preserve( $text );
		}

		// Do not process characters inside URLs.
		$text = $this->urls_preserve( $text );

		// escape line-beginning # chars that do not have a space after them.
		$text = preg_replace_callback( '|^#{1,6}( )?|um', array( $this, '_doEscapeForHashWithoutSpacing' ), $text );

		/**
		 * Allow third-party plugins to define custom patterns that won't be processed by Markdown.
		 *
		 * @module markdown
		 *
		 * @since 3.9.2
		 *
		 * @param array $custom_patterns Array of custom patterns to be ignored by Markdown.
		 */
		$custom_patterns = apply_filters( 'jetpack_markdown_preserve_pattern', array() );
		if ( is_array( $custom_patterns ) && ! empty( $custom_patterns ) ) {
			foreach ( $custom_patterns as $pattern ) {
				$text = preg_replace_callback( $pattern, array( $this, '_doRemoveText'), $text );
			}
		}

		// run through core Markdown
		$text = parent::transform( $text );

		// Occasionally Markdown Extra chokes on a para structure, producing odd paragraphs.
		$text = str_replace( "<p>&lt;</p>\n\n<p>p>", '<p>', $text );

		// put start-of-line # chars back in place
		$text = $this->restore_leading_hash( $text );

		// Strip paras if set
		if ( $this->strip_paras ) {
			$text = $this->unp( $text );
		}

		// Restore preserved things like shortcodes/LaTeX
		$text = $this->do_restore( $text );

		return $text;
	}

	/**
	 * Prevents blocks like <code>__this__</code> from turning into <code><strong>this</strong></code>
	 * @param  string $text Text that may need preserving
	 * @return string       Text that was preserved if needed
	 */
	public function single_line_code_preserve( $text ) {
		return preg_replace_callback( '|<code\b[^>]*>(.*?)</code>|', array( $this, 'do_single_line_code_preserve' ), $text );
	}

	/**
	 * Regex callback for inline code presevation
	 * @param  array $matches Regex matches
	 * @return string         Hashed content for later restoration
	 */
	public function do_single_line_code_preserve( $matches ) {
		return '<code>' . $this->hash_block( $matches[1] ) . '</code>';
	}

	/**
	 * Preserve code block contents by HTML encoding them. Useful before getting to KSES stripping.
	 * @param  string $text Markdown/HTML content
	 * @return string       Markdown/HTML content with escaped code blocks
	 */
	public function codeblock_preserve( $text ) {
		return preg_replace_callback( "/^([`~]{3})([^`\n]+)?\n([^`~]+)(\\1)/m", array( $this, 'do_codeblock_preserve' ), $text );
	}

	/**
	 * Regex callback for code block preservation.
	 * @param  array $matches Regex matches
	 * @return string         Codeblock with escaped interior
	 */
	public function do_codeblock_preserve( $matches ) {
		$block = stripslashes( $matches[3] );
		$block = esc_html( $block );
		$block = str_replace( '\\', '\\\\', $block );
		$open = $matches[1] . $matches[2] . "\n";
		return $open . $block . $matches[4];
	}

	/**
	 * Restore previously preserved (i.e. escaped) code block contents.
	 * @param  string $text Markdown/HTML content with escaped code blocks
	 * @return string       Markdown/HTML content
	 */
	public function codeblock_restore( $text ) {
		return preg_replace_callback( "/^([`~]{3})([^`\n]+)?\n([^`~]+)(\\1)/m", array( $this, 'do_codeblock_restore' ), $text );
	}

	/**
	 * Regex callback for code block restoration (unescaping).
	 * @param  array $matches Regex matches
	 * @return string         Codeblock with unescaped interior
	 */
	public function do_codeblock_restore( $matches ) {
		$block = html_entity_decode( $matches[3], ENT_QUOTES );
		$open = $matches[1] . $matches[2] . "\n";
		return $open . $block . $matches[4];
	}

	/**
	 * Called to preserve legacy LaTeX like $latex some-latex-text $
	 * @param  string $text Text in which to preserve LaTeX
	 * @return string       Text with LaTeX replaced by a hash that will be restored later
	 */
	protected function latex_preserve( $text ) {
		// regex from latex_remove()
		$regex = '%
			\$latex(?:=\s*|\s+)
			((?:
				[^$]+ # Not a dollar
			|
				(?<=(?<!\\\\)\\\\)\$ # Dollar preceded by exactly one slash
			)+)
			(?<!\\\\)\$ # Dollar preceded by zero slashes
		%ix';
		$text = preg_replace_callback( $regex, array( $this, '_doRemoveText'), $text );
		return $text;
	}

	/**
	 * Called to preserve WP shortcodes from being formatted by Markdown in any way.
	 * @param  string $text Text in which to preserve shortcodes
	 * @return string       Text with shortcodes replaced by a hash that will be restored later
	 */
	protected function shortcode_preserve( $text ) {
		$text = preg_replace_callback( $this->get_shortcode_regex(), array( $this, '_doRemoveText' ), $text );
		return $text;
	}

	/**
	 * Avoid characters inside URLs from being formatted by Markdown in any way.
	 *
	 * @param  string $text Text in which to preserve URLs.
	 *
	 * @return string Text with URLs replaced by a hash that will be restored later.
	 */
	protected function urls_preserve( $text ) {
		$text = preg_replace_callback(
			'#(?<!<)(?:https?|ftp)://([^\s<>"\[\]()]+|\[(?1)*+\]|\((?1)*+\))+(?<![_*.?])#i',
			array( $this, '_doRemoveText' ),
			$text
		);
		return $text;
	}

	/**
	 * Restores any text preserved by $this->hash_block()
	 * @param  string $text Text that may have hashed preservation placeholders
	 * @return string       Text with hashed preseravtion placeholders replaced by original text
	 */
	protected function do_restore( $text ) {
		// Reverse hashes to ensure nested blocks are restored.
		$hashes = array_reverse( $this->preserve_text_hash, true );
		foreach( $hashes as $hash => $value ) {
			$placeholder = $this->hash_maker( $hash );
			$text = str_replace( $placeholder, $value, $text );
		}
		// reset the hash
		$this->preserve_text_hash = array();
		return $text;
	}

	/**
	 * Regex callback for text preservation
	 * @param  array $m  Regex $matches array
	 * @return string    A placeholder that will later be replaced by the original text
	 */
	protected function _doRemoveText( $m ) {
		return $this->hash_block( $m[0] );
	}

	/**
	 * Call this to store a text block for later restoration.
	 * @param  string $text Text to preserve for later
	 * @return string       Placeholder that will be swapped out later for the original text
	 */
	protected function hash_block( $text ) {
		$hash = md5( $text );
		$this->preserve_text_hash[ $hash ] = $text;
		$placeholder = $this->hash_maker( $hash );
		return $placeholder;
	}

	/**
	 * Less glamorous than the Keymaker
	 * @param  string $hash An md5 hash
	 * @return string       A placeholder hash
	 */
	protected function hash_maker( $hash ) {
		return 'MARKDOWN_HASH' . $hash . 'MARKDOWN_HASH';
	}

	/**
	 * Remove bare <p> elements. <p>s with attributes will be preserved.
	 * @param  string $text HTML content
	 * @return string       <p>-less content
	 */
	public function unp( $text ) {
		return preg_replace( "#<p>(.*?)</p>(\n|$)#ums", '$1$2', $text );
	}

	/**
	 * A regex of all shortcodes currently registered by the current
	 * WordPress installation
	 * @uses   get_shortcode_regex()
	 * @return string A regex for grabbing shortcodes.
	 */
	protected function get_shortcode_regex() {
		$pattern = get_shortcode_regex();

		// don't match markdown link anchors that could be mistaken for shortcodes.
		$pattern .= '(?!\()';

		return "/$pattern/s";
	}

	/**
	 * Since we escape unspaced #Headings, put things back later.
	 * @param  string $text text with a leading escaped hash
	 * @return string       text with leading hashes unescaped
	 */
	protected function restore_leading_hash( $text ) {
		return preg_replace( "/^(<p>)?(&#35;|\\\\#)/um", "$1#", $text );
	}

	/**
	 * Overload to support ```-fenced code blocks for pre-Markdown Extra 1.2.8
	 * https://help.github.com/articles/github-flavored-markdown#fenced-code-blocks
	 */
	public function doFencedCodeBlocks( $text ) {
		// If we're at least at 1.2.8, native fenced code blocks are in.
		// Below is just copied from it in case we somehow got loaded on
		// top of someone else's Markdown Extra
		if ( version_compare( MARKDOWNEXTRA_VERSION, '1.2.8', '>=' ) )
			return parent::doFencedCodeBlocks( $text );

		#
		# Adding the fenced code block syntax to regular Markdown:
		#
		# ~~~
		# Code block
		# ~~~
		#
		$less_than_tab = $this->tab_width;

		$text = preg_replace_callback('{
				(?:\n|\A)
				# 1: Opening marker
				(
					(?:~{3,}|`{3,}) # 3 or more tildes/backticks.
				)
				[ ]*
				(?:
					\.?([-_:a-zA-Z0-9]+) # 2: standalone class name
				|
					'.$this->id_class_attr_catch_re.' # 3: Extra attributes
				)?
				[ ]* \n # Whitespace and newline following marker.

				# 4: Content
				(
					(?>
						(?!\1 [ ]* \n)	# Not a closing marker.
						.*\n+
					)+
				)

				# Closing marker.
				\1 [ ]* (?= \n )
			}xm',
			array($this, '_doFencedCodeBlocks_callback'), $text);

		return $text;
	}

	/**
	 * Callback for pre-processing start of line hashes to slyly escape headings that don't
	 * have a leading space
	 * @param  array $m  preg_match matches
	 * @return string    possibly escaped start of line hash
	 */
	public function _doEscapeForHashWithoutSpacing( $m ) {
		if ( ! isset( $m[1] ) )
			$m[0] = '\\' . $m[0];
		return $m[0];
	}

	/**
	 * Overload to support Viper's [code] shortcode. Because awesome.
	 */
	public function _doFencedCodeBlocks_callback( $matches ) {
		// in case we have some escaped leading hashes right at the start of the block
		$matches[4] = $this->restore_leading_hash( $matches[4] );
		// just MarkdownExtra_Parser if we're not going ultra-deluxe
		if ( ! $this->use_code_shortcode ) {
			return parent::_doFencedCodeBlocks_callback( $matches );
		}

		// default to a "text" class if one wasn't passed. Helps with encoding issues later.
		if ( empty( $matches[2] ) ) {
			$matches[2] = 'text';
		}

		$classname =& $matches[2];
		$codeblock = preg_replace_callback('/^\n+/', array( $this, '_doFencedCodeBlocks_newlines' ), $matches[4] );

		if ( $classname[0] == '.' )
			$classname = substr( $classname, 1 );

		$codeblock = esc_html( $codeblock );
		$codeblock = sprintf( $this->shortcode_start, $classname ) . "\n{$codeblock}" . $this->shortcode_end;
		return "\n\n" . $this->hashBlock( $codeblock ). "\n\n";
	}

}
