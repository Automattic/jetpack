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
 */
class Jetpack_Sitemap_Manager {

	/**
	 * Maximum size (in bytes) of a sitemap xml file.
	 *
	 * @link http://www.sitemaps.org/
	 */
	const SITEMAP_MAX_BYTES = 10485760; // 10485760 (10MB)



	/**
	 * Maximum size (in items) of a sitemap xml file.
	 *
	 * @link http://www.sitemaps.org/
	 */
	const SITEMAP_MAX_ITEMS = 5000; // 50k



	/**
	 * Constructor
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
			echo 'Sitemap: ' . site_url() . '/sitemap.xml' . PHP_EOL;
		}, 20);

		return;
	}



	/**
	 * Add init actions to register sitemap post types for data storage.
	 * Should only be called once, in the constructor.
	 *
	 * Side effect: add 'register_post_type' actions to 'init'.
	 */
	private function register_post_types () {
		// Register 'jp_sitemap_master' post type
		// Should only have one instance, with the contents of the main sitemap.xml file.
		add_action( 'init', function () {
			register_post_type(
				'jp_sitemap_master',
				array(
					'labels' => array(
						'name'          => __( 'Sitemap Masters', 'jetpack' ),
						'singular_name' => __( 'Sitemap Master', 'jetpack' ),
					),
					'public'      => true,
					'has_archive' => true,
					'rewrite'     => array('slug' => 'jetpack-sitemap-master'),
				)
			);
		}); 

		// Register 'jp_sitemap' post type
		add_action( 'init', function () {
			register_post_type(
				'jp_sitemap',
				array(
					'labels' => array(
						'name'          => __( 'Sitemaps', 'jetpack' ),
						'singular_name' => __( 'Sitemap', 'jetpack' ),
					),
					'public'      => true,
					'has_archive' => true,
					'rewrite'     => array('slug' => 'jetpack-sitemap'),
				)
			);
		}); 

		// Register 'jp_sitemap_index' post type
		add_action( 'init', function () {
			register_post_type(
				'jp_sitemap_index',
				array(
					'labels' => array(
						'name'          => __( 'Sitemap Indices', 'jetpack' ),
						'singular_name' => __( 'Sitemap Index', 'jetpack' ),
					),
					'public'      => true,
					'has_archive' => true,
					'rewrite'     => array('slug' => 'jetpack-sitemap-index'),
				)
			);
		});

		return;
	}



	/**
	 * Add init action to capture sitemap url requests and serve sitemap xml.
	 * Should only be called once, in the constructor.
	 *
	 * Side effect: add action to 'init' which detects sitemap-related URLs
	 */
	private function add_sitemap_url_handler () {
		add_action( 'init', function () {
			/** This filter is documented in modules/sitemaps/sitemaps.php */

			// Regular expressions for sitemap URL routing
			$sitemap_master_regex = '/^\/sitemap\.xml$/';
			$sitemap_regex        = '/^\/sitemap-[1-9][0-9]*\.xml$/';
			$sitemap_index_regex  = '/^\/sitemap-index-[1-9][0-9]*\.xml$/';
			$sitemap_style_regex  = '/^\/sitemap\.xsl$/';

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

			// Catch master sitemap
			if ( preg_match( $sitemap_master_regex, $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						'sitemap',
						'jp_sitemap_master'
					)
				);
			}

			// Catch sitemap
			if ( preg_match( $sitemap_regex, $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_sitemap'
					)
				);
			}

			// Catch sitemap index
			if ( preg_match( $sitemap_index_regex, $_SERVER['REQUEST_URI']) ) {
				serve_raw_and_die(
					'application/xml',
					$this->get_contents_of_post(
						substr($_SERVER['REQUEST_URI'], 1, -4),
						'jp_sitemap_index'
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
			$this->generate_all_sitemaps();
		});

		if( !wp_next_scheduled( 'jp_sitemap_cron_hook' ) ) {
			wp_schedule_event( time(), 'minutely', 'jp_sitemap_cron_hook' );
		}

		return;
	}





	/**
	 * Build and store a sitemap.
	 *
	 * Side effect: Create/update a jp_sitemap post.
	 *
	 * @param int $sitemap_number The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 */
	private function generate_sitemap ( $sitemap_number, $from_ID ) {
		$buffer = '';
		$buffer_size_in_bytes = 0;
		$buffer_size_in_items = 0;
		$last_post_ID = $from_ID;
		$last_modified = '1970-01-01T00:00Z'; // Epoch

		// Flags
		$buffer_too_big = False;
		$any_posts_left = True;

		$open_xml =
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n";

		$close_xml =
			"</urlset>\n";

		$main_url =
			"<url>\n" .
			" <loc>" . site_url() . "</loc>\n" .
			"</url>\n";

		// Add header part to buffer.
		$buffer .= $open_xml;
		$buffer_size_in_bytes += mb_strlen($open_xml) + mb_strlen($close_xml);

		// Add entry for the main page (only if we're at the first one)
		if ( 1 == $sitemap_number ) {
			$buffer .= $main_url;
			$buffer_size_in_items += 1;
			$buffer_size_in_bytes += mb_strlen($main_url);
		}

		// Until the buffer is too large,
		while ( False == $buffer_too_big ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->get_published_posts_after_ID($last_post_ID, 1000);

			// If there were no posts to get, make note and quit trying to fill the buffer.
			if (null == $posts) {
				$any_posts_left = False;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->post_to_sitemap_item($post);
	
				// Update the size of the buffer.
				$buffer_size_in_bytes += mb_strlen($current_item['xml']);
				$buffer_size_in_items += 1;

				// If adding this item to the buffer doesn't make it too large,
				if ( $buffer_size_in_items <= self::SITEMAP_MAX_ITEMS &&
				     $buffer_size_in_bytes <= self::SITEMAP_MAX_BYTES ) {
					// Add it and update the current post ID.
					$last_post_ID = $post->ID;
					$buffer .= $current_item['xml'];
					if ( strtotime($last_modified) < strtotime($current_item['last_modified']) ) {
						$last_modified = $current_item['last_modified'];
					}
				} else {
					// Otherwise, note that the buffer is too large and stop looping through posts.
					$buffer_too_big = True;
					break;
				}
			}
		}

		// Once the buffer is full, add the footer part.
		$buffer .= $close_xml;

		// Store the buffer as the content of a jp_sitemap post.
		$this->set_contents_of_post(
			'sitemap-' . $sitemap_number,
			'jp_sitemap',
			$buffer,
			$last_modified
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
	 * Build and store a sitemap index.
	 *
	 * Side effect: Create/update a jp_sitemap_index post.
	 *
	 * @param int $sitemap_index_position The number of the current sitemap index.
	 * @param int $from_ID The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $timestamp Last modification time of previous sitemap.
	 */
	private function generate_sitemap_index ( $sitemap_index_position, $from_ID, $timestamp ) {
		$buffer = '';
		$buffer_size_in_bytes = 0;
		$buffer_size_in_items = 0;
		$last_sitemap_ID = $from_ID;
		$last_modified = $timestamp;

		// Flags
		$buffer_too_big = False;
		$any_sitemaps_left = True;

		$open_xml =
			"<?xml version='1.0' encoding='UTF-8'?>\n" .
			"<!-- generator='jetpack-" . JETPACK__VERSION . "' -->\n" .
			"<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n";

		$close_xml =
			"</sitemapindex>\n";

		$prev_index = $sitemap_index_position - 1;
		$forward_pointer =
			"<sitemap>\n" .
 			" <loc>" . site_url() . "/sitemap-index-$prev_index.xml</loc>\n" .
			" <lastmod>$timestamp</lastmod>\n" .
			"</sitemap>\n";

		// Add header part to buffer (and account for the size of the footer).
		$buffer .= $open_xml;
		$buffer_size_in_bytes += mb_strlen($open_xml) + mb_strlen($close_xml);

		// Add pointer to the previous sitemap index (unless we're at the first one)
		if ( 1 != $sitemap_index_position ) {
			$buffer .= $forward_pointer;
			$buffer_size_in_items += 1;
			$buffer_size_in_bytes += mb_strlen($forward_pointer);
		}

		// Until the buffer is too large,
		while ( False == $buffer_too_big ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->get_sitemap_posts_after_ID($last_sitemap_ID, 1000);

			// If there were no posts to get, make a note.
			if (null == $posts) {
				$any_sitemaps_left = False;
				break;
			}

			// Otherwise, for each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_to_index_item($post);

				// Update the size of the buffer.
				$buffer_size_in_items += 1;
				$buffer_size_in_bytes += mb_strlen($current_item['xml']);

				// If adding this item to the buffer doesn't make it too large,
				if ( $buffer_size_in_items <= self::SITEMAP_MAX_ITEMS &&
				     $buffer_size_in_bytes <= self::SITEMAP_MAX_BYTES ) {
					// Add it and update the last sitemap ID.
					$last_sitemap_ID = $post->ID;
					$buffer .= $current_item['xml'];
					if ( strtotime($last_modified) < strtotime($current_item['last_modified']) ) {
						$last_modified = $current_item['last_modified'];
					}
				} else {
					// Otherwise, note that the buffer is too large and stop looping through posts.
					$buffer_too_big = True;
					break;
				}
			}
		}

		// Once the buffer is full, add the footer part.
		$buffer .= $close_xml;

		// Store the buffer as the content of a jp_sitemap_index post.
		$this->set_contents_of_post(
			'sitemap-index-' . $sitemap_index_position,
			'jp_sitemap_index',
			$buffer,
			$last_modified
		);

		/*
		 * Now report back with the ID of the last sitemap post ID to
		 * be successfully added, whether there are any sitemap posts
		 * left, and the most recent modification time seen.
		 */
		return array(
			'last_sitemap_ID'   => $last_sitemap_ID,
			'any_sitemaps_left' => $any_sitemaps_left,
		  'last_modified'     => $last_modified
		);
	}





	/**
	 * Build a fresh tree of sitemaps.
	 */
	private function generate_all_sitemaps () {
		$post_ID = 0;
		$sitemap_number = 1;
		$any_posts_left = True;

		// Generate sitemaps until no posts remain.
		while ( True == $any_posts_left ) {
			$result = $this->generate_sitemap(
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
		$this->delete_sitemaps_after_number($sitemap_number);

		// If there's only one sitemap, make that the root.
		if ( 1 == $sitemap_number ) {
			$this->clone_to_master_sitemap('sitemap-1', 'jp_sitemap');
			$this->delete_sitemap_indices_after_number(0);
			return;
		}

		// Otherwise, we have to generate sitemap indices.
		$sitemap_ID = 0;
		$sitemap_index_number = 1;
		$last_modified = '01-01-1970T00:00:00'; // Epoch
		$any_sitemaps_left = True;

		// Generate sitemap indices until no sitemaps remain.
		while ( True == $any_sitemaps_left ) {
			$result = $this->generate_sitemap_index(
				$sitemap_index_number,
				$sitemap_ID,
				$last_modified
			);

			if ( True == $result['any_sitemaps_left'] ) {
				$sitemap_ID = $result['last_sitemap_ID'];
				$sitemap_index_number += 1;
				$last_modified = $result['last_modified'];
			} else {
				$any_sitemaps_left = False;
			}
		}

		// Clean up old sitemap indices.
		$this->delete_sitemap_indices_after_number($sitemap_index_number);

		// Make the last sitemap index the root.
		$this->clone_to_master_sitemap(
			'sitemap-index-' . $sitemap_index_number,
			'jp_sitemap_index'
		);

		return;
	}





	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef
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
		$last_modified = str_replace( ' ', 'T', $post->post_modified_gmt) . 'Z';

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
			'last_modified' => $last_modified
		);
	}



	/**
	 * Construct the sitemap index url entry for a sitemap post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#sitemapIndex_sitemap
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
			'last_modified' => $last_modified
		);
	}





	/*
	 * Querying the Database
	 */


	/**
	 * Retrieve an array of posts sorted by ID.
	 *
	 * Returns the smallest $num_posts posts (measured by ID)
	 * which are larger than $from_ID.
	 *
	 * @module sitemaps
	 *
	 * @param int $from_ID Greatest lower bound of retrieved post IDs.
	 * @param int $num_posts Largest number of posts to retrieve.
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
	 * Retrieve an array of sitemap posts sorted by ID.
	 *
	 * Returns the smallest $num_posts sitemap posts (measured by ID)
	 * which are larger than $from_ID.
	 *
	 * @module sitemaps
	 *
	 * @param int $from_ID Greatest lower bound of retrieved sitemap post IDs.
	 * @param int $num_posts Largest number of sitemap posts to retrieve.
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
	 * Delete jp_sitemap posts sitemap-(p+1), sitemap-(p+2), ...
	 * until the first nonexistent post is found.
	 *
	 * @param int @position Number before the first sitemap to be deleted. 
	 */
	private function delete_sitemaps_after_number( $position ) {
		$any_left = True;
		$i = $position + 1;

		while ( True == $any_left ) {
			$the_post = get_page_by_title( 'sitemap-' . $i, 'OBJECT', 'jp_sitemap' );

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
	 * Delete jp_sitemap posts sitemap-index-(p+1), sitemap-index-(p+2), ...
	 * until the first nonexistent post is found.
	 *
	 * @param int @position Number before the first sitemap index to be deleted. 
	 */
	private function delete_sitemap_indices_after_number( $position ) {
		$any_left = True;
		$i = $position + 1;

		while ( True == $any_left ) {
			$the_post = get_page_by_title( 'sitemap-index-' . $i, 'OBJECT', 'jp_sitemap_index' );

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
	 * If the post does not exist, create it.
	 * If the post does exist, the old contents are overwritten.
	 *
	 * @param string $title Post title.
	 * @param string $type Post type.
	 * @param string $contents The string being stored.
	 * @param string $timestamp Timestamp
	 */
	private function set_contents_of_post ($title, $type, $contents, $timestamp) {
		$the_post = get_page_by_title( $title, 'OBJECT', $type );

		if ( null == $the_post ) {
			// Post does not exist.
			wp_insert_post(array(
				'post_title'   => $title,
				'post_content' => esc_html($contents),
				'post_type'    => $type,
				'post_date'    => $timestamp,
			));
		} else {
			// Post does exist.
			wp_insert_post(array(
				'ID'           => $the_post->ID,
				'post_title'   => $title,
				'post_content' => esc_html($contents),
				'post_type'    => $type,
				'post_date'    => $timestamp,
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
