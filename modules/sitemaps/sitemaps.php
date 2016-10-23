<?php
/**
 * Generate sitemap files in base XML as well as popular namespace extensions.
 *
 * @author Automattic
 * @link http://sitemaps.org/protocol.php Base sitemaps protocol.
 * @link http://www.google.com/support/webmasters/bin/answer.py?answer=74288 Google news sitemaps.
 */



/**
 * Governs the generation, storage, and serving of sitemaps.
 *
 * @since 4.5.0
 */
class Jetpack_Sitemap_Manager {

	/**
	 * Maximum size (in bytes) of a sitemap xml file.
	 *
	 * @link http://www.sitemaps.org/
	 *
	 * @since 4.5.0
	 */
	const SITEMAP_MAX_BYTES = 10485760; // 10485760 (10MB)



	/**
	 * Maximum size (in url nodes) of a sitemap xml file.
	 *
	 * @link http://www.sitemaps.org/
	 *
	 * @since 4.5.0
	 */
	const SITEMAP_MAX_ITEMS = 20; // 50k



	/**
	 * Constructor
	 *
	 * @since 4.5.0
	 */
	public function __construct() {
		// Register post types for data storage
		$this->register_post_types();

		// Add sitemap URL handler
		$this->add_sitemap_url_handler();

		// Add generator to wp_cron task list
		$this->schedule_sitemap_generation();

		// Add sitemap to robots.txt
		add_action('do_robotstxt', function () {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			echo 'Sitemap: ' . site_url() . '/sitemap.xml' . PHP_EOL;
		}, 20);

		return;
	}



	/**
	 * Add init actions to register sitemap post types for data storage.
	 * Should only be called once, in the constructor.
	 *
	 * Side effect: add 'register_post_type' actions to 'init'.
	 *
	 * @since 4.5.0
	 */
	private function register_post_types () {
		function register_sitemap_data ($type_name, $label, $slug) {
			register_post_type(
				$type_name,
				array(
					'labels'      => array('name' => $label),
					'public'      => true, // Set to true to aid debugging
					'has_archive' => false,
					'rewrite'     => array('slug' => $slug),
				)
			);
			return;
		}

		add_action( 'init', function () {
			/** This filter is documented in modules/sitemaps/sitemaps.php */

			// Register 'jp_sitemap_master' post type
			register_sitemap_data(
				'jp_sitemap_master',
				'Sitemap Master',
				'jetpack-sitemap-master');

			// Register 'jp_sitemap' post type
			register_sitemap_data(
				'jp_sitemap',
				'Sitemap',
				'jetpack-sitemap'
			);

			// Register 'jp_sitemap_index' post type
			register_sitemap_data(
				'jp_sitemap_index',
				'Sitemap Index',
				'jetpack-sitemap-index'
			);

			// Register 'jp_img_sitemap' post type
			register_sitemap_data(
				'jp_img_sitemap',
				'Image Sitemap',
				'jetpack-image-sitemap'
			);

			// Register 'jp_img_sitemap_index' post type
			register_sitemap_data(
				'jp_img_sitemap_index',
				'Image Sitemap Index',
				'jetpack-image-sitemap-index'
			);
		});

		return;
	}



	/**
	 * Add init action to capture sitemap url requests and serve sitemap xml.
	 * Should only be called once, in the constructor.
	 *
	 * Side effect: add action to 'init' which detects sitemap-related URLs
	 *
	 * @since 4.5.0
	 */
	private function add_sitemap_url_handler () {
		add_action( 'init', function () {
			/** This filter is documented in modules/sitemaps/sitemaps.php */

			// Regular expressions for sitemap URL routing
			$regex = array(
				'master'        => '/^\/sitemap\.xml$/',
				'sitemap'       => '/^\/sitemap-[1-9][0-9]*\.xml$/',
				'index'         => '/^\/sitemap-index-[1-9][0-9]*\.xml$/',
				'sitemap-style' => '/^\/sitemap\.xsl$/',
				'index-style'   => '/^\/sitemap-index\.xsl$/',
				'image'         => '/^\/image-sitemap-[1-9][0-9]*\.xml$/',
				'image-index'   => '/^\/image-sitemap-index-[1-9][0-9]*\.xml$/',
				'image-style'   => '/^\/image-sitemap\.xsl$/',
			);

			/**
			 * Echo a raw string of given content-type.
			 *
			 * @param string $the_content_type The content type to be served.
			 * @param string $the_content The string to be echoed.
			 */
			function serve_raw_and_die($the_content_type, $the_content) {
				header('Content-Type: ' . $the_content_type . '; charset=UTF-8');

				if ('' == $the_content) {
					http_response_code(404);
				}

				echo $the_content;
				die();
			}

			// Catch master sitemap xml
			if ( preg_match( $regex['master'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						'sitemap',
						'jp_sitemap_master'
					)
				);
			}

			// Catch sitemap xml
			if ( preg_match( $regex['sitemap'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_sitemap'
					)
				);
			}

			// Catch sitemap index xml
			if ( preg_match( $regex['index'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_sitemap_index'
					)
				);
			}

			// Catch sitemap xsl
			if ( preg_match( $regex['sitemap-style'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'text/xml',
					$this->sitemap_xsl()
				);
			}

			// Catch sitemap index xsl
			if ( preg_match( $regex['index-style'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'text/xml',
					$this->sitemap_index_xsl()
				);
			}

			// Catch image sitemap xml
			if ( preg_match( $regex['image'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_img_sitemap'
					)
				);
			}

			// Catch image sitemap index xml
			if ( preg_match( $regex['image-index'], $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_img_sitemap_index'
					)
				);
			}

			// URL did not match any sitemap patterns.
			return;
		});
	}



	/**
	 * Add actions to schedule sitemap generation.
	 * Should only be called once, in the constructor.
	 */
	private function schedule_sitemap_generation () {
		// Add cron schedule
		add_filter( 'cron_schedules', function ($schedules) {
			$schedules['minutely'] = array(
				'interval' => 60,
				'display'  => __('Every Minute')
			);
			return $schedules;
		});

		add_action( 'jp_sitemap_cron_hook', function () {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			$this->generate_all_sitemaps();
		});

		if( !wp_next_scheduled( 'jp_sitemap_cron_hook' ) ) {
			wp_schedule_event( time(), 'minutely', 'jp_sitemap_cron_hook' );
		}

		return;
	}





	/**
	 * Build and store a single page sitemap.
	 *
	 * Side effect: Create/update a jp_sitemap post.
	 *
	 * @since 4.5.0
	 *
	 * @param int $sitemap_number The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 */
	private function build_one_page_sitemap ( $sitemap_number, $from_ID ) {
		$last_post_ID = $from_ID;
		$any_posts_left = true;

		$buffer = new Jetpack_Sitemap_Buffer(
			self::SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/sitemap.xsl" . "'?>\n" .
			"<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n",

			/* close tag */
			"</urlset>\n",

			/* epoch */
			strtotime('1970-01-01 00:00:00')
		);

		// Add entry for the main page (only if we're at the first one)
		if ( 1 == $sitemap_number ) {
			$buffer->try_to_add_item(
				"<url>\n" .
				" <loc>" . site_url() . "</loc>\n" .
				"</url>\n"
			);
		}

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->get_published_posts_after_ID($last_post_ID, 1000);

			// If there were no posts to get, make note and quit trying to fill the buffer.
			if (null == $posts) {
				$any_posts_left = false;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->post_to_sitemap_item($post);

				// If we can add it to the buffer,
				if ( true == $buffer->try_to_add_item($current_item['xml']) ) {
					// Update the current post ID and timestamp.
					$last_post_ID = $post->ID;
					$buffer->view_time($current_item['last_modified']);
				} else {
					// Otherwise stop looping through posts.
					break;
				}
			}
		}

		// Store the buffer as the content of a jp_sitemap post.
		$this->set_contents_of_post(
			'sitemap-' . $sitemap_number,
			'jp_sitemap',
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last post ID to be
		 * successfully added and whether there are any posts left.
		 */
		return array(
			'last_post_ID'   => $last_post_ID,
			'any_posts_left' => $any_posts_left
		);
	}



	/**
	 * Build and store all page sitemaps.
	 *
	 * Side effect: Create/update jp_sitemap posts sitemap-1, sitemap-2, etc.
	 *
	 * @since 4.5.0
	 *
	 * @return The number of page sitemaps generated.
	 */
	private function build_all_page_sitemaps () {
		$post_ID = 0;
		$sitemap_number = 1;
		$any_posts_left = True;

		// Generate sitemaps until no posts remain.
		while ( True == $any_posts_left ) {
			$result = $this->build_one_page_sitemap(
				$sitemap_number,
				$post_ID
			);

			if ( True == $result['any_posts_left'] ) {
				$post_ID = $result['last_post_ID'];
				$sitemap_number += 1;
			} else {
				$any_posts_left = False;
			}
		}

		// Clean up old sitemaps.
		$this->delete_numbered_posts_after(
			'sitemap-',
			$sitemap_number,
			'jp_sitemap'
		);

		return $sitemap_number;
	}





	/**
	 * Build and store a single image sitemap.
	 *
	 * Side effect: Create/update a jp_img_sitemap post.
	 *
	 * @since 4.5.0
	 *
	 * @param int $sitemap_number The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 */
	private function build_one_image_sitemap ( $sitemap_number, $from_ID ) {
		$last_post_ID = $from_ID;
		$any_posts_left = true;

		$buffer = new Jetpack_Sitemap_Buffer(
			self::SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/sitemap.xsl" . "'?>\n" .
			"<urlset\n" .
			"  xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'\n" .
			"  xmlns:image='http://www.google.com/schemas/sitemap-image/1.1'>\n",

			/* close tag */
			"</urlset>\n",

			/* epoch */
			strtotime('1970-01-01 00:00:00')
		);

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->get_image_posts_after_ID($last_post_ID, 1000);

			// If there were no posts to get, make note and quit trying to fill the buffer.
			if (null == $posts) {
				$any_posts_left = false;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->image_post_to_sitemap_item($post);

				// If we can add it to the buffer,
				if ( true == $buffer->try_to_add_item($current_item['xml']) ) {
					// Update the current post ID and timestamp.
					$last_post_ID = $post->ID;
					$buffer->view_time($current_item['last_modified']);
				} else {
					// Otherwise stop looping through posts.
					break;
				}
			}
		}

		// Store the buffer as the content of a jp_sitemap post.
		$this->set_contents_of_post(
			'image-sitemap-' . $sitemap_number,
			'jp_img_sitemap',
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last post ID to be
		 * successfully added and whether there are any posts left.
		 */
		return array(
			'last_post_ID'   => $last_post_ID,
			'any_posts_left' => $any_posts_left
		);
	}



	/**
	 * Build and store all image sitemaps.
	 *
	 * Side effect: Create/update jp_img_sitemap posts image-sitemap-1, image-sitemap-2, etc.
	 *
	 * @since 4.5.0
	 *
	 * @return The number of image sitemaps generated.
	 */
	private function build_all_image_sitemaps () {
		$image_ID = 0;
		$img_sitemap_number = 1;
		$any_images_left = True;

		// Generate image sitemaps until no posts remain.
		while ( True == $any_images_left ) {
			$result = $this->build_one_image_sitemap(
				$img_sitemap_number,
				$image_ID
			);

			if ( True == $result['any_posts_left'] ) {
				$image_ID = $result['last_post_ID'];
				$img_sitemap_number += 1;
			} else {
				$any_images_left = False;
			}
		}

		// Clean up old sitemaps.
		$this->delete_numbered_posts_after(
			'image-sitemap-',
			$img_sitemap_number,
			'jp_img_sitemap'
		);

		return $img_sitemap_number;
	}





	/**
	 * Build and store a single sitemap index.
	 *
	 * Side effect: Create/update a jp_sitemap_index post.
	 *
	 * @since 4.5.0
	 *
	 * @param int $sitemap_index_position The number of the current sitemap index.
	 * @param int $from_ID The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $timestamp Timestamp of previous sitemap in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	private function build_one_page_sitemap_index ( $sitemap_index_position, $from_ID, $timestamp ) {
		$last_sitemap_ID = $from_ID;
		$any_sitemaps_left = true;

		$buffer = new Jetpack_Sitemap_Buffer(
			self::SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/sitemap-index.xsl" . "'?>\n" .
			"<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n",

			/* close tag */
			"</sitemapindex>\n",

			/* initial last_modified value */
			$timestamp
		);

		// Add pointer to the previous sitemap index (unless we're at the first one)
		if ( 1 != $sitemap_index_position ) {
			$i = $sitemap_index_position - 1;
			$buffer->try_to_add_item(
				"<sitemap>\n" .
 				" <loc>" . site_url() . "/sitemap-index-$i.xml</loc>\n" .
				" <lastmod>$timestamp</lastmod>\n" .
				"</sitemap>\n"
			);
		}

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->get_sitemap_posts_after_ID($last_sitemap_ID, 1000);

			// If there were no posts to get, make a note.
			if (null == $posts) {
				$any_sitemaps_left = false;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_to_index_item($post);

				// If adding this item to the buffer doesn't make it too large,
				if ( true == $buffer->try_to_add_item($current_item['xml']) ) {
					// Add it and update the last sitemap ID.
					$last_sitemap_ID = $post->ID;
					$buffer->view_time($current_item['last_modified']);
				} else {
					// Otherwise stop looping through posts.
					break;
				}
			}
		}

		// Store the buffer as the content of a jp_sitemap_index post.
		$this->set_contents_of_post(
			'sitemap-index-' . $sitemap_index_position,
			'jp_sitemap_index',
			$buffer->contents(),
			$buffer->last_modified()
		);

		/*
		 * Now report back with the ID of the last sitemap post ID to
		 * be successfully added, whether there are any sitemap posts
		 * left, and the most recent modification time seen.
		 */
		return array(
			'last_sitemap_ID'   => $last_sitemap_ID,
			'any_sitemaps_left' => $any_sitemaps_left,
		  'last_modified'     => $buffer->last_modified()
		);
	}



	/**
	 * Build and store all page sitemap indices.
	 *
	 * Side effect: Create/update jp_sitemap_index posts sitemap-index-1, sitemap-index-2, etc.
	 *
	 * @since 4.5.0
	 *
	 * @return The number of page sitemap indices generated.
	 */
	private function build_all_page_sitemap_indices () {
		$sitemap_ID = 0;
		$sitemap_index_number = 1;
		$last_modified = strtotime('1970-01-01 00:00:00'); // Epoch
		$any_sitemaps_left = True;

		// Generate sitemap indices until no sitemaps remain.
		while ( true == $any_sitemaps_left ) {
			$result = $this->build_one_page_sitemap_index(
				$sitemap_index_number,
				$sitemap_ID,
				$last_modified
			);

			if ( true == $result['any_sitemaps_left'] ) {
				$sitemap_ID = $result['last_sitemap_ID'];
				$sitemap_index_number += 1;
				$last_modified = $result['last_modified'];
			} else {
				$any_sitemaps_left = False;
			}
		}

		// Clean up old sitemap indices.
		$this->delete_numbered_posts_after(
			'sitemap-index-',
			$sitemap_index_number,
			'jp_sitemap_index'
		);

		return $sitemap_index_number;
	}





	/**
	 * Build a fresh tree of sitemaps.
	 *
	 * @since 4.5.0
	 */
	private function generate_all_sitemaps () {
		$log = new Jetpack_Sitemap_Logger('begin generation');

		$img_sitemap_number = $this->build_all_image_sitemaps();

		$num_sitemaps = $this->build_all_page_sitemaps();

		// If there's only one sitemap, make that the root.
		if ( 1 == $num_sitemaps ) {
			$this->clone_to_master_sitemap('sitemap-1', 'jp_sitemap');
			$this->delete_numbered_posts_after(
				'sitemap-index-',
				0,
				'jp_sitemap_index'
			);

			$log->time('end generation');
			return;
		}

		// Otherwise, we have to generate sitemap indices.
		$sitemap_index_number = $this->build_all_page_sitemap_indices();

		// Make the last sitemap index the root.
		$this->clone_to_master_sitemap(
			'sitemap-index-' . $sitemap_index_number,
			'jp_sitemap_index'
		);

		$log->time('end generation');

		return;
	}





	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 *
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_sitemap_item ( $post ) {
		$url = get_permalink($post);

		/*
		 * Must use W3C Datetime format per the spec.
		 * https://www.w3.org/TR/NOTE-datetime
		 */ 
		$last_modified = str_replace( ' ', 'T', $post->post_date) . 'Z';

		/*
		 * Spec requires the URL to be <=2048 bytes.
		 * In practice this constraint is unlikely to be violated.
		 */
		if ( mb_strlen($url) > 2048 ) {
			$url = site_url() . '/?p=' . $post->ID; 
		}

		$xml =
			"<url>\n" .
			" <loc>$url</loc>\n" .
			" <lastmod>$last_modified</lastmod>\n" .
			"</url>\n";

		return array(
			'xml'           => $xml,
			'last_modified' => $post->post_date
		);
	}



	/**
	 * Construct the image sitemap url entry for a WP_Post of image type.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 *
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The image post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function image_post_to_sitemap_item ( $post ) {
		$url = wp_get_attachment_url($post->ID);

		$parent_url = get_permalink(get_post($post->post_parent));

		/*
		 * Spec requires the URL to be <=2048 bytes.
		 * In practice this constraint is unlikely to be violated.
		 */
		if ( mb_strlen($url) > 2048 ) {
			$url = site_url() . '/?p=' . $post->ID; 
		}

		$xml =
			"<url>\n" .
			" <loc>$parent_url</loc>\n" .
			" <image:image>\n" .
			"  <image:loc>$url</image:loc>\n" .
			" </image:image>\n" .
			"</url>\n";

		return array(
			'xml'           => $xml,
			'last_modified' => $post->post_date
		);
	}



	/**
	 * Construct the sitemap index url entry for a sitemap post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
	 *
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The sitemap post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function sitemap_to_index_item ( $post ) {
		$url = site_url() . '/' . $post->post_title . '.xml';

		/*
		 * Must use W3C Datetime format per the spec.
		 * https://www.w3.org/TR/NOTE-datetime
		 * Also recall that we stored the most recent modification time
		 * among all the posts in this sitemap in post_date.
		 */
		$last_modified = str_replace( ' ', 'T', $post->post_date) . 'Z';

		$xml =
			"<sitemap>\n" .
			" <loc>$url</loc>\n" .
			" <lastmod>$last_modified</lastmod>\n" .
			"</sitemap>\n";

		return array(
			'xml'           => $xml,
			'last_modified' => $post->post_date
		);
	}


	/**
	 * Returns the xsl of a sitemap xml file as a string.
	 *
	 * @since 4.5.0
	 *
	 * @return string The contents of the xsl file.
	 */
	private function sitemap_xsl() {
		$title = esc_html( ent2ncr( __( 'XML Sitemap', 'jetpack' ) ) );

		$description = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'This is an XML Sitemap generated by <a href="%s" target="_blank">Jetpack</a>, meant to be consumed by search engines like <a href="%s" target="_blank">Google</a> or <a href="%s" target="_blank">Bing</a>.',
						'jetpack'
					),
					'http://jetpack.com/',
					'https://www.google.com/',
					'https://www.bing.com/'
				)
			),
			array( 'a' => array( 'href' => true, 'title' => true )
			)
		);

		$more_info = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'You can find more information on XML sitemaps at <a href="%s" target="_blank">sitemaps.org</a>',
						'jetpack'
					),
					'http://sitemaps.org'
				)
			),
			array(
				'a' => array( 'href' => true, 'title' => true )
			)
		);

		$header_url = esc_html( ent2ncr( __( 'URL', 'jetpack' ) ) );
		$header_lastmod = esc_html( ent2ncr( __( 'Last Modified', 'jetpack' ) ) );

		$generated_by = wp_kses(
			sprintf(
				ent2ncr(
					__(
						'<em>Generated</em> by <a href="%s" target="_blank">Jetpack for WordPress</a>',
						'jetpack'
					)
				),
				'https://jetpack.com'
			),
			array( 'a' => array( 'href' => true, 'title' => true ) )
		);

		$css = $this->sitemap_xsl_css();

		return <<<XSL
<?xml version='1.0' encoding='UTF-8'?>
<xsl:stylesheet version='2.0'
  xmlns:html='http://www.w3.org/TR/REC-html40'
  xmlns:sitemap='http://www.sitemaps.org/schemas/sitemap/0.9'
  xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>
<xsl:output method='html' version='1.0' encoding='UTF-8' indent='yes'/>
<xsl:template match="/">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>$title</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'/>
  <style type='text/css'>
$css
  </style>
</head>
<body>
  <div id='description'>
    <h1>$title</h1>
    <p>$description</p>
    <p>$more_info</p>
  </div>
  <div id='content'>
    <!-- <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> -->
    <table>
      <tr>
        <th>#</th>
        <th>$header_url</th>
        <th>$header_lastmod</th>
      </tr>
      <xsl:for-each select="sitemap:urlset/sitemap:url">
        <tr>
          <xsl:choose>
            <xsl:when test='position() mod 2 != 1'>
              <xsl:attribute name="class">odd</xsl:attribute>
            </xsl:when>
          </xsl:choose>
          <td>
            <xsl:value-of select = "position()" />
          </td>
          <td>
            <xsl:variable name='itemURL'>
              <xsl:value-of select='sitemap:loc'/>
            </xsl:variable>
            <a href='{\$itemURL}'>
              <xsl:value-of select='sitemap:loc'/>
            </a>
          </td>
          <td>
            <xsl:value-of select='sitemap:lastmod'/>
          </td>
        </tr>
      </xsl:for-each>
    </table>
  </div>
  <div id='footer'>
    <p>$generated_by</p>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>\n
XSL;
	}



	/**
	 * Returns the xsl of a sitemap index xml file as a string.
	 *
	 * @since 4.5.0
	 *
	 * @return string The contents of the xsl file.
	 */
	private function sitemap_index_xsl() {
		$title = esc_html( ent2ncr( __( 'XML Sitemap Index', 'jetpack' ) ) );

		$description = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'This is an XML Sitemap Index generated by <a href="%1$s" target="_blank">Jetpack</a>, meant to be consumed by search engines like <a href="%2$s" target="_blank">Google</a> or <a href="%3$s" target="_blank">Bing</a>.',
						'jetpack'
					),
					'http://jetpack.com/',
					'https://www.google.com/',
					'https://www.bing.com/'
				)
			),
			array( 'a' => array( 'href' => true, 'title' => true )
			)
		);

		$more_info = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'You can find more information on XML sitemaps at <a href="%s" target="_blank">sitemaps.org</a>',
						'jetpack'
					),
					'http://sitemaps.org'
				)
			),
			array(
				'a' => array( 'href' => true, 'title' => true )
			)
		);

		$header_url = esc_html( ent2ncr( __( 'Sitemap URL', 'jetpack' ) ) );
		$header_lastmod = esc_html( ent2ncr( __( 'Last Modified', 'jetpack' ) ) );

		$generated_by = wp_kses(
			sprintf(
				ent2ncr(
					__(
						'<em>Generated</em> by <a href="%s" target="_blank">Jetpack for WordPress</a>',
						'jetpack'
					)
				),
				'https://jetpack.com'
			),
			array( 'a' => array( 'href' => true, 'title' => true ) )
		);

		$css = $this->sitemap_xsl_css();

		return <<<XSL
<?xml version='1.0' encoding='UTF-8'?>
<xsl:stylesheet version='2.0'
  xmlns:html='http://www.w3.org/TR/REC-html40'
  xmlns:sitemap='http://www.sitemaps.org/schemas/sitemap/0.9'
  xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>
<xsl:output method='html' version='1.0' encoding='UTF-8' indent='yes'/>
<xsl:template match="/">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>$title</title>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'/>
  <style type='text/css'>
$css
  </style>
</head>
<body>
  <div id='description'>
    <h1>$title</h1>
    <p>$description</p>
    <p>$more_info</p>
  </div>
  <div id='content'>
    <table>
      <tr>
        <th>#</th>
        <th>$header_url</th>
        <th>$header_lastmod</th>
      </tr>
      <xsl:for-each select='sitemap:sitemapindex/sitemap:sitemap'>
        <tr>
          <xsl:choose>
            <xsl:when test='position() mod 2 != 1'>
              <xsl:attribute name="class">odd</xsl:attribute>
            </xsl:when>
          </xsl:choose>
          <td>
            <xsl:value-of select = "position()" />
          </td>
          <td>
            <xsl:variable name='itemURL'>
              <xsl:value-of select='sitemap:loc'/>
            </xsl:variable>
            <a href='{\$itemURL}'>
	            <xsl:value-of select='sitemap:loc'/>
  	        </a>
          </td>
          <td>
            <xsl:value-of select='sitemap:lastmod'/>
          </td>
        </tr>
      </xsl:for-each>
    </table>
  </div>
  <div id='footer'>
    <p>$generated_by</p>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>\n
XSL;
	}



	/**
	 * The CSS to be included in sitemap xsl stylesheets;
	 * factored out for uniformity.
	 *
	 * @since 4.5.0
	 */
	private function sitemap_xsl_css () {
		return <<<CSS
    body {
      font: 14px 'Open Sans', Helvetica, Arial, sans-serif;
      margin: 0;
    }

    a {
      color: #3498db;
      text-decoration: none;
    }

    h1 {
      margin: 0;
    }

    #description {
      background-color: #81a844;
      color: #FFF;
      padding: 30px 30px 20px;
    }

    #description a {
      color: #fff;
    }

    #content {
      padding: 10px 30px 30px;
      background: #fff;
    }

    a:hover {
      border-bottom: 1px solid;
    }

    th, td {
      font-size: 12px;
    }

    th {
      text-align: left;
      border-bottom: 1px solid #ccc;
    }

    th, td {
      padding: 10px 15px;
    }

    .odd {
      background-color: #E7F1D4;
    }

    #footer {
      margin: 20px 30px;
      font-size: 12px;
      color: #999;
    }

    #footer a {
      color: inherit;
    }

    #description a, #footer a {
      border-bottom: 1px solid;
    }

    #description a:hover, #footer a:hover {
      border-bottom: none;
    }
CSS;
	}





	/*
	 * Querying the Database
	 */


	/**
	 * Retrieve an array of posts sorted by ID.
	 *
	 * More precisely, returns the smallest $num_posts posts
	 * (measured by ID) which are larger than $from_ID.
	 *
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved post IDs.
	 * @param int $num_posts Largest number of posts to retrieve.
	 *
	 * @return array The posts.
	 */
	private function get_published_posts_after_ID ( $from_ID, $num_posts ) {
		global $wpdb;

		$query_string = "
			SELECT *
				FROM $wpdb->posts
				WHERE post_status='publish' AND ID>$from_ID
				ORDER BY ID ASC
				LIMIT $num_posts;
		";

		return $wpdb->get_results( $query_string );
	}



	/**
	 * Retrieve an array of image posts sorted by ID.
	 *
	 * More precisely, returns the smallest $num_posts image posts
	 * (measured by ID) which are larger than $from_ID.
	 *
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved image post IDs.
	 * @param int $num_posts Largest number of image posts to retrieve.
	 *
	 * @return array The posts.
	 */
	private function get_image_posts_after_ID ( $from_ID, $num_posts ) {
		global $wpdb;

		$query_string = "
			SELECT *
				FROM $wpdb->posts
				WHERE post_type='attachment'
								AND post_mime_type IN ('image/jpeg','image/png','image/gif')
								AND ID>$from_ID
				ORDER BY ID ASC
				LIMIT $num_posts;
		";

		return $wpdb->get_results( $query_string );
	}



	/**
	 * Retrieve an array of sitemap posts sorted by ID.
	 *
	 * Returns the smallest $num_posts sitemap posts (measured by ID)
	 * which are larger than $from_ID.
	 *
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved sitemap post IDs.
	 * @param int $num_posts Largest number of sitemap posts to retrieve.
	 *
	 * @return array The sitemap posts.
	 */
	private function get_sitemap_posts_after_ID ( $from_ID, $num_posts ) {
		global $wpdb;

		$query_string = "
			SELECT *
				FROM $wpdb->posts
				WHERE post_type='jp_sitemap' AND ID>$from_ID
				ORDER BY ID ASC
				LIMIT $num_posts;
		";

		return $wpdb->get_results( $query_string );
	}



	/**
	 * Retrieve the contents of a post with given title and type.
	 * If the post does not exist, return the empty string.
	 *
	 * @param string $title Post title.
	 * @param string $type Post type.
	 *
	 * @return string Contents of the specified post, or the empty string.
	 */
	private function get_contents_of_post ($title, $type) {
		$the_post = get_page_by_title($title, 'OBJECT', $type);

		if (null == $the_post) {
			return '';
		} else {
			return wp_specialchars_decode($the_post->post_content, ENT_QUOTES);
		}
	}





	/*
	 * Manipulating the Database
	 */

	/**
	 * Delete numbered posts prefix-(p+1), prefix-(p+2), ...
	 * until the first nonexistent post is found.
	 *
	 * @param string $prefix Post name prefix.
	 * @param int $position Number before the first sitemap to be deleted.
	 * @param string $type Post type.
	 */
	private function delete_numbered_posts_after( $prefix, $position, $type ) {
		$any_left = True;
		$i = $position + 1;

		while ( True == $any_left ) {
			$the_post = get_page_by_title( $prefix . $i, 'OBJECT', $type );

			if ( null == $the_post ) {
				$any_left = False;
			} else {
				wp_delete_post($the_post->ID);
				$i += 1;
			}
		}

		return;
	}



	/**
	 * Store a string in the contents of a post with given title and type.
	 *
	 * If the post does not exist, create it.
	 * If the post does exist, the old contents are overwritten.
	 *
	 * @param string $title Post title.
	 * @param string $type Post type.
	 * @param string $contents The string being stored.
	 * @param string $timestamp Timestamp in 'TTTT-MM-DD hh:mm:ss' format
	 */
	private function set_contents_of_post ($title, $type, $contents, $timestamp) {
		$the_post = get_page_by_title( $title, 'OBJECT', $type );

		if ( null == $the_post ) {
			// Post does not exist.
			wp_insert_post(array(
				'post_title'   => $title,
				'post_content' => esc_html($contents),
				'post_type'    => $type,
				'post_date'    => date('Y-m-d H:i:s', strtotime($timestamp))
			));
		} else {
			// Post does exist.
			wp_insert_post(array(
				'ID'           => $the_post->ID,
				'post_title'   => $title,
				'post_content' => esc_html($contents),
				'post_type'    => $type,
				'post_date'    => date('Y-m-d H:i:s', strtotime($timestamp))
			));
		}

		return;
	}



	/**
	 * Clone the contents of a specified post to the master sitemap.
	 *
	 * @param string @title Title of the post to clone.
	 * @param string @type Type of the post to clone.
	 */
	private function clone_to_master_sitemap ( $title, $type ) {
		$this->set_contents_of_post(
			'sitemap',
			'jp_sitemap_master',
			$this->get_contents_of_post($title, $type),
			''
		);

		return;
	}

} // End Jetpack_Sitemap_Manager class

new Jetpack_Sitemap_Manager();





/**
 * A buffer for constructing sitemap xml files.
 *
 * Models a list of strings such that
 *
 * 1. the list must have a bounded number of entries,
 * 2. the concatenation of the strings must have bounded
 *      length (including some header and footer strings), and
 * 3. each item has a timestamp, and we need to keep track
 *      of the latest timestamp of the items in the list.
 *
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. This class abstracts
 * the details of checking these constraints.
 */
class Jetpack_Sitemap_Buffer {
	private $item_capacity;
	private $byte_capacity;
	private $footer_text;
	private $buffer;
	private $is_full_flag;  // True if we've tried to add something and failed.
	private $timestamp;     // 'YYYY-MM-DD hh:mm:ss'

	/**
	 * Construct a new Jetpack_Sitemap_Buffer.
	 *
	 * @param int $item_limit The maximum size of the buffer in items.
	 * @param int $byte_limit The maximum size of the buffer in bytes.
	 * @param string $header The string to prepend to the entire buffer.
	 * @param string $footer The string to append to the entire buffer.
	 * @param string $time The initial timestamp of the buffer, in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function __construct(
		$item_limit = 50000,    // 50k
		$byte_limit = 10485760, // 10MB
		$header = '',
		$footer = '',
		$time
	) {
		$this->item_capacity = $item_limit;
		$this->byte_capacity = $byte_limit - mb_strlen($header) - mb_strlen($footer);
		$this->footer_text = $footer;
		$this->buffer = $header;
		$this->is_full_flag = false;
		$this->timestamp = $time;
		return;
	}

	/**
	 * Append an item to the buffer, if there is room for it.
	 * If not, we set is_full_flag to true.
	 *
	 * @since 4.5.0
	 *
	 * @param string $item The item to be added.
	 *
	 * @return bool True if the append succeeded, False if not.
	 */
	public function try_to_add_item($item) {
		if ($this->item_capacity <= 0 || $this->byte_capacity - mb_strlen($item) <= 0) {
			$this->is_full_flag = true;
			return false;
		} else {
			$this->item_capacity -= 1;
			$this->byte_capacity -= mb_strlen($item);
			$this->buffer .= $item;
			return true;
		}
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @return string The contents of the buffer (with the footer included).
	 */
	public function contents() {
		return $this->buffer . $this->footer_text;
	}

	/**
	 * Detect whether the buffer is full.
	 *
	 * @since 4.5.0
	 *
	 * @return bool True if the buffer is full, false otherwise.
	 */
	public function is_full() {
		return $this->is_full_flag;
	}

	/**
	 * Update the timestamp of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @param string $new_time A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function view_time($new_time) {
		if ( strtotime($this->timestamp) < strtotime($new_time) ) {
			$this->timestamp = $new_time;
		}
		return;
	}

	/**
	 * Retrieve the timestamp of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @return string A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function last_modified() {
		return $this->timestamp;
	}
}





/**
 * Handles logging errors and debug messages for sitemap generator.
 *
 * Side effect: writes a string to the PHP error log.
 */
class Jetpack_Sitemap_Logger {
	/**
	 * A unique-ish string for each logger, enabling us to grep
	 * for the messages written by an individual generation phase.
	 *
	 * @since 4.5.0
	 */
	private $key;

	/**
	 * The birth time of this object in microseconds.
	 *
	 * @since 4.5.0
	 */
	private $starttime;

	/**
	 * Initializes a new logger object.
	 *
	 * Side effect: writes a string to the PHP error log.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message A message string to be written to the debug log on initialization.
	 */
	public function __construct($message) {
		$this->key = wp_generate_password(5, false);
		$this->starttime = microtime(true);
		$this->report($message);
		return;
	}

	/**
	 * Writes a string to the debug log, including the logger's ID string.
	 *
	 * Side effect: writes a string to the PHP error log.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message The string to be written to the log.
	 */
	public function report($message) {
		error_log( 'jp-sitemap-' .  $this->key . ': ' . $message );
		return;
	}

	/**
	 * Writes the elapsed lifetime of the logger to the debug log, with an optional message.
	 *
	 * Side effect: writes a string to the PHP error log.
	 *
	 * @since 4.5.0
	 *
	 * @param string $message The optional message string.
	 */
	public function time($message = '') {
		$time = (microtime(true) - $this->starttime);
		$this->report($message . ' ' . $time . ' seconds elsapsed');
		return;
	}
}
