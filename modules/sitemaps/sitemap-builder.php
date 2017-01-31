<?php
/**
 * Build the sitemap tree.
 *
 * @package Jetpack
 * @since 4.6.0
 * @author Automattic
 */

require_once dirname( __FILE__ ) . '/sitemap-buffer.php';
require_once dirname( __FILE__ ) . '/sitemap-librarian.php';
require_once dirname( __FILE__ ) . '/sitemap-finder.php';
require_once dirname( __FILE__ ) . '/sitemap-tree.php';
require_once dirname( __FILE__ ) . '/sitemap-state.php';

if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
	require_once dirname( __FILE__ ) . '/sitemap-logger.php';
}

/**
 * The Jetpack_Sitemap_Builder object handles the construction of
 * all sitemap files (except the XSL files, which are handled by
 * Jetpack_Sitemap_Stylist.) Other than the constructor, there are
 * only two public functions: build_all_sitemaps and news_sitemap_xml.
 *
 * @since 4.6.0
 */
class Jetpack_Sitemap_Builder {

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
	 * Construct a new Jetpack_Sitemap_Builder object.
	 *
	 * @access public
	 * @since 4.6.0
	 */
	public function __construct() {
		$this->librarian = new Jetpack_Sitemap_Librarian();
		$this->finder = new Jetpack_Sitemap_Finder();

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
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
			 * @since 4.6.0
			 */
			apply_filters(
				'jetpack_sitemap_post_types',
				array( 'post', 'page' )
			)
		);

		return;
	}

	public function build_next_sitemap() {
		$state = Jetpack_Sitemap_State::check_out();

		// Quit if the state is locked.
		if ( false === $state ) {
			return;
		}

		// Page Sitemap
		if ( 'page-sitemap' === $state['sitemap-type'] ) {
			$result = $this->build_one_page_sitemap(
				$state['number'],
				$state['last-added']
			);

			if ( true === $result['any_left'] ) {
				Jetpack_Sitemap_State::check_in( array(
					'sitemap-type'  => 'page-sitemap',
					'last-added'    => $result['last_id'],
					'number'        => $state['number'] + 1,
          'last-modified' => $result['last_modified'],
				) );
				return;
			} else {
				Jetpack_Sitemap_State::check_in( array(
					'sitemap-type'  => 'page-sitemap-index',
					'last-added'    => 0,
					'number'        => 1,
					'last-modified' => '1970-01-01 00:00:00',
				) );
				return;
			}
		} else {
			Jetpack_Sitemap_State::check_in(
				Jetpack_Sitemap_State::initial()
			);
		}
	}

	/**
	 * Build a fresh tree of sitemaps.
	 *
	 * @access public
	 * @since 4.6.0
	 */
	public function build_all_sitemaps() {
		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( 'Beginning sitemap generation.' );
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

		// Build and add page sitemaps.

		$page_tree = new Jetpack_Sitemap_Tree(
			array(
				'sitemap_debug_name'  => 'Page Sitemaps',
				'sitemap_name_prefix' => Jetpack_Sitemap_Librarian::SITEMAP_NAME_PREFIX,
				'sitemap_type'        => Jetpack_Sitemap_Librarian::SITEMAP_TYPE,
				'index_debug_name'    => 'Page Sitemap Index',
				'index_name_prefix'   => Jetpack_Sitemap_Librarian::SITEMAP_INDEX_NAME_PREFIX,
				'index_type'          => Jetpack_Sitemap_Librarian::SITEMAP_INDEX_TYPE,
			),
			array( $this, 'build_one_page_sitemap' )
		);

		$page = $page_tree->build_sitemap_tree();

		$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string(
			array(
				'sitemap' => array(
					'loc'     => $this->finder->construct_sitemap_url( $page['filename'] ),
					'lastmod' => $page['last_modified'],
				),
			)
		) );

		// Build and add image sitemaps.

		$image_tree = new Jetpack_Sitemap_Tree(
			array(
				'sitemap_debug_name'  => 'Image Sitemaps',
				'sitemap_name_prefix' => Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_NAME_PREFIX,
				'sitemap_type'        => Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_TYPE,
				'index_debug_name'    => 'Image Sitemap Index',
				'index_name_prefix'   => Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_INDEX_NAME_PREFIX,
				'index_type'          => Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_INDEX_TYPE,
			),
			array( $this, 'build_one_image_sitemap' )
		);

		$image = $image_tree->build_sitemap_tree();

		if ( false !== $image ) {
			$buffer->try_to_add_item( Jetpack_Sitemap_Buffer::array_to_xml_string(
				array(
					'sitemap' => array(
						'loc'     => $this->finder->construct_sitemap_url( $image['filename'] ),
						'lastmod' => $image['last_modified'],
					),
				)
			) );
		}

		// Build and add video sitemaps.

		$video_tree = new Jetpack_Sitemap_Tree(
			array(
				'sitemap_debug_name'  => 'Video Sitemaps',
				'sitemap_name_prefix' => Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_NAME_PREFIX,
				'sitemap_type'        => Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_TYPE,
				'index_debug_name'    => 'Video Sitemap Index',
				'index_name_prefix'   => Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_INDEX_NAME_PREFIX,
				'index_type'          => Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_INDEX_TYPE,
			),
			array( $this, 'build_one_video_sitemap' )
		);

		$video = $video_tree->build_sitemap_tree();

		if ( false !== $video ) {
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
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_NAME,
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_TYPE,
			$buffer->contents(),
			''
		);

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->time( 'End sitemap generation.' );
		}

		return;
	}

	/**
	 * Build and store a single page sitemap.
	 *
	 * Side effect: Create/update a sitemap row.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_page_sitemap( $number, $from_id ) {
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( '-- Building Page Sitemap ' . $number . '.' );
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
			),
			"\n " // This argument pretty prints the namespaces one per line.
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_ITEMS,
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_BYTES,
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

		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_posts_after_id( $last_post_id, 1000 );

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
			Jetpack_Sitemap_Librarian::SITEMAP_NAME_PREFIX . $number,
			Jetpack_Sitemap_Librarian::SITEMAP_TYPE,
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
	 * Build and store a single image sitemap.
	 *
	 * Side effect: Create/update an image sitemap row.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_image_sitemap( $number, $from_id ) {
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( '-- Building Image Sitemap ' . $number . '.' );
		}

		$image_sitemap_xsl_url = $this->finder->construct_sitemap_url( 'image-sitemap.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
			/**
			 * Filter the XML namespaces included in image sitemaps.
			 *
			 * @module sitemaps
			 *
			 * @since 4.6.0
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
			),
			"\n " // This argument pretty prints the namespaces one per line.
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_ITEMS,
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_BYTES,
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

		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_images_after_id( $last_post_id, 1000 );

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

		// Store the buffer as the content of a jp_sitemap post.
		$this->librarian->store_sitemap_data(
			Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_NAME_PREFIX . $number,
			Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_TYPE,
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
	 * Build and store a single video sitemap.
	 *
	 * Side effect: Create/update an video sitemap row.
	 *
	 * @access private
	 * @since 4.6.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_id The greatest lower bound of the IDs of the posts to be included.
	 *
	 * @return array @args {
	 *   @type int    $last_id       The ID of the last item to be successfully added to the buffer.
	 *   @type bool   $any_left      'true' if there are items which haven't been saved to a sitemap, 'false' otherwise.
	 *   @type string $last_modified The most recent timestamp to appear on the sitemap.
	 * }
	 */
	public function build_one_video_sitemap( $number, $from_id ) {
		$last_post_id = $from_id;
		$any_posts_left = true;

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger->report( '-- Building Video Sitemap ' . $number . '.' );
		}

		$video_sitemap_xsl_url = $this->finder->construct_sitemap_url( 'video-sitemap.xsl' );

		$jetpack_version = JETPACK__VERSION;

		$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
			/**
			 * Filter the XML namespaces included in video sitemaps.
			 *
			 * @module sitemaps
			 *
			 * @since 4.6.0
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
			),
			"\n " // This argument pretty prints the namespaces one per line.
		);

		$buffer = new Jetpack_Sitemap_Buffer(
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_ITEMS,
			Jetpack_Sitemap_Buffer::SITEMAP_MAX_BYTES,
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

		while ( false === $buffer->is_full() ) {
			$posts = $this->librarian->query_videos_after_id( $last_post_id, 1000 );

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

		if ( false === $buffer->is_empty() ) {
			$this->librarian->store_sitemap_data(
				Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_NAME_PREFIX . $number,
				Jetpack_Sitemap_Librarian::VIDEO_SITEMAP_TYPE,
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
	 * Build and return the news sitemap xml. Note that the result of this
	 * function is cached in the transient 'jetpack_news_sitemap_xml'.
	 *
	 * @access public
	 * @since 4.6.0
	 *
	 * @return string The news sitemap xml.
	 */
	public function news_sitemap_xml() {
		$the_stored_news_sitemap = get_transient( 'jetpack_news_sitemap_xml' );

		if ( false === $the_stored_news_sitemap ) {

			if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
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
				Jetpack_Sitemap_Buffer::NEWS_SITEMAP_MAX_ITEMS
			);

			$namespaces = Jetpack_Sitemap_Buffer::array_to_xml_attr_string(
				/**
				 * Filter the attribute value pairs used for namespace and namespace URI mappings.
				 *
				 * @module sitemaps
				 *
				 * @since 4.6.0
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
				),
				"\n " // This argument pretty prints the namespaces one per line.
			);

			$buffer = new Jetpack_Sitemap_Buffer(
				min( $item_limit, Jetpack_Sitemap_Buffer::NEWS_SITEMAP_MAX_ITEMS ),
				Jetpack_Sitemap_Buffer::SITEMAP_MAX_BYTES,
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

			$posts = $this->librarian->query_most_recent_posts( 1000 );

			foreach ( $posts as $post ) {
				$current_item = $this->post_to_news_sitemap_item( $post );

				if ( false === $buffer->try_to_add_item( $current_item['xml'] ) ) {
					break;
				}
			}

			if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
				$this->logger->time( 'End news sitemap generation.' );
			}

			$the_stored_news_sitemap = $buffer->contents();

			set_transient(
				'jetpack_news_sitemap_xml',
				$the_stored_news_sitemap,
				12 * HOUR_IN_SECONDS
			);
		}

		return $the_stored_news_sitemap;
	}

	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 * @access private
	 * @since 4.6.0
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
		// Note that 'Y-m-d h:i:s' timestamps sort lexicographically.
		if ( 0 < $post->comment_count ) {
			$last_modified = max(
				$last_modified,
				$this->librarian->query_latest_approved_comment_time_on_post( $post->ID )
			);
		}

		$item_array = array(
			'url' => array(
				'loc'     => $url,
				'lastmod' => str_replace( ' ', 'T', $last_modified ) . 'Z',
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
	 * @since 4.6.0
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
		 * @since 4.6.0
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
				'lastmod'     => str_replace( ' ', 'T', $post->post_modified_gmt ) . 'Z',
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
		 * @since 4.6.0
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
	 * @since 4.6.0
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
		 * @since 4.6.0
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
				'lastmod'     => str_replace( ' ', 'T', $post->post_modified_gmt ) . 'Z',
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
		 * @since 4.6.0
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
	 * @since 4.6.0
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
				'lastmod' => str_replace( ' ', 'T', $post->post_modified_gmt ) . 'Z',
				'news:news' => array(
					'news:publication' => array(
						'news:name'     => esc_html( get_bloginfo( 'name' ) ),
						'news:language' => $language,
					),
					'news:title'            => esc_html( $post->post_title ),
					'news:publication_date' => str_replace( ' ', 'T', $post->post_date_gmt ) . 'Z',
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
