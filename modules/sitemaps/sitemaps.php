<?php
/**
 * Generate sitemap files in base XML as well as some namespace extensions.
 *
 * This module generates two different base sitemaps.
 *
 * 1. sitemap.xml
 *    The basic sitemap is generated regularly by wp-cron. It is stored in the
 *    database and retrieved when requested. This sitemap aims to include canonical
 *    URLs for all published content and abide by the sitemap spec. This is the root
 *    of a tree of sitemap and sitemap index xml files, depending on the number of URLs.
 *
 * @link http://sitemaps.org/protocol.php Base sitemaps protocol.
 * @link https://support.google.com/webmasters/answer/178636 Image sitemap extension.
 *
 * 2. news-sitemap.xml
 *    The news sitemap is generated on the fly when requested. It does not aim for
 *    completeness, instead including at most 1000 of the most recent published posts
 *    from the previous 2 days, per the news-sitemap spec.
 *
 * @link http://www.google.com/support/webmasters/bin/answer.py?answer=74288 News sitemap extension.
 *
 * @author Automattic
 */

require dirname( __FILE__ ) . '/sitemap-buffer.php';
require dirname( __FILE__ ) . '/sitemap-logger.php';

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
	 * @since 4.5.0
	 */
	const SITEMAP_MAX_BYTES = 10485760; // 10485760 (10MB)

	/**
	 * Maximum size (in url nodes) of a sitemap xml file.
	 *
	 * @link http://www.sitemaps.org/
	 * @since 4.5.0
	 */
	const SITEMAP_MAX_ITEMS = 50000; // 50k

	/**
	 * Maximum size (in url nodes) of a news sitemap xml file.
	 *
	 * @link https://support.google.com/news/publisher/answer/74288?hl=en
	 * @since 4.5.0
	 */
	const NEWS_SITEMAP_MAX_ITEMS = 1000; // 1k

	/**
	 * Number of seconds between sitemap generations.
	 *
	 * @since 4.5.0
	 */
	const SITEMAP_INTERVAL = 60;

	/**
	 * @since 4.5.0
	 */
	public function __construct() {
		// Register post types for data storage
		add_action(
			'init',
			array($this, 'callback_action_register_post_types')
		);

		// Sitemap URL handler
		add_action(
			'init',
			array($this, 'callback_action_catch_sitemap_urls')
		);

		// Add generator to wp_cron task list
		$this->schedule_sitemap_generation();

		// Add sitemap to robots.txt
		add_action(
			'do_robotstxt',
			array($this, 'callback_action_do_robotstxt'),
			20
		);

		return;
	}

	/**
	 * Callback to register sitemap post types for data storage.
	 *
	 * @access public
	 * @since 4.5.0
	 */
	public function callback_action_register_post_types () {
		/** This filter is documented in modules/sitemaps/sitemaps.php */

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

		// Register 'jp_sitemap_master' post type
		register_sitemap_data(
			'jp_sitemap_master',
			'Sitemap Master',
			'jetpack-sitemap-master'
		);

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

		return;
	}

	/**
	 * Callback to intercept sitemap url requests and serve sitemap files.
	 *
	 * @access public
	 * @since 4.5.0
	 */
	public function callback_action_catch_sitemap_urls () {
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
			'news'          => '/^\/news-sitemap\.xml$/',
			'news-style'    => '/^\/news-sitemap\.xsl$/',
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

		// Catch image sitemap xsl
		if ( preg_match( $regex['image-style'], $_SERVER['REQUEST_URI']) ) {
			serve_raw_and_die(
				'text/xml',
				$this->image_sitemap_xsl()
			);
		}

		// Catch news sitemap xml
		if ( preg_match( $regex['news'], $_SERVER['REQUEST_URI']) ) {
			serve_raw_and_die(
				'text/xml',
				$this->news_sitemap_xml()
			);
		}

		// Catch news sitemap xsl
		if ( preg_match( $regex['news-style'], $_SERVER['REQUEST_URI']) ) {
			serve_raw_and_die(
				'text/xml',
				$this->news_sitemap_xsl()
			);
		}

		// URL did not match any sitemap patterns.
		return;
	}

	/**
	 * Add actions to schedule sitemap generation.
	 * Should only be called once, in the constructor.
	 *
	 * @access private
	 * @since 4.5.0
	 */
	private function schedule_sitemap_generation () {
		// Add cron schedule
		add_filter( 'cron_schedules', function ($schedules) {
			$schedules['sitemap-interval'] = array(
				'interval' => self::SITEMAP_INTERVAL,
				'display'  => __('Every Minute')
			);
			return $schedules;
		});

		add_action(
			'jp_sitemap_cron_hook',
			array($this, 'build_all_sitemaps')
		);

		if( !wp_next_scheduled( 'jp_sitemap_cron_hook' ) ) {
			wp_schedule_event(
				time(),
				'sitemap-interval',
				'jp_sitemap_cron_hook'
			);
		}

		return;
	}

	/**
	 * Callback to add sitemap to robots.txt.
	 *
	 * @access public
	 * @since 4.5.0
	 */
	public function callback_action_do_robotstxt () {
		/** This filter is documented in modules/sitemaps/sitemaps.php */
		echo 'Sitemap: ' . site_url() . '/sitemap.xml' . PHP_EOL;
	}

	/**
	 * Build a fresh tree of sitemaps.
	 *
	 * @access public
	 * @since 4.5.0
	 */
	public function build_all_sitemaps () {
		$log = new Jetpack_Sitemap_Logger('begin sitemap generation');

		$page = $this->build_page_sitemap_tree();
		$image = $this->build_image_sitemap_tree();

		$master = 
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/sitemap-index.xsl" . "'?>\n" .
			"<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n" .
			" <sitemap>\n" .
			"  <loc>" . site_url() . $page['filename'] . "</loc>\n" .
			"  <lastmod>" . $page['last_modified'] . "</lastmod>\n" .
			" </sitemap>\n" .
			" <sitemap>\n" .
			"  <loc>" . site_url() . $image['filename'] . "</loc>\n" .
			" </sitemap>\n" .
			"</sitemapindex>\n";

		$this->set_contents_of_post(
			'sitemap',
			'jp_sitemap_master',
			$master,
			''
		);

		$log->time('end sitemap generation');

		return;
	}

	/**
	 * Build the page sitemap tree structure.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return array $args {
	 *     @type string filename The filename of the root page sitemap.
	 *     @type string last_modified The timestamp of the root page sitemap.
	 * }
	 */
	private function build_page_sitemap_tree () {
		$num_sitemaps = $this->build_all_page_sitemaps();

		// If there's only one sitemap, make that the root.
		if ( 1 == $num_sitemaps ) {
			$this->delete_numbered_posts_after(
				'sitemap-index-',
				0,
				'jp_sitemap_index'
			);

			$last_modified = get_page_by_title('sitemap-1', 'OBJECT', 'jp_sitemap')->post_date;

			return array(
				'filename'      => '/sitemap-1.xml',
				'last_modified' => str_replace( ' ', 'T', $last_modified) . 'Z',
			);
		}

		// Otherwise, we have to generate sitemap indices.
		return $this->build_all_page_sitemap_indices();
	}

	/**
	 * Build and store all page sitemaps.
	 *
	 * Side effect: Create/update jp_sitemap posts sitemap-1, sitemap-2, etc.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return int The number of page sitemaps generated.
	 */
	private function build_all_page_sitemaps () {
		$post_ID = 0;
		$sitemap_number = 1;
		$any_posts_left = true;

		// Generate sitemaps until no posts remain.
		while ( true == $any_posts_left ) {
			$result = $this->build_one_page_sitemap(
				$sitemap_number,
				$post_ID
			);

			if ( true == $result['any_posts_left'] ) {
				$post_ID = $result['last_post_ID'];
				$sitemap_number += 1;
			} else {
				$any_posts_left = False;
			}
		}

		// Clean up old page sitemaps.
		$this->delete_numbered_posts_after(
			'sitemap-',
			$sitemap_number,
			'jp_sitemap'
		);

		// Return the number of the last sitemap to be stored.
		return $sitemap_number;
	}

	/**
	 * Build and store a single page sitemap.
	 *
	 * Side effect: Create/update a jp_sitemap post.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 * @return array @args {
	 *   @type int $last_post_ID The ID of the last post to be successfully added to the buffer.
	 *   @type bool $any_posts_left 'true' if there are posts which haven't been saved to a sitemap, 'false' otherwise.
	 * }
	 */
	private function build_one_page_sitemap ( $number, $from_ID ) {
		$last_post_ID = $from_ID;
		$any_posts_left = true;

		$buffer = new Jetpack_Sitemap_Buffer(
			self::SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/sitemap.xsl'?>\n" .
			"<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n",

			/* close tag */
			"</urlset>\n",

			/* epoch */
			strtotime('1970-01-01 00:00:00')
		);

		// Add entry for the main page (only if we're at the first one)
		if ( 1 == $number ) {
			$buffer->try_to_add_item(
				"<url>\n" .
				" <loc>" . site_url() . "</loc>\n" .
				"</url>\n"
			);
		}

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order).
			$posts = $this->query_posts_after_ID($last_post_ID, 1000);
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
			'sitemap-' . $number,
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
	 * Build and store all page sitemap indices.
	 *
	 * Side effect: Create/update jp_sitemap_index posts sitemap-index-1, sitemap-index-2, etc.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return int The number of page sitemap indices generated.
	 */
	private function build_all_page_sitemap_indices () {
		$sitemap_ID = 0;
		$sitemap_index_number = 1;
		$last_modified = strtotime('1970-01-01 00:00:00'); // Epoch
		$any_sitemaps_left = true;

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

		return array(
			'filename'      => '/sitemap-index-' . $sitemap_index_number . '.xml',
			'last_modified' => str_replace( ' ', 'T', $last_modified) . 'Z',
		);
	}

	/**
	 * Build and store a single page sitemap index.
	 *
	 * Side effect: Create/update a jp_sitemap_index post.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $number The number of the current sitemap index.
	 * @param int $from_ID The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $timestamp Timestamp of previous sitemap in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	private function build_one_page_sitemap_index ( $number, $from_ID, $timestamp ) {
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
		if ( 1 != $number ) {
			$i = $number - 1;
			$buffer->try_to_add_item(
				"<sitemap>\n" .
 				" <loc>" . site_url() . "/sitemap-index-$i.xml</loc>\n" .
				" <lastmod>" . str_replace( ' ', 'T', $timestamp) . 'Z' . "</lastmod>\n" .
				"</sitemap>\n"
			);
		}

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->query_page_sitemaps_after_ID($last_sitemap_ID, 1000);

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
			'sitemap-index-' . $number,
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
	 * Build the image sitemap tree structure.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return array $args {
	 *     @type string filename The filename of the root image sitemap.
	 *     @type string last_modified The timestamp of the root image sitemap.
	 * }
	 */
	private function build_image_sitemap_tree () {
		$num_sitemaps = $this->build_all_image_sitemaps();

		// If there's only one sitemap, make that the root.
		if ( 1 == $num_sitemaps ) {
			$this->delete_numbered_posts_after(
				'image-sitemap-index-',
				0,
				'jp_img_sitemap_index'
			);

			return array(
				'filename' => '/image-sitemap-1.xml',
			);
		}

		// Otherwise, we have to generate sitemap indices.
		return $this->build_all_image_sitemap_indices();
	}

	/**
	 * Build and store all image sitemaps.
	 *
	 * Side effect: Create/update jp_img_sitemap posts image-sitemap-1, image-sitemap-2, etc.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return int The number of image sitemaps generated.
	 */
	private function build_all_image_sitemaps () {
		$image_ID = 0;
		$img_sitemap_number = 1;
		$any_images_left = true;

		// Generate image sitemaps until no posts remain.
		while ( true == $any_images_left ) {
			$result = $this->build_one_image_sitemap(
				$img_sitemap_number,
				$image_ID
			);

			if ( true == $result['any_posts_left'] ) {
				$image_ID = $result['last_post_ID'];
				$img_sitemap_number += 1;
			} else {
				$any_images_left = False;
			}
		}

		// Clean up old image sitemaps.
		$this->delete_numbered_posts_after(
			'image-sitemap-',
			$img_sitemap_number,
			'jp_img_sitemap'
		);

		return $img_sitemap_number;
	}

	/**
	 * Build and store a single image sitemap.
	 *
	 * Side effect: Create/update a jp_img_sitemap post.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $number The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 */
	private function build_one_image_sitemap ( $number, $from_ID ) {
		$last_post_ID = $from_ID;
		$any_posts_left = true;

		$buffer = new Jetpack_Sitemap_Buffer(
			self::SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/image-sitemap.xsl" . "'?>\n" .
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
			$posts = $this->query_images_after_ID($last_post_ID, 1000);

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
			'image-sitemap-' . $number,
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
	 * Build and store all image sitemap indices.
	 *
	 * Side effect: Create/update jp_img_sitemap_index posts
	 * image-sitemap-index-1, image-sitemap-index-2, etc.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return int The number of image sitemap indices generated.
	 */
	private function build_all_image_sitemap_indices () {
		$sitemap_ID = 0;
		$sitemap_index_number = 1;
		$last_modified = strtotime('1970-01-01 00:00:00'); // Epoch
		$any_sitemaps_left = true;

		// Generate sitemap indices until no sitemaps remain.
		while ( true == $any_sitemaps_left ) {
			$result = $this->build_one_image_sitemap_index(
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
			'image-sitemap-index-',
			$sitemap_index_number,
			'jp_img_sitemap_index'
		);

		return array(
			'filename' => '/image-sitemap-index-' . $sitemap_index_number . '.xml',
		);
	}

	/**
	 * Build and store a single image sitemap index.
	 *
	 * Side effect: Create/update a jp_img_sitemap_index post.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $number The number of the current image sitemap index.
	 * @param int $from_ID The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $timestamp Timestamp of previous sitemap in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	private function build_one_image_sitemap_index ( $number, $from_ID, $timestamp ) {
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
		if ( 1 != $number ) {
			$i = $number - 1;
			$buffer->try_to_add_item(
				"<sitemap>\n" .
 				" <loc>" . site_url() . "/image-sitemap-index-$i.xml</loc>\n" .
				" <lastmod>" . str_replace( ' ', 'T', $timestamp) . 'Z' . "</lastmod>\n" .
				"</sitemap>\n"
			);
		}

		// Until the buffer is too large,
		while ( false == $buffer->is_full() ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->query_image_sitemaps_after_ID($last_sitemap_ID, 1000);

			// If there were no posts to get, make a note.
			if (null == $posts) {
				$any_sitemaps_left = false;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->image_sitemap_to_index_item($post);

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
			'image-sitemap-index-' . $number,
			'jp_img_sitemap_index',
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
	 * Build and return the news sitemap xml.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return string The news sitemap xml.
	 */
	private function news_sitemap_xml () {
		$log = new Jetpack_Sitemap_Logger('begin news sitemap generation');

		$buffer = new Jetpack_Sitemap_Buffer(
			self::NEWS_SITEMAP_MAX_ITEMS,
			self::SITEMAP_MAX_BYTES,

			/* open tag */
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<?xml-stylesheet type='text/xsl' href='" . site_url() . "/news-sitemap.xsl'?>\n" .
			"<urlset\n" .
			"  xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'\n" .
			"  xmlns:news='http://www.google.com/schemas/sitemap-news/0.9'>\n",

			/* close tag */
			"</urlset>\n",

			/* epoch */
			strtotime('1970-01-01 00:00:00')
		);

		// Retrieve the 1000 most recent posts.
		$posts = $this->query_most_recent_posts(1000);

		// For each post in the batch,
		foreach ($posts as $post) {
			// Generate the sitemap XML for the post.
			$current_item = $this->post_to_news_sitemap_item($post);

			// Try to add it to the buffer.
			if ( false == $buffer->try_to_add_item($current_item['xml']) ) {
				break;
			}
		}

		$log->time('end news sitemap generation');

		return $buffer->contents();
	}

	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 * @access private
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The post to be processed.
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
	 * @access private
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The image post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function image_post_to_sitemap_item ( $post ) {
		$url = wp_get_attachment_url($post->ID);

		$title = esc_html($post->post_title);
		if ( '' != $title ) {
			$title = "  <image:title>$title</image:title>\n";
		}

		$caption = esc_html($post->post_excerpt);
		if ( '' != $caption ) {
			$caption = "  <image:caption>$caption</image:caption>\n";
		}

		$parent_url = get_permalink(get_post($post->post_parent));
		if ( '' == $parent_url ) {
			$parent_url = get_permalink($post);
		}

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
			$title .
			$caption .
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
	 * @access private
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
	 * Construct the image sitemap index url entry for an image sitemap post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The image sitemap post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function image_sitemap_to_index_item ( $post ) {
		$url = site_url() . '/' . $post->post_title . '.xml';

		$xml =
			"<sitemap>\n" .
			" <loc>$url</loc>\n" .
			"</sitemap>\n";

		return array(
			'xml'           => $xml,
			'last_modified' => $post->post_date
		);
	}

	/**
	 * Construct the news sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_news_sitemap_item ( $post ) {
		$url = get_permalink($post);

		/*
		 * Spec requires the URL to be <=2048 bytes.
		 * In practice this constraint is unlikely to be violated.
		 */
		if ( mb_strlen($url) > 2048 ) {
			$url = site_url() . '/?p=' . $post->ID; 
		}

		/*
		 * Must use W3C Datetime format per the sitemap spec.
		 * @link https://www.w3.org/TR/NOTE-datetime
		 */ 
		$last_modified = str_replace( ' ', 'T', $post->post_date) . 'Z';

		$title = esc_html($post->post_title);

		$name = esc_html(get_bloginfo('name'));

		/*
		 * Trim the locale to an ISO 639 language code as required by Google.
		 * Special cases are zh-cn (Simplified Chinese) and zh-tw (Traditional Chinese).
		 * @link http://www.loc.gov/standards/iso639-2/php/code_list.php
		 */
		$language = strtolower( get_locale() );

		if ( in_array( $language, array( 'zh_tw', 'zh_cn' ) ) ) {
			$language = str_replace( '_', '-', $language );
		} else {
			$language = preg_replace( '/(_.*)$/i', '', $language );
		}

		$xml =
			"<url>\n" .
			" <loc>$url</loc>\n" .
			" <news:news>\n" .
			"  <news:publication>\n" .
			"   <news:name>$name</news:name>\n" .
			"   <news:language>$language</news:language>\n" .
			"  </news:publication>\n" .
			"  <news:title>$title</news:title>\n" .
			"  <news:publication_date>$last_modified</news:publication_date>\n" .
			"  <news:genres>Blog</news:genres>\n" .
			" </news:news>\n" .
			"</url>\n";

		return array(
			'xml' => $xml
		);
	}

	/**
	 * Returns the xsl of a sitemap xml file as a string.
	 *
	 * @access private
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
	 * @access private
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
	 * Returns the xsl of an image sitemap xml file as a string.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return string The contents of the xsl file.
	 */
	private function image_sitemap_xsl() {
		$title = esc_html( ent2ncr( __( 'XML Image Sitemap', 'jetpack' ) ) );

		$description = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'This is an XML Image Sitemap generated by <a href="%s" target="_blank">Jetpack</a>, meant to be consumed by search engines like <a href="%s" target="_blank">Google</a> or <a href="%s" target="_blank">Bing</a>.',
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

		$header_url = esc_html( ent2ncr( __( 'Page URL', 'jetpack' ) ) );
		$header_image_url = esc_html( ent2ncr( __( 'Image URL', 'jetpack' ) ) );
		$header_thumbnail = esc_html( ent2ncr( __( 'Thumbnail', 'jetpack' ) ) );
		$header_title = esc_html( ent2ncr( __( 'Title', 'jetpack' ) ) );
		$header_caption = esc_html( ent2ncr( __( 'Caption', 'jetpack' ) ) );

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
  xmlns:image='http://www.google.com/schemas/sitemap-image/1.1'
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
        <th>$header_image_url</th>
        <th>$header_title</th>
        <th>$header_caption</th>
				<th>$header_thumbnail</th>
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
            <xsl:variable name='pageURL'>
              <xsl:value-of select='sitemap:loc'/>
            </xsl:variable>
            <a href='{\$pageURL}'>
              <xsl:value-of select='sitemap:loc'/>
            </a>
          </td>
          <xsl:variable name='itemURL'>
            <xsl:value-of select='image:image/image:loc'/>
          </xsl:variable>
          <td>
            <a href='{\$itemURL}'>
              <xsl:value-of select='image:image/image:loc'/>
            </a>
          </td>
          <td>
            <xsl:value-of select='image:image/image:title'/>
          </td>
          <td>
            <xsl:value-of select='image:image/image:caption'/>
          </td>
          <td>
            <a href='{\$itemURL}'>
              <img class='thumbnail' src='{\$itemURL}'/>
            </a>
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
	 * Returns the xsl of a news sitemap xml file as a string.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @return string The contents of the xsl file.
	 */
	private function news_sitemap_xsl() {
		$title = esc_html( ent2ncr( __( 'XML News Sitemap', 'jetpack' ) ) );

		$description = wp_kses(
			ent2ncr(
				sprintf(
					__(
						'This is an XML News Sitemap generated by <a href="%s" target="_blank">Jetpack</a>, meant to be consumed by search engines like <a href="%s" target="_blank">Google</a> or <a href="%s" target="_blank">Bing</a>.',
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

		$header_url = esc_html( ent2ncr( __( 'Page URL', 'jetpack' ) ) );
		$header_title = esc_html( ent2ncr( __( 'Title', 'jetpack' ) ) );
		$header_pubdate = esc_html( ent2ncr( __( 'Publication Date', 'jetpack' ) ) );

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
  xmlns:news='http://www.google.com/schemas/sitemap-news/0.9'
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
        <th>$header_title</th>
        <th>$header_pubdate</th>
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
          <xsl:variable name='pageURL'>
            <xsl:value-of select='sitemap:loc'/>
          </xsl:variable>
          <td>
            <a href='{\$pageURL}'>
              <xsl:value-of select='sitemap:loc'/>
            </a>
          </td>
          <td>
            <a href='{\$pageURL}'>
              <xsl:value-of select='news:news/news:title'/>
            </a>
          </td>
          <td>
            <xsl:value-of select='news:news/news:publication_date'/>
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
	 * @access private
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

    img.thumbnail {
      height: 75px;
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
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved post IDs.
	 * @param int $num_posts Largest number of posts to retrieve.
	 *
	 * @return array The posts.
	 */
	private function query_posts_after_ID ( $from_ID, $num_posts ) {
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
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved image post IDs.
	 * @param int $num_posts Largest number of image posts to retrieve.
	 *
	 * @return array The posts.
	 */
	private function query_images_after_ID ( $from_ID, $num_posts ) {
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
	 * Retrieve an array of page sitemap posts sorted by ID.
	 *
	 * Returns the smallest $num_posts sitemap posts (measured by ID)
	 * which are larger than $from_ID.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved sitemap post IDs.
	 * @param int $num_posts Largest number of sitemap posts to retrieve.
	 *
	 * @return array The sitemap posts.
	 */
	private function query_page_sitemaps_after_ID ( $from_ID, $num_posts ) {
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
	 * Retrieve an array of image sitemap posts sorted by ID.
	 *
	 * Returns the smallest $num_posts image sitemap posts (measured by ID)
	 * which are larger than $from_ID.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $from_ID Greatest lower bound of retrieved image sitemap post IDs.
	 * @param int $num_posts Largest number of image sitemap posts to retrieve.
	 *
	 * @return array The sitemap posts.
	 */
	private function query_image_sitemaps_after_ID ( $from_ID, $num_posts ) {
		global $wpdb;

		$query_string = "
			SELECT *
				FROM $wpdb->posts
				WHERE post_type='jp_img_sitemap' AND ID>$from_ID
				ORDER BY ID ASC
				LIMIT $num_posts;
		";

		return $wpdb->get_results( $query_string );
	}

	/**
	 * Retrieve an array of published posts from the last 2 days.
	 *
	 * @access private
	 * @since 4.5.0
	 *
	 * @param int $num_posts Largest number of posts to retrieve.
	 *
	 * @return array The posts.
	 */
	private function query_most_recent_posts ( $num_posts ) {
		global $wpdb;

		$two_days_ago = date('Y-m-d', strtotime('-2 days'));

		$query_string = "
			SELECT *
				FROM $wpdb->posts
				WHERE post_status='publish' AND post_date >= '$two_days_ago'
				ORDER BY post_date DESC
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
		$any_left = true;
		$i = $position + 1;

		while ( true == $any_left ) {
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

} // End Jetpack_Sitemap_Manager class

new Jetpack_Sitemap_Manager();
