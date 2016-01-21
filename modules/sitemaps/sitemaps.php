<?php
/**
 * Generate sitemap files in base XML as well as popular namespace extensions.
 *
 * @author Automattic
 * @link http://sitemaps.org/protocol.php Base sitemaps protocol.
 * @link http://www.google.com/support/webmasters/bin/answer.py?answer=74288 Google news sitemaps.
 */


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
		if ( false !== strpos( $key, ':' ) ) {
			list( $namespace_prefix, $key ) = explode( ':', $key );
			if ( isset( $doc_namespaces[ $namespace_prefix ] ) ) {
				$namespace = $doc_namespaces[ $namespace_prefix ];
			}
		}

		if ( is_array( $value ) ) {
			$child = $tree->addChild( $key, null, $namespace );
			jetpack_sitemap_array_to_simplexml( $value, $child );
		} else {
			$tree->addChild( $key, esc_html( $value ), $namespace );
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
	// URL to XSLT
	$xsl = get_option( 'permalink_structure' ) ? home_url( '/sitemap.xsl' ) : home_url( '/?jetpack-sitemap-xsl=true' );

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
	global $wpdb;

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

	// Acquire necessary attachment data for all of the posts in a performant manner
	$attachment_parents = wp_list_pluck( $posts, 'ID' );
	$post_attachments   = array();
	while ( $sub_posts = array_splice( $attachment_parents, 0, 100 ) ) {
		$post_parents = implode( ',', array_map( 'intval', $sub_posts ) );

		// Get the attachment IDs for all posts. We need to see how many
		// attachments each post parent has and limit it to 5.
		$query                = "SELECT ID, post_parent FROM {$wpdb->posts} WHERE post_parent IN ({$post_parents}) AND post_type='attachment' AND ( post_mime_type='image/jpeg' OR post_mime_type='image/png' ) LIMIT 0,1000;";
		$all_attachments      = $wpdb->get_results( $query );
		$selected_attachments = array();
		$attachment_count     = array();

		foreach ( $all_attachments as $attachment ) {
			if ( ! isset( $attachment_count[ $attachment->post_parent ] ) ) {
				$attachment_count[ $attachment->post_parent ] = 0;
			}

			// Skip this particular attachment if we already have 5 for the post
			if ( $attachment_count[ $attachment->post_parent ] >= 5 ) {
				continue;
			}

			$selected_attachments[] = $attachment->ID;
			$attachment_count[ $attachment->post_parent ] ++;
		}

		// bail if there weren't any attachments to avoid an extra query
		if ( empty( $selected_attachments ) ) {
			continue;
		}

		// Get more of the attachment object for the attachments we actually care about
		$attachment_ids   = implode( ',', array_map( 'intval', $selected_attachments ) );
		$query            = "SELECT p.ID, p.post_parent, p.post_title, p.post_excerpt, p.guid FROM {$wpdb->posts} as p WHERE p.ID IN ({$attachment_ids}) AND p.post_type='attachment' AND ( p.post_mime_type='image/jpeg' OR p.post_mime_type='image/png' ) LIMIT 500;";
		$attachments      = $wpdb->get_results( $query );
		$post_attachments = array_merge( $post_attachments, $attachments );
	}

	unset( $initstr );
	$latest_mod = '';
	foreach ( $posts as $post ) {

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
		if ( ! post_password_required( $post->ID ) && $attachments = wp_filter_object_list( $post_attachments, array( 'post_parent' => $post->ID ) ) ) {

			$url['image:image'] = array();

			foreach ( $attachments as $attachment ) {
				$attachment_url = wp_get_attachment_url( $attachment->ID );

				if ( $attachment_url ) {
					$url['image:image']['loc'] = esc_url( $attachment_url );
				}

				// Only include title if not empty.
				/** This filter is documented in wp-includes/feed.php */
				if ( $attachment_title = apply_filters( 'the_title_rss', $attachment->post_title ) ) {
					$url['image:image']['title'] = html_entity_decode( esc_html( $attachment_title ), ENT_XML1 );
				}

				// Only include caption if not empty.
				/** This filter is documented in wp-includes/feed.php */
				if ( $attachment_caption = apply_filters( 'the_excerpt_rss', $attachment->post_excerpt ) ) {
					$url['image:image']['caption'] = html_entity_decode( esc_html( $attachment_caption ), ENT_XML1 );
				}
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

	global $wpdb;

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
			if ( function_exists( 'get_blog_lang_code' ) ) {
				$news['news:publication']['news:language'] = get_blog_lang_code();
			}
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
	if ( get_option( 'permalink_structure' ) ) {
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
	if ( get_option( 'permalink_structure' ) ) {
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

		// Sitemap XML
		if ( preg_match( '#(/sitemap\.xml)$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET['jetpack-sitemap'] ) && 'true' == $_GET['jetpack-sitemap'] ) ) {
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

		// News Sitemap XML
		if ( preg_match( '#(/news-sitemap\.xml)$#i', $_SERVER['REQUEST_URI'] ) || ( isset( $_GET['jetpack-news-sitemap'] ) && 'true' == $_GET['jetpack-news-sitemap'] ) ) {
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
add_action( 'after_setup_theme', 'jetpack_sitemap_initialize' );