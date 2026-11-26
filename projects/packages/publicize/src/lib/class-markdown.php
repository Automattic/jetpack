<?php
/**
 * HTML to Markdown conversion.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Lib;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Converts HTML to CommonMark using the WordPress HTML API.
 *
 * Elements without a Markdown equivalent are dropped, their text is kept.
 */
class Markdown {

	/**
	 * Elements that start and end a block.
	 */
	private const BLOCK_TAGS = array( 'ADDRESS', 'ARTICLE', 'ASIDE', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'HEADER', 'MAIN', 'NAV', 'P', 'SECTION', 'SUMMARY', 'TABLE', 'TR' );

	/**
	 * Elements whose content is collected and converted when they close.
	 */
	private const FRAME_TAGS = array( 'A', 'B', 'BLOCKQUOTE', 'CODE', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'LI', 'OL', 'PRE', 'STRONG', 'UL' );

	/**
	 * Frames that are part of a line, not a block of their own.
	 */
	private const INLINE_TAGS = array( 'A', 'B', 'CODE', 'EM', 'I', 'STRONG' );

	/**
	 * The open frames, the root frame first.
	 *
	 * @var array<int, array{tag: string, buffer: string, href?: string|null, index?: int}>
	 */
	private array $frames = array(
		array(
			'tag'    => '#root',
			'buffer' => '',
		),
	);

	/**
	 * Converts HTML to Markdown.
	 *
	 * @param string $html The HTML.
	 *
	 * @return string|null The Markdown, or null if the HTML API cannot parse the HTML.
	 */
	public static function from_html( string $html ): ?string {
		$processor = \WP_HTML_Processor::create_fragment( $html );

		if ( null === $processor ) {
			return null;
		}

		$converter = new self();

		while ( $processor->next_token() ) {
			$converter->token( $processor );
		}

		if ( null !== $processor->get_last_error() ) {
			return null;
		}

		return $converter->finish();
	}

	/**
	 * Handles a token.
	 *
	 * @param \WP_HTML_Processor $processor The processor, at the token.
	 */
	private function token( \WP_HTML_Processor $processor ): void {
		$type = $processor->get_token_type();

		if ( '#text' === $type ) {
			$this->text( $processor->get_modifiable_text() );
		} elseif ( '#tag' === $type && $processor->is_tag_closer() ) {
			$this->close( (string) $processor->get_tag() );
		} elseif ( '#tag' === $type ) {
			$this->open( $processor );
		}
	}

	/**
	 * Handles an opening tag.
	 *
	 * @param \WP_HTML_Processor $processor The processor, at the tag.
	 */
	private function open( \WP_HTML_Processor $processor ): void {
		// Code is literal, only its text and line breaks count.
		if ( $this->inside( 'PRE' ) || $this->inside( 'CODE' ) ) {
			if ( 'BR' === $processor->get_tag() ) {
				$this->append( $this->inside( 'PRE' ) ? "\n" : ' ' );
			}

			return;
		}

		$tag = (string) $processor->get_tag();

		if ( in_array( $tag, self::BLOCK_TAGS, true ) ) {
			$this->break_block();
			return;
		}

		if ( in_array( $tag, self::FRAME_TAGS, true ) ) {
			if ( ! in_array( $tag, self::INLINE_TAGS, true ) ) {
				$this->break_block();
			}

			$frame = array(
				'tag'    => $tag,
				'buffer' => '',
			);

			if ( 'A' === $tag ) {
				$href          = $processor->get_attribute( 'href' );
				$frame['href'] = is_string( $href ) && self::is_safe_url( $href ) ? trim( $href ) : null;
			} elseif ( 'OL' === $tag ) {
				// CommonMark list markers have at most nine digits.
				$start          = $processor->get_attribute( 'start' );
				$frame['index'] = is_string( $start ) && preg_match( '/^\d{1,9}$/', trim( $start ) ) ? (int) $start : 1;
			}

			$this->frames[] = $frame;
			return;
		}

		switch ( $tag ) {
			case 'BR':
				$this->append( "\\\n" );
				break;
			case 'HR':
				$this->block( '---' );
				break;
			case 'IMG':
				$this->append( $this->image( $processor ) );
				break;
			case 'TD':
			case 'TH':
				if ( ! $this->at_line_start() ) {
					$this->append( ' ' );
				}
				break;
		}
	}

	/**
	 * Handles a closing tag.
	 *
	 * @param string $tag The tag name.
	 */
	private function close( string $tag ): void {
		$frame = end( $this->frames );

		if ( in_array( $tag, self::BLOCK_TAGS, true ) && ! $this->inside( 'PRE' ) && ! $this->inside( 'CODE' ) ) {
			$this->break_block();
			return;
		}

		// Nested elements inside code have no frame.
		if ( $frame['tag'] !== $tag ) {
			return;
		}

		array_pop( $this->frames );
		$content = $frame['buffer'];

		switch ( $tag ) {
			case 'B':
			case 'STRONG':
				$this->append( self::wrap( $content, '**' ) );
				break;
			case 'I':
			case 'EM':
				$this->append( self::wrap( $content, '*' ) );
				break;
			case 'CODE':
				$this->append( self::code_span( $content ) );
				break;
			case 'A':
				$this->append( self::link( $content, $frame['href'] ?? null ) );
				break;
			case 'H1':
			case 'H2':
			case 'H3':
			case 'H4':
			case 'H5':
			case 'H6':
				$this->heading( (int) substr( $tag, 1 ), $content );
				break;
			case 'BLOCKQUOTE':
				$this->block( self::prefix_lines( trim( self::rtrim_breaks( $content ) ), '> ', '>' ) );
				break;
			case 'PRE':
				$this->block( self::code_block( $content ) );
				break;
			case 'LI':
				$this->list_item( $content );
				break;
			case 'UL':
			case 'OL':
				$this->block( rtrim( $content ) );
				break;
			default:
				$this->append( $content );
		}
	}

	/**
	 * Handles text.
	 *
	 * @param string $text The decoded text.
	 */
	private function text( string $text ): void {
		if ( $this->inside( 'PRE' ) ) {
			$this->append( $text );
			return;
		}

		$text       = (string) preg_replace( '/[ \t\n\r\f]+/', ' ', $text );
		$line_start = $this->at_line_start();

		if ( $line_start ) {
			$text = ltrim( $text, ' ' );
		}

		if ( '' === $text ) {
			return;
		}

		$this->append( $this->inside( 'CODE' ) ? $text : self::escape( $text, $line_start ) );
	}

	/**
	 * Returns the Markdown and resets the converter.
	 *
	 * @return string The Markdown.
	 */
	private function finish(): string {
		// The HTML API closes all elements, this only guards against surprises.
		while ( array_key_last( $this->frames ) > 0 ) {
			$this->close( end( $this->frames )['tag'] );
		}

		return trim( self::rtrim_breaks( $this->frames[0]['buffer'] ) );
	}

	/**
	 * Appends a heading.
	 *
	 * @param int    $level   The heading level.
	 * @param string $content The heading content.
	 */
	private function heading( int $level, string $content ): void {
		// A trailing "#" run would be read as the closing sequence.
		$content = (string) preg_replace( '/(^|\s)(#+)$/', '$1\\\\$2', self::single_line( $content ) );

		if ( '' !== $content ) {
			$this->block( str_repeat( '#', $level ) . ' ' . $content );
		}
	}

	/**
	 * Appends a list item to the enclosing list.
	 *
	 * @param string $content The item content.
	 */
	private function list_item( string $content ): void {
		$key    = array_key_last( $this->frames );
		$marker = '- ';

		if ( 'OL' === $this->frames[ $key ]['tag'] ) {
			$index                         = $this->frames[ $key ]['index'] ?? 1;
			$marker                        = $index . '. ';
			$this->frames[ $key ]['index'] = $index + 1;
		}

		$lines = explode( "\n", trim( self::rtrim_breaks( $content ) ) );
		$first = array_shift( $lines );
		$rest  = self::prefix_lines( implode( "\n", $lines ), str_repeat( ' ', strlen( $marker ) ), '' );

		$this->append( $marker . $first . ( $lines ? "\n" . $rest : '' ) . "\n" );
	}

	/**
	 * Builds an image.
	 *
	 * @param \WP_HTML_Processor $processor The processor, at the IMG tag.
	 *
	 * @return string The Markdown image.
	 */
	private function image( \WP_HTML_Processor $processor ): string {
		$src = $processor->get_attribute( 'src' );
		$alt = $processor->get_attribute( 'alt' );

		if ( ! is_string( $src ) || '' === trim( $src ) || ! self::is_safe_url( $src ) ) {
			return '';
		}

		$alt = is_string( $alt ) ? self::escape( trim( (string) preg_replace( '/\s+/', ' ', $alt ) ), false ) : '';

		return '![' . $alt . '](' . self::destination( $src ) . ')';
	}

	/**
	 * Appends a block, separated from its surroundings.
	 *
	 * @param string $markdown The block.
	 */
	private function block( string $markdown ): void {
		$this->break_block();
		$this->append( $markdown );
		$this->break_block();
	}

	/**
	 * Ends the current block.
	 *
	 * Blocks are separated by a blank line, but inside list items only by a
	 * line break, to keep the list tight.
	 */
	private function break_block(): void {
		$key    = array_key_last( $this->frames );
		$buffer = self::rtrim_breaks( $this->frames[ $key ]['buffer'] );

		if ( '' !== $buffer ) {
			$buffer .= in_array( $this->frames[ $key ]['tag'], array( 'LI', 'OL', 'UL' ), true ) ? "\n" : "\n\n";
		}

		$this->frames[ $key ]['buffer'] = $buffer;
	}

	/**
	 * Appends to the current frame.
	 *
	 * @param string $markdown The Markdown.
	 */
	private function append( string $markdown ): void {
		$this->frames[ array_key_last( $this->frames ) ]['buffer'] .= $markdown;
	}

	/**
	 * Whether an element is open.
	 *
	 * @param string $tag The tag name.
	 *
	 * @return bool True if inside the element.
	 */
	private function inside( string $tag ): bool {
		return in_array( $tag, array_column( $this->frames, 'tag' ), true );
	}

	/**
	 * Whether the output is at the start of a line.
	 *
	 * Inline frames continue the line of their parent.
	 *
	 * @return bool True at the start of a line.
	 */
	private function at_line_start(): bool {
		foreach ( array_reverse( $this->frames ) as $frame ) {
			if ( '' !== $frame['buffer'] ) {
				return str_ends_with( $frame['buffer'], "\n" );
			}

			if ( ! in_array( $frame['tag'], self::INLINE_TAGS, true ) ) {
				return true;
			}
		}

		return true;
	}

	/**
	 * Escapes Markdown syntax in text.
	 *
	 * @param string $text       The text.
	 * @param bool   $line_start Whether the text starts a line.
	 *
	 * @return string The escaped text.
	 */
	private static function escape( string $text, bool $line_start ): string {
		$text = (string) preg_replace( '/[\\\\`*_\[\]<]/', '\\\\$0', $text );

		// Text that looks like a character reference, e.g. "&copy;".
		$text = (string) preg_replace( '/&(?=#?[A-Za-z0-9]+;)/', '\\\\&', $text );

		if ( $line_start ) {
			// Headings, quotes, bullets, fences, thematic breaks, setext underlines and ordered list markers.
			$text = (string) preg_replace( '/^(?:(?:#{1,6}|[+-])(?=\s|$)|>|~{3}|=+\s*$|-+\s*$)/', '\\\\$0', $text );
			$text = (string) preg_replace( '/^(\d+)([.)])(?=\s|$)/', '$1\\\\$2', $text );
		}

		return $text;
	}

	/**
	 * Wraps content in an emphasis marker, keeping surrounding whitespace outside.
	 *
	 * @param string $content The content.
	 * @param string $marker  The marker.
	 *
	 * @return string The emphasized content.
	 */
	private static function wrap( string $content, string $marker ): string {
		if ( ! preg_match( '/^(\s*)(.*?)(\s*)$/s', $content, $parts ) || '' === $parts[2] ) {
			return $content;
		}

		return $parts[1] . $marker . $parts[2] . $marker . $parts[3];
	}

	/**
	 * Joins lines, hard line breaks become spaces.
	 *
	 * @param string $markdown The Markdown.
	 *
	 * @return string The single line.
	 */
	private static function single_line( string $markdown ): string {
		return trim( (string) preg_replace( '/\s*\\\\?\n\s*/', ' ', $markdown ) );
	}

	/**
	 * Removes trailing whitespace and hard line breaks.
	 *
	 * A trailing hard line break would be a literal backslash.
	 *
	 * @param string $markdown The Markdown.
	 *
	 * @return string The trimmed Markdown.
	 */
	private static function rtrim_breaks( string $markdown ): string {
		$markdown = (string) preg_replace( '/(?:\\\\\n)+$/', '', rtrim( $markdown, " \t" ) );

		return rtrim( $markdown, "\n" );
	}

	/**
	 * Builds a link.
	 *
	 * @param string      $content The link text.
	 * @param string|null $href    The link target.
	 *
	 * @return string The Markdown link.
	 */
	private static function link( string $content, ?string $href ): string {
		if ( null === $href || '' === $href || str_starts_with( $href, '#' ) ) {
			return $content;
		}

		$text = self::single_line( $content );

		if ( '' === $text ) {
			$text = self::escape( $href, false );
		}

		return '[' . $text . '](' . self::destination( $href ) . ')';
	}

	/**
	 * Whether a URL uses an allowed protocol, e.g. not "javascript:".
	 *
	 * @param string $url The URL.
	 *
	 * @return bool True if the URL is safe.
	 */
	private static function is_safe_url( string $url ): bool {
		return wp_kses_bad_protocol( $url, wp_allowed_protocols() ) === $url;
	}

	/**
	 * Formats a link destination, using the angle bracket form when needed.
	 *
	 * @param string $url The URL.
	 *
	 * @return string The link destination.
	 */
	private static function destination( string $url ): string {
		$url = trim( $url );

		if ( ! preg_match( '/[\s()<>]/', $url ) ) {
			return $url;
		}

		return '<' . str_replace( array( '<', '>', "\n", "\r" ), array( '%3C', '%3E', '', '' ), $url ) . '>';
	}

	/**
	 * Builds an inline code span.
	 *
	 * @param string $content The code.
	 *
	 * @return string The code span.
	 */
	private static function code_span( string $content ): string {
		if ( '' === trim( $content ) ) {
			return $content;
		}

		$fence   = str_repeat( '`', self::longest_backtick_run( $content ) + 1 );
		$padding = str_starts_with( $content, '`' ) || str_ends_with( $content, '`' ) ? ' ' : '';

		return $fence . $padding . $content . $padding . $fence;
	}

	/**
	 * Builds a fenced code block.
	 *
	 * @param string $content The code.
	 *
	 * @return string The code block.
	 */
	private static function code_block( string $content ): string {
		$fence = str_repeat( '`', max( 3, self::longest_backtick_run( $content ) + 1 ) );

		return $fence . "\n" . rtrim( $content, "\n" ) . "\n" . $fence;
	}

	/**
	 * The length of the longest run of backticks.
	 *
	 * @param string $content The content.
	 *
	 * @return int The length.
	 */
	private static function longest_backtick_run( string $content ): int {
		preg_match_all( '/`+/', $content, $runs );

		return $runs[0] ? max( array_map( 'strlen', $runs[0] ) ) : 0;
	}

	/**
	 * Prefixes each line.
	 *
	 * @param string $content      The content.
	 * @param string $prefix       The prefix for lines with content.
	 * @param string $empty_prefix The prefix for empty lines.
	 *
	 * @return string The prefixed content.
	 */
	private static function prefix_lines( string $content, string $prefix, string $empty_prefix ): string {
		return implode(
			"\n",
			array_map(
				static fn ( string $line ): string => '' === $line ? $empty_prefix : $prefix . $line,
				explode( "\n", $content )
			)
		);
	}
}
