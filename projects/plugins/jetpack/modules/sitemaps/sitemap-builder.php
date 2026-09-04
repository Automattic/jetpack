<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Build the sitemap tree.
 *
 * @package automattic/jetpack
 * @since 4.8.0
 * @author Automattic
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/* Include sitemap subclasses, if not already, and include proper buffer based on phpxml's availability. */
require_once __DIR__ . '/sitemap-constants.php';
require_once __DIR__ . '/sitemap-buffer.php';

if ( ! class_exists( 'DOMDocument' ) ) {
	require_once __DIR__ . '/sitemap-buffer-fallback.php';
	require_once __DIR__ . '/sitemap-buffer-image-fallback.php';
	require_once __DIR__ . '/sitemap-buffer-master-fallback.php';
	require_once __DIR__ . '/sitemap-buffer-news-fallback.php';
	require_once __DIR__ . '/sitemap-buffer-page-fallback.php';
	require_once __DIR__ . '/sitemap-buffer-video-fallback.php';
} else {
	require_once __DIR__ . '/sitemap-buffer-image.php';
	require_once __DIR__ . '/sitemap-buffer-master.php';
	require_once __DIR__ . '/sitemap-buffer-news.php';
	require_once __DIR__ . '/sitemap-buffer-page.php';
	require_once __DIR__ . '/sitemap-buffer-video.php';
}

require_once __DIR__ . '/sitemap-librarian.php';
require_once __DIR__ . '/sitemap-finder.php';
require_once __DIR__ . '/sitemap-state.php';

if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	require_once __DIR__ . '/sitemap-logger.php';
}

/**
 * Simple class for rendering an empty sitemap with a short TTL
 */
class Jetpack_Sitemap_Buffer_Empty extends Jetpack_Sitemap_Buffer {
	/**
	 * Jetpack_Sitemap_Buffer_Empty constructor.
	 */
	public function __construct() {
		parent::__construct( JP_SITEMAP_MAX_ITEMS, JP_SITEMAP_MAX_BYTES, '1970-01-01 00:00:00' );

		$this->doc->appendChild(
			$this->doc->createComment( "generator='jetpack-" . JETPACK__VERSION . "'" )
		);

		$this->doc->appendChild(
			$this->doc->createComment( 'Jetpack_Sitemap_Buffer_Empty' )
		);

		$this->doc->appendChild(
			$this->doc->createProcessingInstruction(
				'xml-stylesheet',
				'type="text/xsl" href="' . $this->finder->construct_sitemap_url( 'sitemap-index.xsl' ) . '"'
			)
		);
	}

	/**
	 * Returns a DOM element for an empty sitemap.
	 */
	protected function get_root_element() {
		if ( ! isset( $this->root ) ) {
			$this->root = $this->doc->createElement( 'sitemapindex' );
			$this->root->setAttribute( 'xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9' );
			$this->doc->appendChild( $this->root );
			$this->byte_capacity -= strlen( $this->doc->saveXML( $this->root ) );
		}

		return $this->root;
	}
}

/**
 * The Jetpack_Sitemap_Builder object handles the construction of
 * all sitemap files (except the XSL files, which are handled by
 * Jetpack_Sitemap_Stylist.) Other than the constructor, there are
 * only two public functions: build_all_sitemaps and news_sitemap_xml.
 *
 * @since 4.8.0
 */
class Jetpack_Sitemap_Builder { // phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound,Generic.Classes.OpeningBraceSameLine.ContentAfterBrace

	/**
	 * Returned by the master sitemap builders when the entries do not fit in one
	 * buffer, so the flat listing has to give way to the nested indexes.
	 *
	 * @since 16.2
	 */
	const MASTER_OVERFLOW = 'overflow';

	/**
	 * Returned by the master sitemap builders when a sitemap file they would link
	 * is missing, so any master built now would reach fewer URLs than the last one.
	 *
	 * @since 16.2
	 */
	const MASTER_INCOMPLETE = 'incomplete';

	/**
	 * Librarian object for storing and retrieving sitemap data.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var $librarian Jetpack_Sitemap_Librarian
	 */
	private $librarian;

	/**
	 * Logger object for reporting debug messages.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var $logger Jetpack_Sitemap_Logger
	 */
	private $logger = false;

	/**
	 * Finder object for dealing with sitemap URIs.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var $finder Jetpack_Sitemap_Finder
	 */
	private $finder;

	/**
	 * Construct a new Jetpack_Sitemap_Builder object.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function __construct() {
		$this->librarian = new Jetpack_Sitemap_Librarian();
		$this->finder    = new Jetpack_Sitemap_Finder();

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$this->logger = new Jetpack_Sitemap_Logger();
		}

		update_option(
			'jetpack_sitemap_post_types',
			/**
			 * The array of post types to be included in the sitemap.
			 *
			 * Add your custom post type name to the array to have posts of
			 * that type included in the sitemap. The default array includes
			 * 'page' and 'post'.
			 *
			 * The result of this filter is cached in an option, 'jetpack_sitemap_post_types',
			 * so this filter only has to be applied once per generation.
			 *
			 * @since 4.8.0
			 */
			apply_filters(
				'jetpack_sitemap_post_types',
				array( 'post', 'page' )
			)
		);
	}

	/**
	 * Update the sitemap.
	 *
	 * All we do here is call build_next_sitemap_file a bunch of times.
	 *
	 * @since 4.8.0
	 */
	public function update_sitemap() {
		if ( $this->logger ) {
			$this->logger->report( '-- Updating...' );
			if ( ! class_exists( 'DOMDocument' ) ) {
				$this->logger->report(
					__(
						'Jetpack cannot load necessary XML manipulation libraries. Please ask your hosting provider to refer to our server requirements at https://jetpack.com/support/server-requirements/ .',
						'jetpack'
					),
					true
				);
			}
		}

		/**
		 * Filters whether to suspend cache addition for the entire sitemap generation.
		 *
		 * @since 15.0
		 *
		 * @param bool|null $suspend_addition Whether to suspend cache addition. Defaults to null.
		 * @return bool|null Whether to suspend cache addition.
		 */
		$suspend_addition = apply_filters( 'jetpack_sitemap_suspend_cache_addition', null );

		// Cache the previous state in case something else changed it.
		$prev_suspend_addition = wp_suspend_cache_addition();

		wp_suspend_cache_addition( $suspend_addition );

		for ( $i = 1; $i <= JP_SITEMAP_UPDATE_SIZE; $i++ ) {
			if ( true === $this->build_next_sitemap_file() ) {
				break; // All finished!
			}
		}

		// Restore previous state.
		wp_suspend_cache_addition( $prev_suspend_addition );

		if ( $this->logger ) {
			$this->logger->report( '-- ...done for now.' );
			$this->logger->time();
		}
	}

	/**
	 * Generate the next sitemap file.
	 *
	 * Reads the most recent state of the sitemap generation phase,
	 * constructs the next file, and updates the state.
	 *
	 * @since 4.8.0
	 *
	 * @return bool True when finished.
	 */
	private function build_next_sitemap_file() {
		$finished = false; // Initialize finished flag.

		// Get the most recent state, and lock the state.
		$state = Jetpack_Sitemap_State::check_out();

		// Do nothing if the state was locked.
		if ( false === $state ) {
			return false;
		}

		// Otherwise, branch on the sitemap-type key of $state.
		switch ( $state['sitemap-type'] ) {
			case JP_PAGE_SITEMAP_TYPE:
				$this->build_next_sitemap_of_type(
					JP_PAGE_SITEMAP_TYPE,
					array( $this, 'build_one_page_sitemap' ),
					$state
				);
				break;

			case JP_PAGE_SITEMAP_INDEX_TYPE:
				$this->build_next_sitemap_index_of_type(
					JP_PAGE_SITEMAP_INDEX_TYPE,
					JP_IMAGE_SITEMAP_TYPE,
					$state
				);
				break;

			case JP_IMAGE_SITEMAP_TYPE:
				$this->build_next_sitemap_of_type(
					JP_IMAGE_SITEMAP_TYPE,
					array( $this, 'build_one_image_sitemap' ),
					$state
				);
				break;

			case JP_IMAGE_SITEMAP_INDEX_TYPE:
				$this->build_next_sitemap_index_of_type(
					JP_IMAGE_SITEMAP_INDEX_TYPE,
					JP_VIDEO_SITEMAP_TYPE,
					$state
				);
				break;

			case JP_VIDEO_SITEMAP_TYPE:
				$this->build_next_sitemap_of_type(
					JP_VIDEO_SITEMAP_TYPE,
					array( $this, 'build_one_video_sitemap' ),
					$state
				);
				break;

			case JP_VIDEO_SITEMAP_INDEX_TYPE:
				$this->build_next_sitemap_index_of_type(
					JP_VIDEO_SITEMAP_INDEX_TYPE,
					JP_MASTER_SITEMAP_TYPE,
					$state
				);
				break;

			case JP_MASTER_SITEMAP_TYPE:
				$this->build_master_sitemap( $state['max'] );

				// Reset the state and quit.
				Jetpack_Sitemap_State::reset(
					JP_PAGE_SITEMAP_TYPE
				);

				if ( $this->logger ) {
					$this->logger->report( '-- Finished.' );
					$this->logger->time();
				}
				$finished = true;

				break;

			default:
				Jetpack_Sitemap_State::reset(
					JP_PAGE_SITEMAP_TYPE
				);
				$finished = true;

				break;
		} // End switch.

		// Unlock the state.
		Jetpack_Sitemap_State::unlock();

		return $finished;
	}

	/**
	 * Build the next sitemap of a given type and update the sitemap state.
	 *
	 * @since 4.8.0
	 *
	 * @param string   $sitemap_type The type of the sitemap being generated.
	 * @param callback $build_one    A callback which builds a single sitemap file.
	 * @param array    $state        A sitemap state.
	 */
	private function build_next_sitemap_of_type( $sitemap_type, $build_one, $state ) {
		$index_type = jp_sitemap_index_type_of( $sitemap_type );

		// Try to build a sitemap.
		$result = call_user_func_array(
			$build_one,
			array(
				$state['number'] + 1,
				$state['last-added'],
			)
		);

		if ( false === $result ) {
			// If no sitemap was generated, advance to the next type.
			Jetpack_Sitemap_State::check_in(
				array(
					'sitemap-type'  => $index_type,
					'last-added'    => 0,
					'number'        => 0,
					'last-modified' => '1970-01-01 00:00:00',
				)
			);

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $sitemap_type" );
			}

			// Clean up old files.
			$this->librarian->delete_numbered_sitemap_rows_after(
				$state['number'],
				$sitemap_type
			);

			return;
		}

		// Otherwise, update the state.
		Jetpack_Sitemap_State::check_in(
			array(
				'sitemap-type'  => $state['sitemap-type'],
				'last-added'    => $result['last_id'],
				'number'        => $state['number'] + 1,
				'last-modified' => $result['last_modified'],
			)
		);

		if ( true === $result['any_left'] ) {
			// If there's more work to be done with this type, return.
			return;
		}

		// Otherwise, advance state to the next sitemap type.
		Jetpack_Sitemap_State::check_in(
			array(
				'sitemap-type'  => $index_type,
				'last-added'    => 0,
				'number'        => 0,
				'last-modified' => '1970-01-01 00:00:00',
			)
		);

		if ( $this->logger ) {
			$this->logger->report( "-- Cleaning Up $sitemap_type" );
		}

		// Clean up old files.
		$this->librarian->delete_numbered_sitemap_rows_after(
			$state['number'] + 1,
			$sitemap_type
		);
	}

	/**
	 * Build the next sitemap index of a given type and update the state.
	 *
	 * @since 4.8.0
	 *
	 * @param string $index_type The type of index being generated.
	 * @param string $next_type  The next type to generate after this one.
	 * @param array  $state      A sitemap state.
	 */
	private function build_next_sitemap_index_of_type( $index_type, $next_type, $state ) {
		$sitemap_type = jp_sitemap_child_type_of( $index_type );

		$sitemap_type_exists = isset( $state['max'][ $sitemap_type ] ) && is_array( $state['max'][ $sitemap_type ] );

		// If only 0 or 1 sitemaps were built, advance to the next type and return.
		if ( $sitemap_type_exists && 1 >= $state['max'][ $sitemap_type ]['number'] ) {
			Jetpack_Sitemap_State::check_in(
				array(
					'sitemap-type'  => $next_type,
					'last-added'    => 0,
					'number'        => 0,
					'last-modified' => '1970-01-01 00:00:00',
				)
			);

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $index_type" );
			}

			// There are no indices of this type.
			$this->librarian->delete_numbered_sitemap_rows_after(
				0,
				$index_type
			);

			return;
		}

		// Otherwise, try to build a sitemap index.
		$result = $this->build_one_sitemap_index(
			$state['number'] + 1,
			$state['last-added'],
			$state['last-modified'],
			$index_type
		);

		// If no index was built, advance to the next type and return.
		if ( false === $result ) {
			Jetpack_Sitemap_State::check_in(
				array(
					'sitemap-type'  => $next_type,
					'last-added'    => 0,
					'number'        => 0,
					'last-modified' => '1970-01-01 00:00:00',
				)
			);

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $index_type" );
			}

			// Clean up old files.
			$this->librarian->delete_numbered_sitemap_rows_after(
				$state['number'],
				$index_type
			);

			return;
		}

		// Otherwise, check in the state.
		Jetpack_Sitemap_State::check_in(
			array(
				'sitemap-type'  => $index_type,
				'last-added'    => $result['last_id'],
				'number'        => $state['number'] + 1,
				'last-modified' => $result['last_modified'],
			)
		);

		// If there are still sitemaps left to index, return.
		if ( true === $result['any_left'] ) {
			return;
		}

		// Otherwise, advance to the next type.
		Jetpack_Sitemap_State::check_in(
			array(
				'sitemap-type'  => $next_type,
				'last-added'    => 0,
				'number'        => 0,
				'last-modified' => '1970-01-01 00:00:00',
			)
		);

		if ( $this->logger ) {
			$this->logger->report( "-- Cleaning Up $index_type" );
		}

		// We're done generating indices of this type.
		$this->librarian->delete_numbered_sitemap_rows_after(
			$state['number'] + 1,
			$index_type
		);
	}

	/**
	 * Builds the master sitemap index.
	 *
	 * A sitemap index file may not list other sitemap index files, so the master
	 * lists every individual sitemap file directly whenever they all fit in one
	 * buffer. They no longer fit somewhere north of a million URLs, and only then
	 * does it fall back to linking the per-type `*-sitemap-index-N.xml` files.
	 *
	 * Either way the buffer is only stored once every sitemap this generation
	 * cycle recorded is accounted for. If one is missing, the master the previous
	 * cycle stored is left in place: it reaches more URLs than anything that
	 * could be built right now.
	 *
	 * @link https://www.sitemaps.org/protocol.html#index
	 *
	 * @param array $max Array of sitemap types with max index and datetime.
	 *
	 * @since 4.8.0
	 */
	private function build_master_sitemap( $max ) {
		if ( $this->logger ) {
			$this->logger->report( '-- Building Master Sitemap.' );
		}

		$sitemap_types = array(
			JP_PAGE_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_TYPE,
			JP_VIDEO_SITEMAP_TYPE,
		);

		$buffer = $this->build_flat_master_buffer( $sitemap_types, $max );

		if ( self::MASTER_OVERFLOW === $buffer ) {
			/*
			 * Nesting is invalid and Google flags it, but a complete invalid
			 * tree beats a valid one that drops URLs, and a sitemap index
			 * cannot be paginated to make the flat layout scale further.
			 */
			$buffer = $this->build_nested_master_buffer( $sitemap_types, $max );
		}

		if ( ! is_object( $buffer ) ) {
			return;
		}

		$this->librarian->store_sitemap_data(
			0,
			JP_MASTER_SITEMAP_TYPE,
			$buffer->contents(),
			''
		);
	}

	/**
	 * Build a master sitemap buffer listing every individual sitemap file.
	 *
	 * The buffer's item and byte limits can both stop this short, and how soon
	 * the byte limit bites depends on how long this site's URLs are, so the
	 * partial buffer is discarded and MASTER_OVERFLOW returned rather than
	 * storing a master that omits sitemaps. Every type is still checked over
	 * once the buffer overflows, so a missing file is reported as
	 * MASTER_INCOMPLETE instead of sending the caller off to build a nested
	 * master out of the same broken state.
	 *
	 * @access private
	 * @since 16.2
	 *
	 * @param array $sitemap_types The sitemap types to list, in order.
	 * @param array $max           Array of sitemap types with max index and datetime.
	 *
	 * @return Jetpack_Sitemap_Buffer|Jetpack_Sitemap_Buffer_XMLWriter|string The buffer, or MASTER_OVERFLOW / MASTER_INCOMPLETE.
	 */
	private function build_flat_master_buffer( $sitemap_types, $max ) {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'master',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return self::MASTER_INCOMPLETE;
		}

		$overflowed = false;

		foreach ( $sitemap_types as $sitemap_type ) {
			$expected = $this->sitemap_count_of( $max, $sitemap_type );

			if ( $expected < 1 ) {
				continue;
			}

			$timestamps = $this->stored_sitemap_timestamps( $sitemap_type, $expected );

			if ( false === $timestamps ) {
				return self::MASTER_INCOMPLETE;
			}

			if ( $overflowed ) {
				continue;
			}

			for ( $number = 1; $number <= $expected; $number++ ) {
				$filename = jp_sitemap_filename( $sitemap_type, $number );

				if ( ! $this->append_sitemap_to_master( $buffer, $filename, $timestamps[ $filename ] ) ) {
					if ( $this->logger ) {
						$this->logger->report( '-- Master Sitemap is full; falling back to nested indexes.' );
					}

					$overflowed = true;
					break;
				}
			}
		}

		return $overflowed ? self::MASTER_OVERFLOW : $buffer;
	}

	/**
	 * Build a master sitemap buffer linking one file per sitemap type: the single
	 * sitemap when there is only one, otherwise that type's newest index file.
	 *
	 * Only used when the individual files do not all fit. The whole index chain
	 * has to be intact, because the newest index reaches the older ones only by
	 * linking back through them, so every index of a type is checked and not just
	 * the one the master names.
	 *
	 * @access private
	 * @since 16.2
	 *
	 * @param array $sitemap_types The sitemap types to list, in order.
	 * @param array $max           Array of sitemap types with max index and datetime.
	 *
	 * @return Jetpack_Sitemap_Buffer|Jetpack_Sitemap_Buffer_XMLWriter|string The buffer, or MASTER_INCOMPLETE.
	 */
	private function build_nested_master_buffer( $sitemap_types, $max ) {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'master',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return self::MASTER_INCOMPLETE;
		}

		foreach ( $sitemap_types as $sitemap_type ) {
			$expected = $this->sitemap_count_of( $max, $sitemap_type );

			if ( $expected < 1 ) {
				continue;
			}

			// The files reached through the index still have to be there.
			$timestamps = $this->stored_sitemap_timestamps( $sitemap_type, $expected );

			if ( false === $timestamps ) {
				return self::MASTER_INCOMPLETE;
			}

			$linked_type  = $sitemap_type;
			$linked_count = $expected;

			if ( 1 !== $expected ) {
				// Only a type with a single sitemap has no index to link.
				$linked_type  = jp_sitemap_index_type_of( $sitemap_type );
				$linked_count = $this->sitemap_count_of( $max, $linked_type );
				$timestamps   = $this->stored_sitemap_timestamps( $linked_type, $linked_count );

				if ( $linked_count < 1 || false === $timestamps ) {
					if ( $this->logger ) {
						$this->logger->report( "-- No usable index for $sitemap_type; keeping the previous Master Sitemap." );
					}

					return self::MASTER_INCOMPLETE;
				}
			}

			$linked_name = jp_sitemap_filename( $linked_type, $linked_count );

			if ( ! $this->append_sitemap_to_master( $buffer, $linked_name, $timestamps[ $linked_name ] ) ) {
				if ( $this->logger ) {
					$this->logger->report( "-- No room for $linked_name; keeping the previous Master Sitemap." );
				}

				return self::MASTER_INCOMPLETE;
			}
		}

		return $buffer;
	}

	/**
	 * The number of sitemap files of a type the current generation cycle recorded.
	 *
	 * @access private
	 * @since 16.2
	 *
	 * @param array  $max  Array of sitemap types with max index and datetime.
	 * @param string $type A sitemap or sitemap index type.
	 *
	 * @return int The count, or 0 if the type produced nothing.
	 */
	private function sitemap_count_of( $max, $type ) {
		return isset( $max[ $type ]['number'] ) ? (int) $max[ $type ]['number'] : 0;
	}

	/**
	 * Look up the timestamps of files 1..$count of a sitemap type, by filename.
	 *
	 * Filenames rather than row order, because a row rewritten by an interrupted
	 * cleanup no longer sorts where its number says it should.
	 *
	 * @access private
	 * @since 16.2
	 *
	 * @param string $type  A sitemap or sitemap index type.
	 * @param int    $count How many files of that type to expect.
	 *
	 * @return array|false Map of filename to timestamp, or false if any is missing.
	 */
	private function stored_sitemap_timestamps( $type, $count ) {
		$names = array();

		for ( $number = 1; $number <= $count; $number++ ) {
			$names[] = jp_sitemap_filename( $type, $number );
		}

		$timestamps = $this->librarian->query_sitemap_timestamps( $type, $names );

		foreach ( $names as $name ) {
			if ( ! isset( $timestamps[ $name ] ) ) {
				if ( $this->logger ) {
					$this->logger->report( "-- $name is missing; keeping the previous Master Sitemap." );
				}

				return false;
			}
		}

		return $timestamps;
	}

	/**
	 * Append one <sitemap> entry to a master sitemap buffer.
	 *
	 * @access private
	 * @since 16.2
	 *
	 * @param Jetpack_Sitemap_Buffer|Jetpack_Sitemap_Buffer_XMLWriter $buffer   The master sitemap buffer.
	 * @param string                                                  $filename The sitemap filename to link.
	 * @param string                                                  $lastmod  Its timestamp, in 'YYYY-MM-DD hh:mm:ss' format.
	 *
	 * @return bool Whether the entry fit.
	 */
	private function append_sitemap_to_master( $buffer, $filename, $lastmod ) {
		return true === $buffer->append(
			array(
				'sitemap' => array(
					'loc'     => $this->finder->construct_sitemap_url( $filename ),
					'lastmod' => jp_sitemap_datetime( $lastmod ),
				),
			)
		);
	}

	/**
	 * Build and store a single page sitemap. Returns false if no sitemap is built.
	 *
	 * Side effect: Create/update a sitemap row.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return bool|array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_page_sitemap( $number, $from_id ) {
		$last_post_id   = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_PAGE_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'page',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return false;
		}

		// Add entry for the main page (only if we're at the first one) and it isn't already going to be included as a page.
		if ( 1 === $number && 'page' !== get_option( 'show_on_front' ) ) {
			$item_array = array(
				'url' => array(
					'loc' => home_url( '/' ),
				),
			);

			/**
			 * Filter associative array with data to build <url> node
			 * and its descendants for site home.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param array $blog_home Data to build parent and children nodes for site home.
			 */
			$item_array = apply_filters( 'jetpack_sitemap_url_home', $item_array );

			$buffer->append( $item_array );
		}

		// Add as many items to the buffer as possible.
		while ( $last_post_id >= 0 && false === $buffer->is_full() ) {
			$posts = $this->librarian->query_posts_after_id(
				$last_post_id,
				JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->post_to_sitemap_item( $post );

				if ( true === $buffer->append( $current_item['xml'] ) ) {
					$last_post_id = $post->ID;
					$buffer->view_time( $current_item['last_modified'] );
				} else {
					break;
				}
			}
		}

		// Handle other page sitemap URLs.
		if ( ! $any_posts_left || $last_post_id < 0 ) {
			// Negative IDs are used to track URL indexes.
			$last_post_id   = min( 0, $last_post_id );
			$any_posts_left = true; // Reinitialize.

			/**
			 * Filter other page sitemap URLs.
			 *
			 * @module sitemaps
			 *
			 * @since 6.1.0
			 *
			 * @param array $urls An array of other URLs.
			 */
			$other_urls = apply_filters( 'jetpack_page_sitemap_other_urls', array() );

			if ( $other_urls ) { // Start with index [1].
				$other_urls = array_values( $other_urls );
				array_unshift( $other_urls, $other_urls[0] );
				unset( $other_urls[0] );
			}

			// Add as many items to the buffer as possible.
			while ( false === $buffer->is_full() ) {
				$last_post_id_index       = abs( $last_post_id );
				$start_from_post_id_index = $last_post_id_index ? $last_post_id_index + 1 : 0;
				$urls                     = array_slice(
					$other_urls,
					$start_from_post_id_index,
					JP_SITEMAP_BATCH_SIZE,
					true
				);

				if ( ! $urls ) {
					$any_posts_left = false;
					break;
				}

				foreach ( $urls as $index => $url ) {
					if ( ! is_array( $url ) ) {
						$url = array( 'loc' => $url );
					}
					$item = array( 'xml' => compact( 'url' ) );

					if ( true === $buffer->append( $item['xml'] ) ) {
						$last_post_id = -$index;
						if ( isset( $url['lastmod'] ) ) {
							$buffer->view_time( jp_sitemap_datetime( $url['lastmod'] ) );
						}
					} else {
						break;
					}
				}
			}
		}

		// If no items were added, return false.
		if ( true === $buffer->is_empty() ) {
			return false;
		}

		/**
		 * Filter sitemap before rendering it as XML.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 * @since 5.3.0 returns an element of DOMDocument type instead of SimpleXMLElement
		 *
		 * @param DOMDocument      $doc Data tree for sitemap.
		 * @param string           $last_modified Date of last modification.
		 */
		if ( has_filter( 'jetpack_print_sitemap' ) ) {
			apply_filters(
				'jetpack_print_sitemap',
				$buffer->get_document(),
				$buffer->last_modified()
			);
		}

		// Store the buffer as the content of a sitemap row.
		$this->librarian->store_sitemap_data(
			$number,
			JP_PAGE_SITEMAP_TYPE,
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last post ID to be
		 * successfully added and whether there are any posts left.
		 */
		return array(
			'last_id'       => $last_post_id,
			'any_left'      => $any_posts_left,
			'last_modified' => $buffer->last_modified(),
		);
	}

	/**
	 * Build and store a single image sitemap. Returns false if no sitemap is built.
	 *
	 * Side effect: Create/update an image sitemap row.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return bool|array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_image_sitemap( $number, $from_id ) {
		$last_post_id   = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_IMAGE_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'image',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return false;
		}

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_images_after_id(
				$last_post_id,
				JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->image_post_to_sitemap_item( $post );

				if ( true === $buffer->append( $current_item['xml'] ) ) {
					$last_post_id = $post->ID;
					$buffer->view_time( $current_item['last_modified'] );
				} else {
					break;
				}
			}
		}

		// If no items were added, return false.
		if ( true === $buffer->is_empty() ) {
			return false;
		}

		// Store the buffer as the content of a jp_sitemap post.
		$this->librarian->store_sitemap_data(
			$number,
			JP_IMAGE_SITEMAP_TYPE,
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last post to be
		 * successfully added and whether there are any posts left.
		 */
		return array(
			'last_id'       => $last_post_id,
			'any_left'      => $any_posts_left,
			'last_modified' => $buffer->last_modified(),
		);
	}

	/**
	 * Build and store a single video sitemap. Returns false if no sitemap is built.
	 *
	 * Side effect: Create/update an video sitemap row.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return bool|array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_video_sitemap( $number, $from_id ) {
		$last_post_id   = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_VIDEO_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'video',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return false;
		}

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_videos_after_id(
				$last_post_id,
				JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->video_post_to_sitemap_item( $post );

				if ( true === $buffer->append( $current_item['xml'] ) ) {
					$last_post_id = $post->ID;
					$buffer->view_time( $current_item['last_modified'] );
				} else {
					break;
				}
			}
		}

		// If no items were added, return false.
		if ( true === $buffer->is_empty() ) {
			return false;
		}

		if ( false === $buffer->is_empty() ) {
			$this->librarian->store_sitemap_data(
				$number,
				JP_VIDEO_SITEMAP_TYPE,
				$buffer->contents(),
				$buffer->last_modified()
			);
		}

		/*
		 * Now report back with the ID of the last post to be
		 * successfully added and whether there are any posts left.
		 */
		return array(
			'last_id'       => $last_post_id,
			'any_left'      => $any_posts_left,
			'last_modified' => $buffer->last_modified(),
		);
	}

	/**
	 * Build and store a single page sitemap index. Return false if no index is built.
	 *
	 * Side effect: Create/update a sitemap index row.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param int    $number     The number of the current sitemap index.
	 * @param int    $from_id    The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $datetime   Datetime of previous sitemap in 'YYYY-MM-DD hh:mm:ss' format.
	 * @param string $index_type Sitemap index type.
	 *
	 * @return bool|array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	private function build_one_sitemap_index( $number, $from_id, $datetime, $index_type ) {
		$last_sitemap_id   = $from_id;
		$any_sitemaps_left = true;

		// Check the datetime format.
		$datetime = jp_sitemap_datetime( $datetime );

		$sitemap_type = jp_sitemap_child_type_of( $index_type );

		if ( $this->logger ) {
			$index_debug_name = jp_sitemap_filename( $index_type, $number );
			$this->logger->report( "-- Building $index_debug_name" );
		}

		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'master',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			$datetime
		);
		if ( ! $buffer ) {
			return false;
		}

		// Add pointer to the previous sitemap index (unless we're at the first one).
		if ( 1 !== $number ) {
			$i              = $number - 1;
			$prev_index_url = $this->finder->construct_sitemap_url(
				jp_sitemap_filename( $index_type, $i )
			);

			$item_array = array(
				'sitemap' => array(
					'loc'     => $prev_index_url,
					'lastmod' => $datetime,
				),
			);

			$buffer->append( $item_array );
		}

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->librarian->query_sitemaps_after_id(
				$sitemap_type,
				$last_sitemap_id,
				JP_SITEMAP_BATCH_SIZE
			);

			// If there were no posts to get, make a note.
			if ( null == $posts ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
				$any_sitemaps_left = false;
				break;
			}

			// Otherwise, loop through each post in the batch.
			foreach ( $posts as $post ) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_row_to_index_item( (array) $post );

				// Try adding this item to the buffer.
				if ( true === $buffer->append( $current_item['xml'] ) ) {
					$last_sitemap_id = $post['ID'];
					$buffer->view_time( $current_item['last_modified'] );
				} else {
					// Otherwise stop looping through posts.
					break;
				}
			}
		}

		// If no items were added, return false.
		if ( true === $buffer->is_empty() ) {
			return false;
		}

		$this->librarian->store_sitemap_data(
			$number,
			$index_type,
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last sitemap post ID to
		 * be successfully added, whether there are any sitemap posts
		 * left, and the most recent modification time seen.
		 */
		return array(
			'last_id'       => $last_sitemap_id,
			'any_left'      => $any_sitemaps_left,
			'last_modified' => $buffer->last_modified(),
		);
	}

	/**
	 * Construct the sitemap index url entry for a sitemap row.
	 *
	 * @link https://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param array $row The sitemap data to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function sitemap_row_to_index_item( $row ) {
		$url = $this->finder->construct_sitemap_url( $row['post_title'] );

		$item_array = array(
			'sitemap' => array(
				'loc'     => $url,
				'lastmod' => jp_sitemap_datetime( $row['post_date'] ),
			),
		);

		return array(
			'xml'           => $item_array,
			'last_modified' => $row['post_date'],
		);
	}

	/**
	 * This is served instead of a 404 when the master sitemap is requested
	 * but not yet generated.
	 *
	 * @access public
	 * @since 6.7.0
	 *
	 * @return string The empty sitemap xml.
	 */
	public function empty_sitemap_xml() {
		$empty_sitemap = new Jetpack_Sitemap_Buffer_Empty();
		return $empty_sitemap->contents();
	}

	/**
	 * Build and return the news sitemap xml. Note that the result of this
	 * function is cached in the transient 'jetpack_news_sitemap_xml'.
	 *
	 * @access public
	 * @since 4.8.0
	 *
	 * @return string The news sitemap xml.
	 */
	public function news_sitemap_xml() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create(
			'news',
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES
		);

		if ( ! $buffer ) {
			return '';
		}

		$the_stored_news_sitemap = get_transient( 'jetpack_news_sitemap_xml' );

		if ( false === $the_stored_news_sitemap ) {

			if ( $this->logger ) {
				$this->logger->report( 'Beginning news sitemap generation.' );
			}

			/**
			 * Filter limit of entries to include in news sitemap.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param int $count Number of entries to include in news sitemap.
			 */
			$item_limit = apply_filters(
				'jetpack_sitemap_news_sitemap_count',
				JP_NEWS_SITEMAP_MAX_ITEMS
			);

			$posts = $this->librarian->query_most_recent_posts( $item_limit );
			if ( empty( $posts ) ) {
				$buffer->append( array( 'url' => array( 'loc' => home_url( '/' ) ) ) );
			} else {
				foreach ( $posts as $post ) {
					$current_item = $this->post_to_news_sitemap_item( $post );

					if ( $current_item['xml'] !== null && false === $buffer->append( $current_item['xml'] ) ) {
						break;
					}
				}
			}

			if ( $this->logger ) {
				$this->logger->time( 'End news sitemap generation.' );
			}

			$the_stored_news_sitemap = $buffer->contents();

			set_transient(
				'jetpack_news_sitemap_xml',
				$the_stored_news_sitemap,
				JP_NEWS_SITEMAP_INTERVAL
			);
		} // End if.

		return $the_stored_news_sitemap;
	}

	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link https://www.sitemaps.org/protocol.html#urldef
	 * @access private
	 * @since 4.8.0
	 *
	 * @param object $post The post to be processed. Similar to WP_Post, but without post_content and post_content_filtered.
	 *
	 * @return array
	 *              @type array  $xml An XML fragment representing the post URL.
	 *              @type string $last_modified Date post was last modified.
	 */
	private function post_to_sitemap_item( $post ) {

		/**
		 * Filter condition to allow skipping specific posts in sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param bool   $skip Current boolean. False by default, so no post is skipped.
		 * @param object $post Current post in the form of a $wpdb result object. Not WP_Post.
		 *                     Doesn't have all the properties of a WP_Post.
		 */
		if ( true === apply_filters( 'jetpack_sitemap_skip_post', false, $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		$url = esc_url( get_permalink( $post ) );

		/*
		 * Spec requires the URL to be <=2048 bytes.
		 * In practice this constraint is unlikely to be violated.
		 */
		if ( 2048 < strlen( $url ) ) {
			$url = home_url() . '/?p=' . $post->ID;
		}

		$last_modified = $post->post_modified_gmt;

		// Check for more recent comments.
		// Note that 'Y-m-d h:i:s' strings sort lexicographically.
		if ( 0 < $post->comment_count ) {
			$last_modified = max(
				$last_modified,
				$this->librarian->query_latest_approved_comment_time_on_post( $post->ID )
			);
		}

		$item_array = array(
			'url' => array(
				'loc'     => $url,
				'lastmod' => jp_sitemap_datetime( $last_modified ),
			),
		);

		/**
		 * Filter sitemap URL item before rendering it as XML.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param array $tree Associative array representing sitemap URL element.
		 * @param int   $post_id ID of the post being processed.
		 */
		$item_array = apply_filters( 'jetpack_sitemap_url', $item_array, $post->ID );

		return array(
			'xml'           => $item_array,
			'last_modified' => $last_modified,
		);
	}

	/**
	 * Construct the image sitemap url entry for a WP_Post of image type.
	 *
	 * @link https://www.sitemaps.org/protocol.html#urldef
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The image post to be processed.
	 *
	 * @return array
	 *              @type array  $xml An XML fragment representing the post URL.
	 *              @type string $last_modified Date post was last modified.
	 */
	private function image_post_to_sitemap_item( $post ) {

		/**
		 * Filter condition to allow skipping specific image posts in the sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param bool    $skip Current boolean. False by default, so no post is skipped.
		 * @param WP_POST $post Current post object.
		 */
		if ( apply_filters( 'jetpack_sitemap_image_skip_post', false, $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		$url = wp_get_attachment_url( $post->ID );

		// Do not include the image if the attached parent is not published.
		// Unattached will be published. Otherwise, will inherit parent status.
		if ( 'publish' !== get_post_status( $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		$parent_url = get_permalink( get_post( $post->post_parent ) );
		if ( '' == $parent_url ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
			$parent_url = get_permalink( $post );
		}

		$item_array = array(
			'url' => array(
				'loc'         => $parent_url,
				'lastmod'     => jp_sitemap_datetime( $post->post_modified_gmt ),
				'image:image' => array(
					'image:loc' => $url,
				),
			),
		);

		/**
		 * Filter associative array with data to build <url> node
		 * and its descendants for current post in image sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param array $item_array Data to build parent and children nodes for current post.
		 * @param int   $post_id Current image post ID.
		 */
		$item_array = apply_filters(
			'jetpack_sitemap_image_sitemap_item',
			$item_array,
			$post->ID
		);

		return array(
			'xml'           => $item_array,
			'last_modified' => $post->post_modified_gmt,
		);
	}

	/**
	 * Construct the video sitemap url entry for a WP_Post of video type.
	 *
	 * @link https://www.sitemaps.org/protocol.html#urldef
	 * @link https://developers.google.com/webmasters/videosearch/sitemaps
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The video post to be processed.
	 *
	 * @return array
	 *              @type array  $xml An XML fragment representing the post URL.
	 *              @type string $last_modified Date post was last modified.
	 */
	private function video_post_to_sitemap_item( $post ) {

		/**
		 * Filter condition to allow skipping specific video posts in the sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param bool    $skip Current boolean. False by default, so no post is skipped.
		 * @param WP_POST $post Current post object.
		 */
		if ( apply_filters( 'jetpack_sitemap_video_skip_post', false, $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		// Do not include the video if the attached parent is not published.
		// Unattached will be published. Otherwise, will inherit parent status.
		if ( 'publish' !== get_post_status( $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		$parent_url = esc_url( get_permalink( get_post( $post->post_parent ) ) );
		if ( '' == $parent_url ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- WPCS: loose comparison ok.
			$parent_url = esc_url( get_permalink( $post ) );
		}

		// Prepare the content like get_the_content_feed().
		$content = $post->post_content;
		/** This filter is already documented in core/wp-includes/post-template.php */
		$content = apply_filters( 'the_content', $content );

		/** This filter is already documented in core/wp-includes/feed.php */
		$content = apply_filters( 'the_content_feed', $content, 'rss2' );

		// Include thumbnails for VideoPress videos, use blank image for others.
		if ( 'complete' === get_post_meta( $post->ID, 'videopress_status', true ) && has_post_thumbnail( $post ) ) {
			$video_thumbnail_url = get_the_post_thumbnail_url( $post );
		} else {
			/**
			 * Filter the thumbnail image used in the video sitemap for non-VideoPress videos.
			 *
			 * @since 7.2.0
			 *
			 * @param string $str Image URL.
			 */
			$video_thumbnail_url = apply_filters( 'jetpack_video_sitemap_default_thumbnail', 'https://s0.wp.com/i/blank.jpg' );
		}

		$item_array = array(
			'url' => array(
				'loc'         => $parent_url,
				'lastmod'     => jp_sitemap_datetime( $post->post_modified_gmt ),
				'video:video' => array(
					/** This filter is already documented in core/wp-includes/feed.php */
					'video:title'         => apply_filters( 'the_title_rss', $post->post_title ),
					'video:thumbnail_loc' => esc_url( $video_thumbnail_url ),
					'video:description'   => $content,
					'video:content_loc'   => esc_url( wp_get_attachment_url( $post->ID ) ),
				),
			),
		);

		// TODO: Integrate with VideoPress here.
		// cf. video:player_loc tag in video sitemap spec.

		/**
		 * Filter associative array with data to build <url> node
		 * and its descendants for current post in video sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 4.8.0
		 *
		 * @param array $item_array Data to build parent and children nodes for current post.
		 * @param int   $post_id Current video post ID.
		 */
		$item_array = apply_filters(
			'jetpack_sitemap_video_sitemap_item',
			$item_array,
			$post->ID
		);

		return array(
			'xml'           => $item_array,
			'last_modified' => $post->post_modified_gmt,
		);
	}

	/**
	 * Construct the news sitemap url entry for a WP_Post.
	 *
	 * @link https://www.sitemaps.org/protocol.html#urldef
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param object $post The post to be processed. Similar to WP_Post, but without post_content and post_content_filtered.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_news_sitemap_item( $post ) {

		// Exclude posts with meta 'jetpack_seo_noindex' set true from the Jetpack news sitemap.
		add_filter( 'jetpack_sitemap_news_skip_post', array( 'Jetpack_SEO_Posts', 'exclude_noindex_posts_from_jetpack_sitemap' ), 10, 2 );

		/**
		 * Filter condition to allow skipping specific posts in news sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param bool   $skip Current boolean. False by default, so no post is skipped.
		 * @param object $post Current post in the form of a $wpdb result object. Not WP_Post.
		 *                     Doesn't have all the properties of a WP_Post.
		 */
		if ( apply_filters( 'jetpack_sitemap_news_skip_post', false, $post ) ) {
			return array(
				'xml' => null,
			);
		}

		$url = get_permalink( $post );

		/*
		 * Spec requires the URL to be <=2048 bytes.
		 * In practice this constraint is unlikely to be violated.
		 */
		if ( 2048 < strlen( $url ) ) {
			$url = home_url() . '/?p=' . $post->ID;
		}

		/*
		 * Trim the locale to an ISO 639 language code as required by Google.
		 * Special cases are zh-cn (Simplified Chinese) and zh-tw (Traditional Chinese).
		 * @link https://www.loc.gov/standards/iso639-2/php/code_list.php
		 */
		$language = strtolower( get_locale() );

		if ( in_array( $language, array( 'zh_tw', 'zh_cn' ), true ) ) {
			$language = str_replace( '_', '-', $language );
		} else {
			$language = preg_replace( '/(_.*)$/i', '', $language );
		}

		$item_array = array(
			'url' => array(
				'loc'       => $url,
				'lastmod'   => jp_sitemap_datetime( $post->post_modified_gmt ),
				'news:news' => array(
					'news:publication'      => array(
						'news:name'     => html_entity_decode( get_bloginfo( 'name' ), ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ),
						'news:language' => $language,
					),
					/** This filter is already documented in core/wp-includes/feed.php */
					'news:title'            => apply_filters( 'the_title_rss', $post->post_title ),
					'news:publication_date' => jp_sitemap_datetime( $post->post_date_gmt ),
					'news:genres'           => 'Blog',
				),
			),
		);

		/**
		 * Filter associative array with data to build <url> node
		 * and its descendants for current post in news sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param array $item_array Data to build parent and children nodes for current post.
		 * @param int   $post_id Current post ID.
		 */
		$item_array = apply_filters(
			'jetpack_sitemap_news_sitemap_item',
			$item_array,
			$post->ID
		);

		return array(
			'xml' => $item_array,
		);
	}
}
