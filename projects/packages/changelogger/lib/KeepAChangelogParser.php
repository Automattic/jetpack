<?php
/**
 * Parser for a keepachangelog.com format changelog.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog;

use DateTime;
use DateTimeZone;
use InvalidArgumentException;

/**
 * Parser for a keepachangelog.com format changelog.
 */
class KeepAChangelogParser extends Parser {

	/**
	 * Bullet for changes.
	 *
	 * @var string
	 */
	private $bullet = '-';

	/**
	 * Output date format.
	 *
	 * @var string
	 */
	private $dateFormat = 'Y-m-d';

	/**
	 * String used as the date for an unreleased version.
	 *
	 * @var string
	 */
	private $unreleased = 'unreleased';

	/**
	 * If true, try to parse authors from entries.
	 *
	 * @var bool
	 */
	private $parseAuthors = false;

	/**
	 * Constructor.
	 *
	 * @param array $config Configuration.
	 *  - bullet: (string) Bullet for changes. Default '-'.
	 *  - dateFormat: (string) Date format to use in output. Default 'Y-m-d'.
	 *  - parseAuthors: (bool) Try to parse authors out of change entries. Default false.
	 *  - unreleased: (string) String used as the date for an unreleased version.
	 */
	public function __construct( array $config = array() ) {
		if ( ! empty( $config['bullet'] ) ) {
			$this->bullet = $config['bullet'];
		}
		if ( ! empty( $config['dateFormat'] ) ) {
			$this->dateFormat = $config['dateFormat'];
		}
		$this->parseAuthors = ! empty( $config['parseAuthors'] );
		if ( ! empty( $config['unreleased'] ) ) {
			$this->unreleased = $config['unreleased'];
		}
	}

	/**
	 * Test if there's a link at the end of a string.
	 *
	 * @param string $s String.
	 * @return array|null Match data.
	 */
	private function endsInLink( $s ) {
		if ( preg_match( '/^\[([^]]+)\]: *(\S+(?: +(?:"(?:[^"]|\\\\.)*"|\'(?:[^\']|\\\\.)*\'|\((?:[^()]|\\\\.)*\)))?)\s*\Z/m', $s, $m ) ) {
			return array(
				'match' => $m[0],
				'id'    => $m[1],
				'link'  => $m[2],
			);
		}
		return null;
	}

	/**
	 * Split a string in two at the first occurrence of a substring.
	 *
	 * @param string   $haystack String to split.
	 * @param string[] ...$needles Strings to split on. Earliest match in $haystack wins.
	 * @return string[] Two elements: The part before $needles and the part after, both trimmed.
	 */
	private function split( $haystack, ...$needles ) {
		$i = false;
		foreach ( $needles as $needle ) {
			$j = strpos( $haystack, $needle );
			if ( false !== $j ) {
				$i = false === $i ? $j : min( $i, $j );
			}
		}
		if ( false === $i ) {
			return array( trim( $haystack, "\n" ), '' );
		}
		return array(
			trim( substr( $haystack, 0, $i ), "\n" ),
			trim( substr( $haystack, $i ), "\n" ),
		);
	}

	/**
	 * Parse changelog data into a Changelog object.
	 *
	 * This does not handle all markdown! In particular, it makes the following assumptions:
	 *
	 * - All level-2 ATX headings with no indentation are changelog entry headings.
	 * - Changelog entry headings consist of either a bare version number or a version number as
	 *   link text with no destination or title, followed by a spaced ASCII hyphen, followed by a timestamp.
	 * - All level-3 ATX headings with no indentation are changelog entry subheadings.
	 * - All change entries are formatted as lists starting with the configured bullet followed by a space,
	 *   and do not make use of lazy continuation. Indentation of continued
	 *   lines is equal to the length of the bullet plus the space.
	 * - All link definitions come at the end of the document, with no intervening blank lines or
	 *   other content, and are not indented and do not contain newlines. Link definitions for
	 *   changelog entries have no titles.
	 *
	 * @param string $changelog Changelog contents.
	 * @return Changelog
	 * @throws InvalidArgumentException If the changelog data cannot be parsed.
	 */
	public function parse( $changelog ) {
		$ret = new Changelog();

		$bullet = $this->bullet . ' ';
		$len    = strlen( $bullet );
		$indent = str_repeat( ' ', $len );

		// Fix newlines and expand tabs.
		$changelog = strtr( $changelog, array( "\r\n" => "\n" ) );
		$changelog = strtr( $changelog, array( "\r" => "\n" ) );
		while ( strpos( $changelog, "\t" ) !== false ) {
			$changelog = preg_replace_callback(
				'/^([^\t\n]*)\t/m',
				function ( $m ) {
					return $m[1] . str_repeat( ' ', 4 - ( mb_strlen( $m[1] ) % 4 ) );
				},
				$changelog
			);
		}

		// Extract link definitions.
		$links     = array();
		$usedlinks = array();
		while ( ( $m = $this->endsInLink( $changelog ) ) ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$links[ $m['id'] ]     = $m['link'];
			$usedlinks[ $m['id'] ] = false;
			$changelog             = (string) substr( $changelog, 0, -strlen( $m['match'] ) );
		}
		$links = array_reverse( $links );

		// Everything up to the first level-2 ATX heading is the prologue.
		list( $prologue, $changelog ) = $this->split( "\n$changelog", "\n## " );
		$ret->setPrologue( $prologue );

		// Entries make up the rest of the document.
		$entries = array();
		while ( '' !== $changelog ) {
			// Extract the first entry from the changelog file, then extract the heading from it.
			list( $content, $changelog ) = $this->split( $changelog, "\n## " );
			list( $heading, $content )   = $this->split( $content, "\n" );

			// Parse the heading and create a ChangelogEntry for it.
			if ( ! preg_match( '/^## +(\[?[^] ]+\]?) - (.+?) *$/', $heading, $m ) ) {
				throw new InvalidArgumentException( "Invalid heading: $heading" );
			}
			$link      = null;
			$version   = $m[1];
			$timestamp = $m[2];
			if ( '[' === $version[0] && ']' === substr( $version, -1 ) ) {
				$version = substr( $version, 1, -1 );
				if ( ! isset( $links[ $version ] ) ) {
					throw new InvalidArgumentException( "Heading seems to have a linked version, but link was not found: $heading. Please ensure this version has a URL defined at the end of the changelog." );
				}
				$link                  = $links[ $version ];
				$usedlinks[ $version ] = true;
			}
			if ( $timestamp === $this->unreleased ) {
				$timestamp      = null;
				$entryTimestamp = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
			} else {
				try {
					$timestamp = new DateTime( $timestamp, new DateTimeZone( 'UTC' ) );
				} catch ( \Exception $ex ) {
					throw new InvalidArgumentException( "Heading has an invalid timestamp: $heading", 0, $ex );
				}
				if ( strtotime( $m[2], 0 ) !== strtotime( $m[2], 1000000000 ) ) {
					throw new InvalidArgumentException( "Heading has a relative timestamp: $heading" );
				}
				$entryTimestamp = $timestamp;
			}
			$entry     = $this->newChangelogEntry(
				$version,
				array(
					'link'      => $link,
					'timestamp' => $timestamp,
				)
			);
			$entries[] = $entry;

			// Extract the prologue, if any.
			list( $prologue, $content ) = $this->split( "\n$content", "\n### ", "\n$bullet" );
			$entry->setPrologue( $prologue );

			if ( '' === $content ) {
				// Huh, no changes.
				continue;
			}

			// Inject an empty heading if necessary so the change parsing can be more straightforward.
			if ( '#' !== $content[0] ) {
				$content = "### \n$content";
			}

			// Now parse all the subheadings and changes.
			while ( '' !== $content ) {
				list( $section, $content )    = $this->split( $content, "\n### " );
				list( $subheading, $section ) = $this->split( $section, "\n" );
				$subheading                   = trim( substr( $subheading, 4 ) );
				$changes                      = array();
				$cur                          = '';
				$section                      = explode( "\n", $section );
				while ( $section ) {
					$line   = array_shift( $section );
					$prefix = substr( $line, 0, $len );
					if ( $prefix === $bullet ) {
						$cur = trim( $cur );
						if ( '' !== $cur ) {
							$changes[] = $cur;
						}
						$cur = substr( $line, $len ) . "\n";
					} elseif ( $prefix === $indent ) {
						$cur .= substr( $line, $len ) . "\n";
					} elseif ( '' === $line ) {
						$cur .= "\n";
					} else {
						// If there are no more subsections and the rest of the lines don't contain
						// bullets, assume it's an epilogue. Otherwise, assume it's an error.
						$section = $line . "\n" . implode( "\n", $section );
						if ( '' === $content && strpos( $section, "\n$bullet" ) === false ) {
							$entry->setEpilogue( $section );
							break;
						} else {
							throw new InvalidArgumentException( "Malformatted changes list near \"$line\"" );
						}
					}
				}
				$cur = trim( $cur );
				if ( '' !== $cur ) {
					$changes[] = $cur;
				}
				foreach ( $changes as $change ) {
					$author = '';
					if ( $this->parseAuthors && preg_match( '/ \(([^()\n]+)\)$/', $change, $m ) ) {
						$author = $m[1];
						$change = substr( $change, 0, -strlen( $m[0] ) );
					}
					$entry->appendChange(
						$this->newChangeEntry(
							array(
								'subheading' => $subheading,
								'author'     => $author,
								'content'    => $change,
								'timestamp'  => $entryTimestamp,
							)
						)
					);
				}
			}
		}
		$ret->setEntries( $entries );

		// Append any unused links to the epilogue.
		$epilogue = $ret->getEpilogue();
		foreach ( $links as $id => $content ) {
			if ( empty( $usedlinks[ $id ] ) ) {
				$epilogue .= "\n[$id]: $content";
			}
		}
		$ret->setEpilogue( $epilogue );

		return $ret;
	}

	/**
	 * Write a Changelog object to a string.
	 *
	 * @param Changelog $changelog Changelog object.
	 * @return string
	 */
	public function format( Changelog $changelog ) {
		$ret = '';

		$bullet = $this->bullet . ' ';
		$indent = str_repeat( ' ', strlen( $bullet ) );

		$prologue = trim( $changelog->getPrologue() );
		if ( '' !== $prologue ) {
			$ret .= "$prologue\n\n";
		}

		$links = array();
		foreach ( $changelog->getEntries() as $entry ) {
			$ret .= '## ';
			if ( $entry->getLink() !== null ) {
				$links[ $entry->getVersion() ] = $entry->getLink();
				$ret                          .= "[{$entry->getVersion()}]";
			} else {
				$ret .= $entry->getVersion();
			}
			$timestamp = $entry->getTimestamp();
			$ret      .= ' - ' . ( null === $timestamp ? $this->unreleased : $timestamp->format( $this->dateFormat ) ) . "\n";

			$prologue = trim( $entry->getPrologue() );
			if ( '' !== $prologue ) {
				$ret .= "\n$prologue\n\n";
			}

			foreach ( $entry->getChangesBySubheading() as $heading => $changes ) {
				if ( '' !== $heading ) {
					$heading = "### $heading\n";
				} else {
					$heading = substr( $ret, -2 ) === "\n\n" ? '' : "\n";
				}
				$post = '';
				foreach ( $changes as $change ) {
					$text = trim( $change->getContent() );
					if ( '' !== $text ) {
						if ( $change->getAuthor() !== '' ) {
							$text .= " ({$change->getAuthor()})";
						}
						$ret    .= $heading . $bullet . str_replace( "\n", "\n$indent", $text ) . "\n";
						$heading = '';
						$post    = "\n";
					}
				}
				$ret .= $post;
			}

			$epilogue = trim( $entry->getEpilogue() );
			if ( '' !== $epilogue ) {
				$ret = trim( $ret ) . "\n\n$epilogue\n";
			}
			$ret = trim( $ret ) . "\n\n";
		}

		$epilogue = trim( $changelog->getEpilogue() );
		if ( '' !== $epilogue ) {
			$ret .= "$epilogue\n";
		}

		$ret = trim( $ret ) . "\n";

		if ( $links ) {
			if ( ! $this->endsInLink( $ret ) ) {
				$ret .= "\n";
			}
			foreach ( $links as $k => $v ) {
				$ret .= "[$k]: $v\n";
			}
		}

		return $ret;
	}

}
