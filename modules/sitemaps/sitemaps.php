<?php
/**
 * Generate sitemap files in base XML as well as popular namespace extensions.
 *
 * @author Automattic
 * @link http://sitemaps.org/protocol.php Base sitemaps protocol.
 * @link http://www.google.com/support/webmasters/bin/answer.py?answer=74288 Google news sitemaps.
 */

class Jetpack_Sitemap_Manager {

	/** @see http://www.sitemaps.org/ The sitemap protocol spec */
	const SITEMAP_MAX_BYTES = 10485760; // 10485760 (10MB)
	const SITEMAP_MAX_ITEMS = 10;    // 50k



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
						'name'          => __( 'Sitemap Masters' ),
						'singular_name' => __( 'Sitemap Master' ),
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
						'name'          => __( 'Sitemaps' ),
						'singular_name' => __( 'Sitemap' ),
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
						'name'          => __( 'Sitemap Indices' ),
						'singular_name' => __( 'Sitemap Index' ),
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
			$sitemap_index_regex  = '/^\/sitemap-index-([1-9][0-9]*)?\.xml$/';
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

			// URL did not match any patterns here.
			return;
		});
	}



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

		// (@@@) for testing
		// $this->delete_all_sitemaps();

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
	 * @param int $sitemap_position The number of the current sitemap.
	 * @param int $from_ID The greatest lower bound of the IDs of the posts to be included.
	 */
	private function generate_sitemap ( $sitemap_position, $from_ID ) {
		$buffer = '';
		$buffer_size_in_bytes = 0;
		$buffer_size_in_items = 0;
		$current_post_ID = $from_ID;
		$most_recent_modification = '1970-01-01T00:00Z'; // Epoch

		// Flags
		$buffer_too_big = False;
		$any_posts_remaining = True;

		$open_xml = <<<XML
<?xml version='1.0' encoding='UTF-8'?>
<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n
XML;

		$close_xml = <<<XML
</urlset>\n
XML;

		$site_url = site_url();
		$main_url = <<<XML
<url>
 <loc>$site_url</loc>
</url>\n
XML;

		// Add header part to buffer.
		$buffer .= $open_xml;
		$buffer_size_in_bytes += mb_strlen($open_xml) + mb_strlen($close_xml);

		// Add entry for the main page (only if we're at the first one)
		if ( 1 == $sitemap_position ) {
			$buffer .= $main_url;
			$buffer_size_in_items += 1;
			$buffer_size_in_bytes += mb_strlen($main_url);
		}

		// Until the buffer is too large,
		while ( False == $buffer_too_big ) {
			// Retrieve a batch of posts (in order)
			$posts = $this->get_published_posts_after_ID($current_post_ID, 1000);

			// If there were no posts to get, make note and quit trying to fill the buffer.
			if (null == $posts) {
				$any_posts_remaining = False;
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
					$current_post_ID = $post->ID;
					$buffer .= $current_item['xml'];
					if ( strtotime($most_recent_modification)
					       < strtotime($current_item['last_modified']) ) {
						$most_recent_modification = $current_item['last_modified'];
					}
				} else {
					// Otherwise, note that the buffer is too large and stop looping through posts.
					$buffer_too_big = True;
					break;
				}
			}
		}

		// Close the 'urlset' tag.
		$buffer .= $close_xml;

		// Store the buffer as the content of a jetpack_sitemap post.
		$this->set_contents_of_post(
			'sitemap-' . $sitemap_position,
			'jp_sitemap',
			$buffer,
			$most_recent_modification
		);

		// Now current_post_ID is the ID of the last post successfully added to the buffer.
		return array(
			'last_post_ID'   => $current_post_ID,
			'any_posts_left' => $any_posts_remaining
		);
	}




	/**
	 * Build and store a sitemap index.
	 *
	 * Side effect: Create/update a jp_sitemap_index post.
	 *
	 * @param int $sitemap_position The number of the current sitemap index.
	 * @param int $from_ID The greatest lower bound of the IDs of the sitemaps to be included.
	 * @param string $previous_timestamp Last modification time of previous sitemap.
	 */
	private function generate_sitemap_index ( $sitemap_index_position, $from_ID, $previous_timestamp ) {
		$buffer = '';
		$buffer_size_in_bytes = 0;
		$buffer_size_in_items = 0;
		$current_post_ID = $from_ID;
		$most_recent_modification = '1970-01-01T00:00Z'; // Epoch

		// Flags
		$buffer_too_big = False;
		$any_posts_remaining = True;

		$open_xml = <<<XML
<?xml version='1.0' encoding='UTF-8'?>
<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>\n
XML;

		$close_xml = <<<XML
</sitemapindex>\n
XML;

		$next_index_url = site_url() . '/sitemap-index-' . ($sitemap_index_position - 1) . '.xml';
		$forward_pointer = <<<XML
<sitemap>
 <loc>$next_index_url</loc>
 <lastmod>$previous_timestamp</lastmod>
</sitemap>\n
XML;

		// Add header part to buffer.
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
			$posts = $this->get_sitemap_posts_after_ID($current_post_ID, 1000);

			// If there were no posts to get, make note. Otherwise,
			if (null == $posts) {
				$any_posts_remaining = False;
				break;
			}

			// For each post in the batch,
			foreach ($posts as $post) {
				// Generate the sitemap XML for the post.
				$current_item = $this->sitemap_to_index_item($post);

				// Update the size of the buffer.
				$buffer_size_in_items += 1;
				$buffer_size_in_bytes += mb_strlen($current_item['xml']);

				// If adding this item to the buffer doesn't make it too large,
				if ( $buffer_size_in_items <= self::SITEMAP_MAX_ITEMS &&
				     $buffer_size_in_bytes <= self::SITEMAP_MAX_BYTES ) {
					// Add it and update the current post ID. Otherwise,
					$current_post_ID = $post->ID;
					$buffer .= $current_item['xml'];
					if ( strtotime($most_recent_modification)
					       < strtotime($current_item['last_modified']) ) {
						$most_recent_modification = $current_item['last_modified'];
					}
				} else {
					// Note that the buffer is too large and stop looping through posts.
					$buffer_too_big = True;
					break;
				}
			}
		}

		// Close the 'urlset' tag.
		$buffer .= $close_xml;

		// Store the buffer as the content of a jetpack_sitemap post.
		$this->set_contents_of_post(
			'sitemap-index-' . $sitemap_index_position,
			'jp_sitemap_index',
			$buffer,
			$most_recent_modification
		);

		//
		if ( strtotime($most_recent_modification) < strtotime($previous_timestamp) ) {
			$most_recent_modification = $previous_timestamp;
		}

		// Now current_post_ID is the ID of the last post successfully added to the buffer.
		return array(
			'last_post_ID'   => $current_post_ID,
			'any_posts_left' => $any_posts_remaining,
		  'last_modified'  => $most_recent_modification
		);
	}





	private function generate_all_sitemaps () {
		/* Sitemaps */

		$last_post_ID = 0;
		$current_sitemap_position = 1;

		// Generate the sitemaps
		$any_posts_left = True;

		while ( True == $any_posts_left ) {
			$result = $this->generate_sitemap($current_sitemap_position, $last_post_ID);

			if ( True == $result['any_posts_left'] ) {
				$last_post_ID = $result['last_post_ID'];
				$current_sitemap_position += 1;
			} else {
				$any_posts_left = False;
			}
		}

		// If there's only one sitemap, make that the root.
		if ( 1 == $current_sitemap_position ) {
			$foo = $this->get_contents_of_post('sitemap-1', 'jp_sitemap');
			$this->set_contents_of_post(
				'sitemap',
				'jp_sitemap_master',
				$foo,
				''
			);
			return;
		}

		/* Sitemap Indices */

		$last_sitemap_ID = 0;
		$current_sitemap_index_position = 1;
		$most_recent_modification = '01-01-1970T00:00:00';

		// Generate the sitemaps
		$any_sitemaps_left = True;

		while ( True == $any_sitemaps_left ) {
			$result = $this->generate_sitemap_index($current_sitemap_index_position, $last_sitemap_ID, $most_recent_modification);

			if ( True == $result['any_posts_left'] ) {
				$last_sitemap_ID = $result['last_post_ID'];
				$current_sitemap_index_position += 1;
				$most_recent_modification = $result['last_modified'];
			} else {
				$any_sitemaps_left = False;
			}
		}

		// If there's only one sitemap index, make that the root.
		if ( 1 == $current_sitemap_index_position ) {
			$foo = $this->get_contents_of_post('sitemap-index-1', 'jp_sitemap_index');
			$this->set_contents_of_post(
				'sitemap',
				'jp_sitemap_master',
				$foo,
				''
			);
		} else {
			$foo = $this->get_contents_of_post('sitemap-index-' . $current_sitemap_index_position, 'jp_sitemap_index');
			$this->set_contents_of_post(
				'sitemap',
				'jp_sitemap_master',
				$foo,
				''
			);
		}

		return;
	}





	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef The sitemap protocol document.
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function post_to_sitemap_item ( $post ) {
		$url = get_permalink($post);
		$lastmod = str_replace( ' ', 'T', $post->post_modified_gmt) . 'Z';

		// Spec requires the URL to be <=2048 bytes.
		// In practice this constraint is unlikely to be violated.
		if ( mb_strlen($url) > 2048 ) {
			$url = site_url() . '/?p=' . $post->ID; 
		}

		$xml = <<<XML
<url>
 <loc>$url</loc>
 <lastmod>$lastmod</lastmod>
</url>\n
XML;

		return array(
			'xml'           => $xml,
			'last_modified' => $lastmod
		);
	}



	/**
	 * Construct the sitemap url entry for a WP_Post.
	 *
	 * @link http://www.sitemaps.org/protocol.html#urldef The sitemap protocol document.
	 *
	 * @param WP_Post $post The post to be processed.
	 *
	 * @return string An XML fragment representing the post URL.
	 */
	private function sitemap_to_index_item ( $post ) {
		$url = site_url() . '/' . $post->post_title . '.xml';
		$lastmod = str_replace( ' ', 'T', $post->post_date) . 'Z';

		$xml = <<<XML
<sitemap>
 <loc>$url</loc>
 <lastmod>$lastmod</lastmod>
</sitemap>

XML;

		return array(
			'xml'           => $xml,
			'last_modified' => $lastmod
		);
	}




	private function delete_all_sitemaps () {
		global $wpdb;

		$sitemaps = $wpdb->get_results("
			SELECT *
			  FROM $wpdb->posts
			  WHERE post_type = 'jp_sitemap'
		");

		foreach ( $sitemaps as $post ) {
			wp_delete_post($post->ID);
		}

		$sitemap_indices = $wpdb->get_results("
			SELECT *
			  FROM $wpdb->posts
			  WHERE post_type = 'jp_sitemap_index'
		");

		foreach ( $sitemap_indices as $post ) {
			wp_delete_post($post->ID);
		}

		return;
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

}	// End Jetpack_Sitemap_Manager class

new Jetpack_Sitemap_Manager;




// TODO: Delete Old_Jetpack_Sitemap_Manager
//  make sure it's not used elsewhere (grr global scope)
//  and that we've subsumed the functionality
class Old_Jetpack_Sitemap_Manager {

/**
 * Convert a MySQL datetime string to an ISO 8601 string.
 *
 * @module sitemaps
 *
 * @link http://www.w3.org/TR/NOTE-datetime W3C date and time formats document.
 *
 * @param string $mysql_date UTC datetime in MySQL syntax of YYYY-MM-DD HH:MM:SS.
 *
 * @return string ISO 8601 UTC datetime string formatted as YYYY-MM-DDThh:mm:ssTZD where timezone offset is always +00:00.
 */
function jetpack_w3cdate_from_mysql( $mysql_date ) {
	return str_replace( ' ', 'T', $mysql_date ) . '+00:00';
}

/**
 * Get the maximum comment_date_gmt value for approved comments for the given post_id.
 *
 * @module sitemaps
 *
 * @param int $post_id Post identifier.
 *
 * @return string datetime MySQL value or null if no comment found.
 */
function jetpack_get_approved_comments_max_datetime( $post_id ) {
	global $wpdb;

	return $wpdb->get_var( $wpdb->prepare( "SELECT MAX(comment_date_gmt) FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_approved = '1' AND comment_type=''", $post_id ) );
}

/**
 * Return the content type used to serve a Sitemap XML file.
 * Uses text/xml by default, possibly overridden by jetpack_sitemap_content_type filter.
 *
 * @module sitemaps
 *
 * @return string Internet media type for the sitemap XML.
 */
function jetpack_sitemap_content_type() {
	/**
	 * Filter the content type used to serve the XML sitemap file.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param string $content_type By default, it's 'text/xml'.
	 */
	return apply_filters( 'jetpack_sitemap_content_type', 'text/xml' );
}

/**
 * Write an XML tag.
 *
 * @module sitemaps
 *
 * @param array $data Information to write an XML tag.
 */
function jetpack_print_sitemap_item( $data ) {
	jetpack_print_xml_tag( array( 'url' => $data ) );
}

/**
 * Write an opening tag and its matching closing tag.
 *
 * @module sitemaps
 *
 * @param array $array Information to write a tag, opening and closing it.
 */
function jetpack_print_xml_tag( $array ) {
	foreach ( $array as $key => $value ) {
		if ( is_array( $value ) ) {
			echo "<$key>";
			jetpack_print_xml_tag( $value );
			echo "</$key>";
		} else {
			echo "<$key>" . esc_html( $value ) . "</$key>";
		}
	}
}

/**
 * Convert an array to a SimpleXML child of the passed tree.
 *
 * @module sitemaps
 *
 * @param array $data array containing element value pairs, including other arrays, for XML contruction.
 * @param SimpleXMLElement $tree A SimpleXMLElement class object used to attach new children.
 *
 * @return SimpleXMLElement full tree with new children mapped from array.
 */
function jetpack_sitemap_array_to_simplexml( $data, &$tree ) {
	$doc_namespaces = $tree->getDocNamespaces();

	foreach ( $data as $key => $value ) {
		// Allow namespaced keys by use of colon in $key, namespaces must be part of the document
		$namespace = null;
		if ( false !== strpos( $key, ':' ) && 'image' != $key ) {
			list( $namespace_prefix, $key ) = explode( ':', $key );
			if ( isset( $doc_namespaces[ $namespace_prefix ] ) ) {
				$namespace = $doc_namespaces[ $namespace_prefix ];
			}
		}

		if ( 'image' != $key ) {
			if ( is_array( $value ) ) {
				$child = $tree->addChild( $key, null, $namespace );
				jetpack_sitemap_array_to_simplexml( $value, $child );
			} else {
				$tree->addChild( $key, esc_html( $value ), $namespace );
			}
		} elseif ( is_array( $value ) ) {
			foreach ( $value as $image ) {
				$child = $tree->addChild( $key, null, $namespace );
				jetpack_sitemap_array_to_simplexml( $image, $child );
			}
		}
	}

	return $tree;
}

/**
 * Define an array of attribute value pairs for use inside the root element of an XML document.
 * Intended for mapping namespace and namespace URI values.
 * Passes array through jetpack_sitemap_ns for other functions to add their own namespaces.
 *
 * @module sitemaps
 *
 * @return array array of attribute value pairs passed through the jetpack_sitemap_ns filter
 */
function jetpack_sitemap_namespaces() {
	/**
	 * Filter the attribute value pairs used for namespace and namespace URI mappings.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param array $namespaces Associative array with namespaces and namespace URIs.
	 */
	return apply_filters( 'jetpack_sitemap_ns', array(
		'xmlns:xsi'          => 'http://www.w3.org/2001/XMLSchema-instance',
		'xsi:schemaLocation' => 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
		'xmlns'              => 'http://www.sitemaps.org/schemas/sitemap/0.9',
		// Mobile namespace from http://support.google.com/webmasters/bin/answer.py?hl=en&answer=34648
		'xmlns:mobile'       => 'http://www.google.com/schemas/sitemap-mobile/1.0',
		'xmlns:image'        => 'http://www.google.com/schemas/sitemap-image/1.1',
	) );
}

/**
 * Start sitemap XML document, writing its heading and <urlset> tag with namespaces.
 *
 * @module sitemaps
 *
 * @param $charset string Charset for current XML document.
 *
 * @return string
 */
function jetpack_sitemap_initstr( $charset ) {
	global $wp_rewrite;
	// URL to XSLT
	if ( $wp_rewrite->using_index_permalinks() ) {
		$xsl = home_url( '/index.php/sitemap.xsl' );
	} else if ( $wp_rewrite->using_permalinks() ) {
		$xsl = home_url( '/sitemap.xsl' );
	} else {
		$xsl = home_url( '/?jetpack-sitemap-xsl=true' );
	}

	$initstr = '<?xml version="1.0" encoding="' . $charset . '"?>' . "\n";
	$initstr .= '<?xml-stylesheet type="text/xsl" href="' . esc_url( $xsl ) . '"?>' . "\n";
	$initstr .= '<!-- generator="jetpack-' . JETPACK__VERSION . '" -->' . "\n";
	$initstr .= '<urlset';
	foreach ( jetpack_sitemap_namespaces() as $attribute => $value ) {
		$initstr .= ' ' . esc_html( $attribute ) . '="' . esc_attr( $value ) . '"';
	}
	$initstr .= ' />';

	return $initstr;
}

/**
 * Load XSLT for sitemap.
 *
 * @module sitemaps
 *
 * @param string $type XSLT to load.
 */
function jetpack_load_xsl( $type = '' ) {

	$transient_xsl = empty( $type ) ? 'jetpack_sitemap_xsl' : "jetpack_{$type}_sitemap_xsl";

	$xsl = get_transient( $transient_xsl );

	if ( $xsl ) {
		header( 'Content-Type: ' . jetpack_sitemap_content_type(), true );
		echo $xsl;
		die();
	}

	// Populate $xsl. Use $type.
	include_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-xsl.php';

	if ( ! empty( $xsl ) ) {
		set_transient( $transient_xsl, $xsl, DAY_IN_SECONDS );
		echo $xsl;
	}

	die();
}

/**
 * Responds with an XSLT to stylize sitemap.
 *
 * @module sitemaps
 */
function jetpack_print_sitemap_xsl() {
	jetpack_load_xsl();
}

/**
 * Responds with an XSLT to stylize news sitemap.
 *
 * @module sitemaps
 */
function jetpack_print_news_sitemap_xsl() {
	jetpack_load_xsl( 'news' );
}

/**
 * Print an XML sitemap conforming to the Sitemaps.org protocol.
 * Outputs an XML list of up to the latest 1000 posts.
 *
 * @module sitemaps
 *
 * @link http://sitemaps.org/protocol.php Sitemaps.org protocol.
 */
function jetpack_print_sitemap() {
	global $wpdb, $post;

	$xml = get_transient( 'jetpack_sitemap' );

	if ( $xml ) {
		header( 'Content-Type: ' . jetpack_sitemap_content_type(), true );
		echo $xml;
		die();
	}

	// Compatibility with PHP 5.3 and older
	if ( ! defined( 'ENT_XML1' ) ) {
		define( 'ENT_XML1', 16 );
	}

	/**
	 * Filter the post types that will be included in sitemap.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param array $post_types Array of post types.
	 */
	$post_types    = apply_filters( 'jetpack_sitemap_post_types', array( 'post', 'page' ) );

	$post_types_in = array();
	foreach ( (array) $post_types as $post_type ) {
		$post_types_in[] = $wpdb->prepare( '%s', $post_type );
	}
	$post_types_in = join( ",", $post_types_in );

	// use direct query instead because get_posts was acting too heavy for our needs
	//$posts = get_posts( array( 'numberposts'=>1000, 'post_type'=>$post_types, 'post_status'=>'published' ) );
	$posts = $wpdb->get_results( "SELECT ID, post_type, post_modified_gmt, comment_count FROM $wpdb->posts WHERE post_status='publish' AND post_type IN ({$post_types_in}) ORDER BY post_modified_gmt DESC LIMIT 1000" );
	if ( empty( $posts ) ) {
		status_header( 404 );
	}
	header( 'Content-Type: ' . jetpack_sitemap_content_type() );
	$initstr = jetpack_sitemap_initstr( get_bloginfo( 'charset' ) );
	$tree    = simplexml_load_string( $initstr );
	// If we did not get a valid string, force UTF-8 and try again.
	if ( false === $tree ) {
		$initstr = jetpack_sitemap_initstr( 'UTF-8' );
		$tree    = simplexml_load_string( $initstr );
	}

	unset( $initstr );
	$latest_mod = '';
	foreach ( $posts as $post ) {
		setup_postdata( $post );

		/**
		 * Filter condition to allow skipping specific posts in sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param bool $skip Current boolean. False by default, so no post is skipped.
		 * @param WP_POST $post Current post object.
		 */
		if ( apply_filters( 'jetpack_sitemap_skip_post', false, $post ) ) {
			continue;
		}

		$post_latest_mod = null;
		$url             = array( 'loc' => esc_url( get_permalink( $post->ID ) ) );

		// If this post is configured to be the site home, skip since it's added separately later
		if ( untrailingslashit( get_permalink( $post->ID ) ) == untrailingslashit( get_option( 'home' ) ) ) {
			continue;
		}

		// Mobile node specified in http://support.google.com/webmasters/bin/answer.py?hl=en&answer=34648
		$url['mobile:mobile'] = '';

		// Image node specified in http://support.google.com/webmasters/bin/answer.py?hl=en&answer=178636
		// These attachments were produced with batch SQL earlier in the script
		if ( ! post_password_required( $post->ID ) ) {

			$media = array();
			$methods = array(
				'from_thumbnail'  => false,
				'from_slideshow'  => false,
				'from_gallery'    => false,
				'from_attachment' => false,
				'from_html'       => false,
			);
			foreach ( $methods as $method => $value ) {
				$methods[ $method ] = true;
				$images_collected = Jetpack_PostImages::get_images( $post->ID, $methods );
				if ( is_array( $images_collected ) ) {
					$media = array_merge( $media, $images_collected );
				}
				$methods[ $method ] = false;
			}

			$images = array();

			foreach ( $media as $item ) {
				if ( ! isset( $item['type'] ) || 'image' != $item['type'] ) {
					continue;
				}
				$one_image = array();

				if ( isset( $item['src'] ) ) {
					$one_image['image:loc'] = esc_url( $item['src'] );
					$one_image['image:title'] = sanitize_title_with_dashes( $name = pathinfo( $item['src'], PATHINFO_FILENAME ) );
				}

				$images[] = $one_image;
			}

			if ( ! empty( $images ) ) {
				$url['image:image'] = $images;
			}
		}

		if ( $post->post_modified_gmt && $post->post_modified_gmt != '0000-00-00 00:00:00' ) {
			$post_latest_mod = $post->post_modified_gmt;
		}
		if ( $post->comment_count > 0 ) {
			// last modified based on last comment
			$latest_comment_datetime = jetpack_get_approved_comments_max_datetime( $post->ID );
			if ( ! empty( $latest_comment_datetime ) ) {
				if ( is_null( $post_latest_mod ) || $latest_comment_datetime > $post_latest_mod ) {
					$post_latest_mod = $latest_comment_datetime;
				}
			}
			unset( $latest_comment_datetime );
		}
		if ( ! empty( $post_latest_mod ) ) {
			$latest_mod     = max( $latest_mod, $post_latest_mod );
			$url['lastmod'] = jetpack_w3cdate_from_mysql( $post_latest_mod );
		}
		unset( $post_latest_mod );
		if ( $post->post_type == 'page' ) {
			$url['changefreq'] = 'weekly';
			$url['priority']   = '0.6'; // set page priority above default priority of 0.5
		} else {
			$url['changefreq'] = 'monthly';
		}
		/**
		 * Filter associative array with data to build <url> node and its descendants for current post.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param array $url Data to build parent and children nodes for current post.
		 * @param int $post_id Current post ID.
		 */
		$url_node = apply_filters( 'jetpack_sitemap_url', $url, $post->ID );
		jetpack_sitemap_array_to_simplexml( array( 'url' => $url_node ), $tree );
		unset( $url );
	}
	wp_reset_postdata();
	$blog_home = array(
		'loc'        => esc_url( get_option( 'home' ) ),
		'changefreq' => 'daily',
		'priority'   => '1.0'
	);
	if ( ! empty( $latest_mod ) ) {
		$blog_home['lastmod'] = jetpack_w3cdate_from_mysql( $latest_mod );
		header( 'Last-Modified:' . mysql2date( 'D, d M Y H:i:s', $latest_mod, 0 ) . ' GMT' );
	}
	/**
	 * Filter associative array with data to build <url> node and its descendants for site home.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param array $blog_home Data to build parent and children nodes for site home.
	 */
	$url_node = apply_filters( 'jetpack_sitemap_url_home', $blog_home );
	jetpack_sitemap_array_to_simplexml( array( 'url' => $url_node ), $tree );
	unset( $blog_home );

	/**
	 * Filter data before rendering it as XML.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param SimpleXMLElement $tree Data tree for sitemap.
	 * @param string $latest_mod Date of last modification.
	 */
	$tree = apply_filters( 'jetpack_print_sitemap', $tree, $latest_mod );

	$xml = $tree->asXML();
	unset( $tree );
	if ( ! empty( $xml ) ) {
		set_transient( 'jetpack_sitemap', $xml, DAY_IN_SECONDS );
		echo $xml;
	}

	die();
}

/**
 * Prints the news XML sitemap conforming to the Sitemaps.org protocol.
 * Outputs an XML list of up to 1000 posts published in the last 2 days.
 *
 * @module sitemaps
 *
 * @link http://sitemaps.org/protocol.php Sitemaps.org protocol.
 */
function jetpack_print_news_sitemap() {

	$xml = get_transient( 'jetpack_news_sitemap' );

	if ( $xml ) {
		header( 'Content-Type: application/xml' );
		echo $xml;
		die();
	}

	global $wpdb, $post;

	/**
	 * Filter post types to be included in news sitemap.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param array $post_types Array with post types to include in news sitemap.
	 */
	$post_types = apply_filters( 'jetpack_sitemap_news_sitemap_post_types', array( 'post' ) );
	if ( empty( $post_types ) ) {
		return;
	}

	$post_types_in = array();
	foreach ( $post_types as $post_type ) {
		$post_types_in[] = $wpdb->prepare( '%s', $post_type );
	}
	$post_types_in_string = implode( ', ', $post_types_in );

	/**
	 * Filter limit of entries to include in news sitemap.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param int $count Number of entries to include in news sitemap.
	 */
	$limit        = apply_filters( 'jetpack_sitemap_news_sitemap_count', 1000 );
	$cur_datetime = current_time( 'mysql', true );

	$query = $wpdb->prepare( "
		SELECT p.ID, p.post_title, p.post_type, p.post_date, p.post_name, p.post_date_gmt, GROUP_CONCAT(t.name SEPARATOR ', ') AS keywords
		FROM
			$wpdb->posts AS p LEFT JOIN $wpdb->term_relationships AS r ON p.ID = r.object_id
			LEFT JOIN $wpdb->term_taxonomy AS tt ON r.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'post_tag'
			LEFT JOIN $wpdb->terms AS t ON tt.term_id = t.term_id
		WHERE
			post_status='publish' AND post_type IN ( {$post_types_in_string} ) AND post_date_gmt > (%s - INTERVAL 2 DAY)
		GROUP BY p.ID
		ORDER BY p.post_date_gmt DESC LIMIT %d", $cur_datetime, $limit );

	// URL to XSLT
	$xsl = get_option( 'permalink_structure' ) ? home_url( 'news-sitemap.xsl' ) : home_url( '/?jetpack-news-sitemap-xsl=true' );

	// Unless it's zh-cn for Simplified Chinese or zh-tw for Traditional Chinese,
	// trim national variety so an ISO 639 language code as required by Google.
	$language_code = strtolower( get_locale() );
	if ( in_array( $language_code, array( 'zh_tw', 'zh_cn' ) ) ) {
		$language_code = str_replace( '_', '-', $language_code );
	} else {
		$language_code = preg_replace( '/(_.*)$/i', '', $language_code );
	}

	header( 'Content-Type: application/xml' );
	ob_start();
	echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
	echo '<?xml-stylesheet type="text/xsl" href="' . esc_url( $xsl ) . '"?>' . "\n";
	echo '<!-- generator="jetpack-' . JETPACK__VERSION . '" -->' . "\n";
	?>
	<!-- generator="jetpack" -->
	<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
	        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
	        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
		>
		<?php
		$posts = $wpdb->get_results( $query );
		foreach ( $posts as $post ):
			setup_postdata( $post );

			/**
			 * Filter condition to allow skipping specific posts in news sitemap.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param bool $skip Current boolean. False by default, so no post is skipped.
			 * @param WP_POST $post Current post object.
			 */
			if ( apply_filters( 'jetpack_sitemap_news_skip_post', false, $post ) ) {
				continue;
			}

			$GLOBALS['post']                       = $post;
			$url                                   = array();
			$url['loc']                            = get_permalink( $post->ID );
			$news                                  = array();
			$news['news:publication']['news:name'] = get_bloginfo_rss( 'name' );
			$news['news:publication']['news:language'] = $language_code;
			$news['news:publication_date'] = jetpack_w3cdate_from_mysql( $post->post_date_gmt );
			$news['news:title']            = get_the_title_rss();
			if ( $post->keywords ) {
				$news['news:keywords'] = html_entity_decode( ent2ncr( $post->keywords ), ENT_HTML5 );
			}
			$url['news:news'] = $news;

			// Add image to sitemap
			$post_thumbnail = Jetpack_PostImages::get_image( $post->ID );
			if ( isset( $post_thumbnail['src'] ) ) {
				$url['image:image'] = array( 'image:loc' => esc_url( $post_thumbnail['src'] ) );
			}

			/**
			 * Filter associative array with data to build <url> node and its descendants for current post in news sitemap.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param array $url Data to build parent and children nodes for current post.
			 * @param int $post_id Current post ID.
			 */
			$url = apply_filters( 'jetpack_sitemap_news_sitemap_item', $url, $post );

			if ( empty( $url ) ) {
				continue;
			}

			jetpack_print_sitemap_item( $url );
		endforeach;
		wp_reset_postdata();
		?>
	</urlset>
	<?php
	$xml = ob_get_contents();
	ob_end_clean();
	if ( ! empty( $xml ) ) {
		set_transient( 'jetpack_news_sitemap', $xml, DAY_IN_SECONDS );
		echo $xml;
	}

	die();
}

/**
 * Absolute URL of the current blog's sitemap.
 *
 * @module sitemaps
 *
 * @return string Sitemap URL.
 */
function jetpack_sitemap_uri() {
	global $wp_rewrite;

	if ( $wp_rewrite->using_index_permalinks() ) {
		$sitemap_url = home_url( '/index.php/sitemap.xml' );
	} else if ( $wp_rewrite->using_permalinks() ) {
		$sitemap_url = home_url( '/sitemap.xml' );
	} else {
		$sitemap_url = home_url( '/?jetpack-sitemap=true' );
	}

	/**
	 * Filter sitemap URL relative to home URL.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param string $sitemap_url Sitemap URL.
	 */
	return apply_filters( 'jetpack_sitemap_location', $sitemap_url );
}

/**
 * Absolute URL of the current blog's news sitemap.
 *
 * @module sitemaps
 */
function jetpack_news_sitemap_uri() {
	global $wp_rewrite;

	if ( $wp_rewrite->using_index_permalinks() ) {
		$news_sitemap_url = home_url( '/index.php/news-sitemap.xml' );
	} else if ( $wp_rewrite->using_permalinks() ) {
		$news_sitemap_url = home_url( '/news-sitemap.xml' );
	} else {
		$news_sitemap_url = home_url( '/?jetpack-news-sitemap=true' );
	}

	/**
	 * Filter news sitemap URL relative to home URL.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param string $news_sitemap_url News sitemap URL.
	 */
	return apply_filters( 'jetpack_news_sitemap_location', $news_sitemap_url );
}

/**
 * Output the default sitemap URL.
 *
 * @module sitemaps
 */
function jetpack_sitemap_discovery() {
	echo 'Sitemap: ' . esc_url( jetpack_sitemap_uri() ) . PHP_EOL;
}

/**
 * Output the news sitemap URL.
 *
 * @module sitemaps
 */
function jetpack_news_sitemap_discovery() {
	echo 'Sitemap: ' . esc_url( jetpack_news_sitemap_uri() ) . PHP_EOL . PHP_EOL;
}

/**
 * Clear the sitemap cache when a sitemap action has changed.
 *
 * @module sitemaps
 *
 * @param int $post_id unique post identifier. not used.
 */
function jetpack_sitemap_handle_update( $post_id ) {
	delete_transient( 'jetpack_sitemap' );
	delete_transient( 'jetpack_news_sitemap' );
}

/**
 * Clear sitemap cache when an entry changes. Make sitemaps discoverable to robots. Render sitemaps.
 *
 * @module sitemaps
 */
function jetpack_sitemap_initialize() {
	add_action( 'publish_post', 'jetpack_sitemap_handle_update', 12, 1 );
	add_action( 'publish_page', 'jetpack_sitemap_handle_update', 12, 1 );
	add_action( 'trash_post', 'jetpack_sitemap_handle_update', 12, 1 );
	add_action( 'deleted_post', 'jetpack_sitemap_handle_update', 12, 1 );

	/**
	 * Filter whether to make the default sitemap discoverable to robots or not.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param bool $discover_sitemap Make default sitemap discoverable to robots.
	 */
	$discover_sitemap = apply_filters( 'jetpack_sitemap_generate', true );
	if ( $discover_sitemap ) {
		add_action( 'do_robotstxt', 'jetpack_sitemap_discovery', 5, 0 );

		if ( get_option( 'permalink_structure' ) ) {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			$sitemap = apply_filters( 'jetpack_sitemap_location', home_url( '/sitemap.xml' ) );
			$sitemap = parse_url( $sitemap, PHP_URL_PATH );
		} else {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			$sitemap = apply_filters( 'jetpack_sitemap_location', home_url( '/?jetpack-sitemap=true' ) );
			$sitemap = preg_replace( '/(=.*?)$/i', '', parse_url( $sitemap, PHP_URL_QUERY ) );
		}

		// Sitemap XML
		if ( preg_match( '#(' . $sitemap . ')$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET[ $sitemap ] ) && 'true' == $_GET[ $sitemap ] ) ) {
			// run later so things like custom post types have been registered
			add_action( 'init', 'jetpack_print_sitemap', 999 );
		}

		// XSLT for sitemap
		if ( preg_match( '#(/sitemap\.xsl)$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET['jetpack-sitemap-xsl'] ) && 'true' == $_GET['jetpack-sitemap-xsl'] ) ) {
			add_action( 'init', 'jetpack_print_sitemap_xsl' );
		}
	}

	/**
	 * Filter whether to make the news sitemap discoverable to robots or not.
	 *
	 * @module sitemaps
	 *
	 * @since 3.9.0
	 *
	 * @param bool $discover_news_sitemap Make default news sitemap discoverable to robots.
	 */
	$discover_news_sitemap = apply_filters( 'jetpack_news_sitemap_generate', true );
	if ( $discover_news_sitemap ) {
		add_action( 'do_robotstxt', 'jetpack_news_sitemap_discovery', 5, 0 );

		if ( get_option( 'permalink_structure' ) ) {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			$sitemap = apply_filters( 'jetpack_news_sitemap_location', home_url( '/news-sitemap.xml' ) );
			$sitemap = parse_url( $sitemap, PHP_URL_PATH );
		} else {
			/** This filter is documented in modules/sitemaps/sitemaps.php */
			$sitemap = apply_filters( 'jetpack_news_sitemap_location', home_url( '/?jetpack-news-sitemap=true' ) );
			$sitemap = preg_replace( '/(=.*?)$/i', '', parse_url( $sitemap, PHP_URL_QUERY ) );
		}

		// News Sitemap XML
		if ( preg_match( '#(' . $sitemap . ')$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET[ $sitemap ] ) && 'true' == $_GET[ $sitemap ] ) ) {
			// run later so things like custom post types have been registered
			add_action( 'init', 'jetpack_print_news_sitemap', 999 );
		}

		// XSLT for sitemap
		if ( preg_match( '#(/news-sitemap\.xsl)$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET['jetpack-news-sitemap-xsl'] ) && 'true' == $_GET['jetpack-news-sitemap-xsl'] ) ) {
			add_action( 'init', 'jetpack_print_news_sitemap_xsl' );
		}
	}
}

// Initialize sitemaps once themes can filter the initialization.
// add_action( 'after_setup_theme', 'jetpack_sitemap_initialize' );

}
