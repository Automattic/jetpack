<?php
/**
 * Abstract sitemap tree class.
 *
 * @package Jetpack
 * @since 4.6.0
 * @author Automattic
 */

require_once dirname( __FILE__ ) . '/sitemap-buffer.php';
require_once dirname( __FILE__ ) . '/sitemap-librarian.php';
require_once dirname( __FILE__ ) . '/sitemap-finder.php';

if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
	require_once dirname( __FILE__ ) . '/sitemap-logger.php';
}

/**
 * Represents a type of sitemap tree. A sitemap tree (as served) consists of
 * sitemap files and sitemap index files; this class generates the tree structure
 * of a sitemap type.
 *
 * @since 4.6.0
 */
class Jetpack_Sitemap_Tree {

	/**
	 * Librarian object for storing and retrieving sitemap data.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var $librarian Jetpack_Sitemap_Librarian
	 */
	private $librarian;

	/**
	 * Logger object for reporting debug messages.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var $logger Jetpack_Sitemap_Logger
	 */
	private $logger;

	/**
	 * Finder object for dealing with sitemap URIs.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var $finder Jetpack_Sitemap_Finder
	 */
	private $finder;

	/**
	 * Human-readable name of the current sitemap type.
	 *
	 * @since 4.6.0
	 * @var $sitemap_debug_name string
	 */
	private $sitemap_debug_name;

	/**
	 * Name prefix of the current sitemap type; see Jetpack_Sitemap_Librarian.
	 *
	 * @since 4.6.0
	 * @var $sitemap_name_prefix string
	 */
	private $sitemap_name_prefix;

	/**
	 * Type of the current sitemap files; see Jetpack_Sitemap_Librarian.
	 *
	 * @since 4.6.0
	 * @var $sitemap_type string
	 */
	private $sitemap_type;

	/**
	 * Human-readable name of the current sitemap index type.
	 *
	 * @since 4.6.0
	 * @var $index_debug_name string
	 */
	private $index_debug_name;

	/**
	 * Name prefix of the current sitemap index type; see Jetpack_Sitemap_Librarian.
	 *
	 * @since 4.6.0
	 * @var $index_name_prefix string
	 */
	private $index_name_prefix;

	/**
	 * Type of the current sitemap index files; see Jetpack_Sitemap_Librarian.
	 *
	 * @since 4.6.0
	 * @var $index_type string
	 */
	private $index_type;

	/**
	 * Callback which builds a single sitemap file. Expected to take two arguments:
	 * an index representing the sitemap being built, and an index representing a lower
	 * bound on the IDs of the objects to be included in the sitemap.
	 *
	 * @since 4.6.0
	 * @var $build_one Callable
	 */
	private $build_one;

	/**
	 * Construct a new Jetpack_Sitemap_Builder object.
	 *
	 * @access public
	 * @since 4.6.0
	 */
	public function __construct( $args, $build_one ) {
		$this->librarian = new Jetpack_Sitemap_Librarian();
		$this->finder = new Jetpack_Sitemap_Finder();

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger = new Jetpack_Sitemap_Logger();
		}

		$this->sitemap_debug_name  = $args['sitemap_debug_name'];
		$this->sitemap_name_prefix = $args['sitemap_name_prefix'];
		$this->sitemap_type        = $args['sitemap_type'];
		$this->index_debug_name    = $args['index_debug_name'];
		$this->index_name_prefix   = $args['index_name_prefix'];
		$this->index_type          = $args['index_type'];
		$this->build_one           = $build_one;

		return;
	}

	/**
	 * Build the current sitemap tree structure.
	 *
	 * Returns false if no tree is generated.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @return bool|array $args {
	 *     @type int    number_generated The number of sitemap files or indices built.
	 *     @type string filename         The filename of the root image sitemap.
	 *     @type string last_modified    The timestamp of the root image sitemap.
	 * }
	 */
	public function build_sitemap_tree() {
		$result = $this->build_all_sitemaps();

		// If there are no sitemaps, return false.
		if ( 0 === $result['number_built'] ) {
			return false;
		}

		// If there's only one sitemap, make that the root.
		if ( 1 === $result['number_built'] ) {
			$this->librarian->delete_numbered_sitemap_rows_after(
				$this->index_name_prefix, 0, $this->index_type
			);

			return $result;
		}

		// Otherwise, we have to generate sitemap indices.
		return $this->build_all_sitemap_indices();
	}

	/**
	 * Build and store all sitemap files for the current tree.
	 *
	 * Side effect: Create/update sitemap files.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @return array $args {
	 *     @type int    number_generated The number of sitemap files built.
	 *     @type string last_modified    The timestamp of the last generated sitemap.
	 *     @type string filename         The name (with extension) of the last generated file.
	 * }
	 */
	private function build_all_sitemaps() {
		$current_id    = 0;
		$number_built  = 0;
		$last_modified = '1970-01-01 00:00:00'; // Unix epoch.
		$any_left      = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( $this->sitemap_debug_name );
		}

		// Generate sitemap files until no entries remain.
		while ( true === $any_left ) {

			// Call the supplied function to build one sitemap file.
			$result = call_user_func_array(
				$this->build_one,
				array(
					$number_built + 1,
					$current_id
				)
			);

			$last_modified = $result['last_modified'];

			if ( true === $result['any_left'] ) {
				$current_id = $result['last_id'];
				$number_built += 1;
			} else {
				$any_left = false;
			}
		}

		// Clean up old files.
		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( '-- Cleaning Up: ' . $this->sitemap_debug_name );
		}

		$this->librarian->delete_numbered_sitemap_rows_after(
			$this->sitemap_name_prefix, $number_built + 1, $this->sitemap_type
		);

		return array(
			'number_built'  => $number_built + 1,
			'last_modified' => str_replace( ' ', 'T', $last_modified ) . 'Z',
			'filename'      => $this->sitemap_name_prefix . ($number_built + 1) . '.xml',
		);
	}

	/**
	 * Build and store all sitemap index files for the current tree.
	 *
	 * Side effect: Create/update sitemap indices.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @return array $args {
	 *     @type int    number_generated The number of sitemap files built.
	 *     @type string last_modified    The timestamp of the last generated sitemap.
	 *     @type string filename         The name (with extension) of the last generated file.
	 * }
	 */
	private function build_all_sitemap_indices() {
		$current_id    = 0;
		$number_built  = 0;
		$last_modified = '1970-01-01 00:00:00'; // Unix epoch.
		$any_left      = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( $this->index_debug_name . ':' );
		}

		// Generate sitemap files until no entries remain.
		while ( true === $any_left ) {

			// Call the supplied function to build one sitemap file.
			$result = $this->build_one_sitemap_index(
					$number_built + 1,
					$current_id,
					$last_modified
			);

			$last_modified = $result['last_modified'];

			if ( true === $result['any_left'] ) {
				$current_id = $result['last_id'];
				$number_built += 1;
			} else {
				$any_left = false;
			}
		}

		// Clean up old files.
		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( '-- Cleaning Up: ' . $this->index_debug_name );
		}

		$this->librarian->delete_numbered_sitemap_rows_after(
			$this->index_name_prefix, $number_built + 1, $this->index_type
		);

		return array(
			'number_built'  => $number_built + 1,
			'last_modified' => str_replace( ' ', 'T', $last_modified ) . 'Z',
			'filename'      => $this->index_name_prefix . ($number_built + 1) . '.xml',
		);
	}

	/**
	 * Build and store a single page sitemap index.
	 *
	 * Side effect: Create/update a sitemap index row.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @param int    $number The number of the current sitemap index.
	 * @param int    $from_id The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $timestamp Timestamp of previous sitemap in 'YYYY-MM-DD hh:mm:ss' format.
	 *
	 * @return array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	private function build_one_sitemap_index( $number, $from_id, $timestamp ) {
		$last_sitemap_id   = $from_id;
		$any_sitemaps_left = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( "-- Building " . $this->index_debug_name . ' ' . $number . '.' );
		}

		$sitemap_index_xsl_url = $this->finder->construct_sitemap_url( 'sitemap-index.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$buffer = new Jetpack_Sitemap_Buffer(
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_ITEMS,
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_BYTES,
			<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$sitemap_index_xsl_url}'?>
<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n
HEADER
			,
			<<<FOOTER
</sitemapindex>\n
FOOTER
			,
			/* initial last_modified value */
			$timestamp
		);

		$new_timestamp = str_replace( ' ', 'T', $timestamp ) . 'Z';

		// Add pointer to the previous sitemap index (unless we're at the first one).
		if ( 1 !== $number ) {
			$i = $number - 1;
			$prev_index_url = $this->finder->construct_sitemap_url(
				$this->index_name_prefix . $i . '.xml'
			);

			$item_array = array(
				'sitemap' => array(
					'loc'     => $prev_index_url,
					'lastmod' => $new_timestamp,
				),
			);

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ) );
		}

		// Loop until the buffer is too large.
		while ( false === $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->librarian->query_sitemaps_after_id(
				$this->sitemap_type,
				$last_sitemap_id,
				1000
			);

			// If there were no posts to get, make a note.
			if ( null == $posts ) { // WPCS: loose comparison ok.
				$any_sitemaps_left = false;
				break;
			}

			// Otherwise, loop through each post in the batch.
			foreach ( $posts as $post ) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_row_to_index_item( $post );

				// Try adding this item to the buffer.
				if ( true === $buffer->try_to_add_item( $current_item['xml'] ) ) {
					$last_sitemap_id = $post['ID'];
					$buffer->view_time( $current_item['last_modified'] );
				} else {
					// Otherwise stop looping through posts.
					break;
				}
			}
		}

		$this->librarian->store_sitemap_data(
			$this->index_name_prefix . $number,
			$this->index_type,
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
	 * @link http://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @param array $row The sitemap data to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function sitemap_row_to_index_item( $row ) {
		$url = $this->finder->construct_sitemap_url( $row['post_title'] . '.xml' );

		$item_array = array(
			'sitemap' => array(
				'loc'     => $url,
				'lastmod' => str_replace( ' ', 'T', $row['post_date'] ) . 'Z',
			),
		);

		return array(
			'xml'           => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
			'last_modified' => $row['post_date'],
		);
	}

}
