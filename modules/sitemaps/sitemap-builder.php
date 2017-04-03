<?php
/**
 * Build the sitemap tree.
 *
 * @package Jetpack
 * @since 4.8.0
 * @author Automattic
 */

require_once dirname( __FILE__ ) . '/sitemap-constants.php';
require_once dirname( __FILE__ ) . '/sitemap-buffer.php';
require_once dirname( __FILE__ ) . '/sitemap-librarian.php';
require_once dirname( __FILE__ ) . '/sitemap-finder.php';
require_once dirname( __FILE__ ) . '/sitemap-state.php';

if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	require_once dirname( __FILE__ ) . '/sitemap-logger.php';
}

/**
 * The Jetpack_Sitemap_Builder object handles the construction of
 * all sitemap files (except the XSL files, which are handled by
 * Jetpack_Sitemap_Stylist.) Other than the constructor, there are
 * only two public functions: build_all_sitemaps and news_sitemap_xml.
 *
 * @since 4.8.0
 */
class Jetpack_Sitemap_Builder {

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
		$this->finder = new Jetpack_Sitemap_Finder();

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

		return;
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
		}

		for ( $i = 1; $i <= JP_SITEMAP_UPDATE_SIZE; $i++ ) {
			$this->build_next_sitemap_file();
		}

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
	 */
	private function build_next_sitemap_file() {
		// Get the most recent state, and lock the state.
		$state = Jetpack_Sitemap_State::check_out();

		// Do nothing if the state was locked.
		if ( false === $state ) {
			return;
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

				die();

			default:
				// Otherwise, reset the state.
				Jetpack_Sitemap_State::reset(
					JP_PAGE_SITEMAP_TYPE
				);
				die();
		}

		// Unlock the state.
		Jetpack_Sitemap_State::unlock();

		return;
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
			Jetpack_Sitemap_State::check_in( array(
				'sitemap-type'  => $index_type,
				'last-added'    => 0,
				'number'        => 0,
				'last-modified' => '1970-01-01 00:00:00',
			) );

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $sitemap_type" );
			}

			// Clean up old files.
			$this->librarian->delete_numbered_sitemap_rows_after(
				$state['number'], $sitemap_type
			);

			return;
		}

		// Otherwise, update the state.
		Jetpack_Sitemap_State::check_in( array(
			'sitemap-type'  => $state['sitemap-type'],
			'last-added'    => $result['last_id'],
			'number'        => $state['number'] + 1,
			'last-modified' => $result['last_modified'],
		) );

		if ( true === $result['any_left'] ) {
			// If there's more work to be done with this type, return.
			return;
		}

		// Otherwise, advance state to the next sitemap type.
		Jetpack_Sitemap_State::check_in( array(
			'sitemap-type'  => $index_type,
			'last-added'    => 0,
			'number'        => 0,
			'last-modified' => '1970-01-01 00:00:00',
		) );

		if ( $this->logger ) {
			$this->logger->report( "-- Cleaning Up $sitemap_type" );
		}

		// Clean up old files.
		$this->librarian->delete_numbered_sitemap_rows_after(
			$state['number'] + 1, $sitemap_type
		);

		return;
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

		// If only 0 or 1 sitemaps were built, advance to the next type and return.
		if ( 1 >= $state['max'][ $sitemap_type ]['number'] ) {
			Jetpack_Sitemap_State::check_in( array(
				'sitemap-type'  => $next_type,
				'last-added'    => 0,
				'number'        => 0,
				'last-modified' => '1970-01-01 00:00:00',
			) );

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $index_type" );
			}

			// There are no indices of this type.
			$this->librarian->delete_numbered_sitemap_rows_after(
				0, $index_type
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
			Jetpack_Sitemap_State::check_in( array(
				'sitemap-type'  => $next_type,
				'last-added'    => 0,
				'number'        => 0,
				'last-modified' => '1970-01-01 00:00:00',
			) );

			if ( $this->logger ) {
				$this->logger->report( "-- Cleaning Up $index_type" );
			}

			// Clean up old files.
			$this->librarian->delete_numbered_sitemap_rows_after(
				$state['number'], $index_type
			);

			return;
		}

		// Otherwise, check in the state.
		Jetpack_Sitemap_State::check_in( array(
			'sitemap-type'  => $index_type,
			'last-added'    => $result['last_id'],
			'number'        => $state['number'] + 1,
			'last-modified' => $result['last_modified'],
		) );

		// If there are still sitemaps left to index, return.
		if ( true === $result['any_left'] ) {
			return;
		}

		// Otherwise, advance to the next type.
		Jetpack_Sitemap_State::check_in( array(
			'sitemap-type'  => $next_type,
			'last-added'    => 0,
			'number'        => 0,
			'last-modified' => '1970-01-01 00:00:00',
		) );

		if ( $this->logger ) {
			$this->logger->report( "-- Cleaning Up $index_type" );
		}

		// We're done generating indices of this type.
		$this->librarian->delete_numbered_sitemap_rows_after(
			$state['number'] + 1, $index_type
		);

		return;
	}

	/**
	 * Builds the master sitemap index.
	 *
	 * @param array $max Array of sitemap types with max index and datetime.
	 *
	 * @since 4.8.0
	 */
	private function build_master_sitemap( $max ) {
		$sitemap_index_xsl_url = $this->finder->construct_sitemap_url( 'sitemap-index.xsl' );
		$jetpack_version = JETPACK__VERSION;

		if ( $this->logger ) {
			$this->logger->report( '-- Building Master Sitemap.' );
		}

		$buffer = new Jetpack_Sitemap_Buffer(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$sitemap_index_xsl_url}'?>
<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>
HEADER
			,
			<<<FOOTER
</sitemapindex>\n
FOOTER
			,
			/* epoch */
			'1970-01-01 00:00:00'
		);

		if ( 0 < $max[ JP_PAGE_SITEMAP_TYPE ]['number'] ) {
			if ( 1 === $max[ JP_PAGE_SITEMAP_TYPE ]['number'] ) {
				$page['filename'] = jp_sitemap_filename( JP_PAGE_SITEMAP_TYPE, 1 );
				$page['last_modified'] = jp_sitemap_datetime( $max[ JP_PAGE_SITEMAP_TYPE ]['lastmod'] );
			} else {
				$page['filename'] = jp_sitemap_filename(
					JP_PAGE_SITEMAP_INDEX_TYPE,
					$max[ JP_PAGE_SITEMAP_INDEX_TYPE ]['number']
				);
				$page['last_modified'] = jp_sitemap_datetime( $max[ JP_PAGE_SITEMAP_INDEX_TYPE ]['lastmod'] );
			}

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string(
				array(
					'sitemap' => array(
						'loc'     => $this->finder->construct_sitemap_url( $page['filename'] ),
						'lastmod' => $page['last_modified'],
					),
				)
			) );
		}

		if ( 0 < $max[ JP_IMAGE_SITEMAP_TYPE ]['number'] ) {
			if ( 1 === $max[ JP_IMAGE_SITEMAP_TYPE ]['number'] ) {
				$image['filename'] = jp_sitemap_filename( JP_IMAGE_SITEMAP_TYPE, 1 );
				$image['last_modified'] = jp_sitemap_datetime( $max[ JP_IMAGE_SITEMAP_TYPE ]['lastmod'] );
			} else {
				$image['filename'] = jp_sitemap_filename(
					JP_IMAGE_SITEMAP_INDEX_TYPE,
					$max[ JP_IMAGE_SITEMAP_INDEX_TYPE ]['number']
				);
				$image['last_modified'] = jp_sitemap_datetime( $max[ JP_IMAGE_SITEMAP_INDEX_TYPE ]['lastmod'] );
			}

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string(
				array(
					'sitemap' => array(
						'loc'     => $this->finder->construct_sitemap_url( $image['filename'] ),
						'lastmod' => $image['last_modified'],
					),
				)
			) );
		}

		if ( 0 < $max[ JP_VIDEO_SITEMAP_TYPE ]['number'] ) {
			if ( 1 === $max[ JP_VIDEO_SITEMAP_TYPE ]['number'] ) {
				$video['filename'] = jp_sitemap_filename( JP_VIDEO_SITEMAP_TYPE, 1 );
				$video['last_modified'] = $max[ JP_VIDEO_SITEMAP_TYPE ]['lastmod'];
			} else {
				$video['filename'] = jp_sitemap_filename(
					JP_VIDEO_SITEMAP_INDEX_TYPE,
					$max[ JP_VIDEO_SITEMAP_INDEX_TYPE ]['number']
				);
				$video['last_modified'] = $max[ JP_VIDEO_SITEMAP_INDEX_TYPE ]['lastmod'];
			}

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string(
				array(
					'sitemap' => array(
						'loc'     => $this->finder->construct_sitemap_url( $video['filename'] ),
						'lastmod' => $video['last_modified'],
					),
				)
			) );
		}

		$this->librarian->store_sitemap_data(
			0,
			JP_MASTER_SITEMAP_TYPE,
			$buffer->contents(),
			''
		);

		return;
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
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_PAGE_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$sitemap_xsl_url = $this->finder->construct_sitemap_url( 'sitemap.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
			/**
			 * Filter the attribute value pairs used for namespace and namespace URI mappings.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param array $namespaces Associative array with namespaces and namespace URIs.
			 */
			apply_filters(
				'jetpack_sitemap_ns',
				array(
					'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
					'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
				)
			)
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$sitemap_xsl_url}'?>
<urlset{$namespaces}>\n
HEADER
			,
			<<<FOOTER
</urlset>\n
FOOTER
			,
			/* epoch */
			'1970-01-01 00:00:00'
		);

		// Add entry for the main page (only if we're at the first one).
		if ( 1 === $number ) {
			$item_array = array(
				'url' => array(
					'loc' => home_url(),
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

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ) );
		}

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_posts_after_id(
				$last_post_id, JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->post_to_sitemap_item( $post );

				if ( true === $buffer->try_to_add_item( $current_item['xml'] ) ) {
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

		/**
		 * Filter sitemap before rendering it as XML.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param SimpleXMLElement $tree Data tree for sitemap.
		 * @param string           $last_modified Date of last modification.
		 */
		$tree = apply_filters(
			'jetpack_print_sitemap',
			simplexml_load_string( $buffer->contents() ),
			$buffer->last_modified()
		);

		// Store the buffer as the content of a sitemap row.
		$this->librarian->store_sitemap_data(
			$number,
			JP_PAGE_SITEMAP_TYPE,
			$tree->asXML(),
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
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_IMAGE_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$image_sitemap_xsl_url = $this->finder->construct_sitemap_url( 'image-sitemap.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
			/**
			 * Filter the XML namespaces included in image sitemaps.
			 *
			 * @module sitemaps
			 *
			 * @since 4.8.0
			 *
			 * @param array $namespaces Associative array with namespaces and namespace URIs.
			 */
			apply_filters(
				'jetpack_sitemap_image_ns',
				array(
					'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
					'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
					'xmlns:image'        => 'http://www.google.com/schemas/sitemap-image/1.1',
				)
			)
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$image_sitemap_xsl_url}'?>
<urlset{$namespaces}>\n
HEADER
			,
			<<<FOOTER
</urlset>\n
FOOTER
			,
			/* epoch */
			'1970-01-01 00:00:00'
		);

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_images_after_id(
				$last_post_id, JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->image_post_to_sitemap_item( $post );

				if ( true === $buffer->try_to_add_item( $current_item['xml'] ) ) {
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
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( $this->logger ) {
			$debug_name = jp_sitemap_filename( JP_VIDEO_SITEMAP_TYPE, $number );
			$this->logger->report( "-- Building $debug_name" );
		}

		$video_sitemap_xsl_url = $this->finder->construct_sitemap_url( 'video-sitemap.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
			/**
			 * Filter the XML namespaces included in video sitemaps.
			 *
			 * @module sitemaps
			 *
			 * @since 4.8.0
			 *
			 * @param array $namespaces Associative array with namespaces and namespace URIs.
			 */
			apply_filters(
				'jetpack_sitemap_video_ns',
				array(
					'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
					'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
					'xmlns:video'        => 'http://www.google.com/schemas/sitemap-video/1.1',
				)
			)
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$video_sitemap_xsl_url}'?>
<urlset{$namespaces}>\n
HEADER
			,
			<<<FOOTER
</urlset>\n
FOOTER
			,
			/* epoch */
			'1970-01-01 00:00:00'
		);

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_videos_after_id(
				$last_post_id, JP_SITEMAP_BATCH_SIZE
			);

			if ( null == $posts ) { // WPCS: loose comparison ok.
				$any_posts_left = false;
				break;
			}

			foreach ( $posts as $post ) {
				$current_item = $this->video_post_to_sitemap_item( $post );

				if ( true === $buffer->try_to_add_item( $current_item['xml'] ) ) {
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

		$sitemap_index_xsl_url = $this->finder->construct_sitemap_url( 'sitemap-index.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$buffer = new Jetpack_Sitemap_Buffer(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
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
			$datetime
		);

		// Add pointer to the previous sitemap index (unless we're at the first one).
		if ( 1 !== $number ) {
			$i = $number - 1;
			$prev_index_url = $this->finder->construct_sitemap_url(
				jp_sitemap_filename( $index_type, $i )
			);

			$item_array = array(
				'sitemap' => array(
					'loc'     => $prev_index_url,
					'lastmod' => $datetime,
				),
			);

			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ) );
		}

		// Add as many items to the buffer as possible.
		while ( false === $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->librarian->query_sitemaps_after_id(
				$sitemap_type, $last_sitemap_id, JP_SITEMAP_BATCH_SIZE
			);

			// If there were no posts to get, make a note.
			if ( null == $posts ) { // WPCS: loose comparison ok.
				$any_sitemaps_left = false;
				break;
			}

			// Otherwise, loop through each post in the batch.
			foreach ( $posts as $post ) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_row_to_index_item( (array) $post );

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
	 * @link http://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
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
			'xml'           => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
			'last_modified' => $row['post_date'],
		);
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
		$the_stored_news_sitemap = get_transient( 'jetpack_news_sitemap_xml' );

		if ( false === $the_stored_news_sitemap ) {

			if ( $this->logger ) {
				$this->logger->report( 'Beginning news sitemap generation.' );
			}

			$news_sitemap_xsl_url = $this->finder->construct_sitemap_url( 'news-sitemap.xsl' );

			$jetpack_version = JETPACK__VERSION;

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

			$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
				/**
				 * Filter the attribute value pairs used for namespace and namespace URI mappings.
				 *
				 * @module sitemaps
				 *
				 * @since 4.8.0
				 *
				 * @param array $namespaces Associative array with namespaces and namespace URIs.
				 */
				apply_filters(
					'jetpack_sitemap_news_ns',
					array(
						'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
						'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
						'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
						'xmlns:news'         => 'http://www.google.com/schemas/sitemap-news/0.9',
					)
				)
			);

			$buffer = new Jetpack_Sitemap_Buffer(
				min( $item_limit, JP_NEWS_SITEMAP_MAX_ITEMS ),
				JP_SITEMAP_MAX_BYTES,
				<<<HEADER
<?xml version='1.0' encoding='UTF-8'?>
<!-- generator='jetpack-{$jetpack_version}' -->
<?xml-stylesheet type='text/xsl' href='{$news_sitemap_xsl_url}'?>
<urlset{$namespaces}>\n
HEADER
				,
				<<<FOOTER
</urlset>\n
FOOTER
				,
				/* epoch */
				'1970-01-01 00:00:00'
			);

			$posts = $this->librarian->query_most_recent_posts( JP_NEWS_SITEMAP_MAX_ITEMS );

			foreach ( $posts as $post ) {
				$current_item = $this->post_to_news_sitemap_item( $post );

				if ( false === $buffer->try_to_add_item( $current_item['xml'] ) ) {
					break;
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
		}

		return $the_stored_news_sitemap;
	}

	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_sitemap_item( $post ) {

		/**
		 * Filter condition to allow skipping specific posts in sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param bool    $skip Current boolean. False by default, so no post is skipped.
		 * @param WP_POST $post Current post object.
		 */
		if ( true === apply_filters( 'jetpack_sitemap_skip_post', false, $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
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
			'xml'           => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
			'last_modified' => $last_modified,
		);
	}

	/**
	 * Construct the image sitemap url entry for a WP_Post of image type.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The image post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
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

		$parent_url = get_permalink( get_post( $post->post_parent ) );
		if ( '' == $parent_url ) { // WPCS: loose comparison ok.
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

		$title = esc_html( $post->post_title );
		if ( '' !== $title ) {
			$item_array['url']['image:image']['image:title'] = $title;
		}

		$caption = esc_html( $post->post_excerpt );
		if ( '' !== $caption ) {
			$item_array['url']['image:image']['image:caption'] = $caption;
		}

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
			'xml'           => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
			'last_modified' => $post->post_modified_gmt,
		);
	}

	/**
	 * Construct the video sitemap url entry for a WP_Post of video type.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 * @link https://developers.google.com/webmasters/videosearch/sitemaps
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The video post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function video_post_to_sitemap_item( $post ) {

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
		if ( apply_filters( 'jetpack_sitemap_video_skip_post', false, $post ) ) {
			return array(
				'xml'           => null,
				'last_modified' => null,
			);
		}

		$parent_url = get_permalink( get_post( $post->post_parent ) );
		if ( '' == $parent_url ) { // WPCS: loose comparison ok.
			$parent_url = get_permalink( $post );
		}

		$item_array = array(
			'url' => array(
				'loc'         => $parent_url,
				'lastmod'     => jp_sitemap_datetime( $post->post_modified_gmt ),
				'video:video' => array(
					'video:title'         => esc_html( $post->post_title ),
					'video:thumbnail_loc' => '',
					'video:description'   => esc_html( $post->post_content ),
					'video:content_loc'   => wp_get_attachment_url( $post->ID ),
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
			'xml'           => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
			'last_modified' => $post->post_modified_gmt,
		);
	}

	/**
	 * Construct the news sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_news_sitemap_item( $post ) {

		/**
		 * Filter condition to allow skipping specific posts in news sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param bool    $skip Current boolean. False by default, so no post is skipped.
		 * @param WP_POST $post Current post object.
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
		 * @link http://www.loc.gov/standards/iso639-2/php/code_list.php
		 */
		$language = strtolower( get_locale() );

		if ( in_array( $language, array( 'zh_tw', 'zh_cn' ), true ) ) {
			$language = str_replace( '_', '-', $language );
		} else {
			$language = preg_replace( '/(_.*)$/i', '', $language );
		}

		$item_array = array(
			'url' => array(
				'loc' => $url,
				'lastmod' => jp_sitemap_datetime( $post->post_modified_gmt ),
				'news:news' => array(
					'news:publication' => array(
						'news:name'     => esc_html( get_bloginfo( 'name' ) ),
						'news:language' => $language,
					),
					'news:title'            => esc_html( $post->post_title ),
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
			'xml' => Jetpack_Sitemap_Buffer::array_to_xml_string( $item_array ),
		);
	}

}
