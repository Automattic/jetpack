<?php
/**
 * Sitemaps are stored in the database using a custom table. This class
 * provides a small API for storing and retrieving sitemap data so we can
 * avoid lots of explicit SQL juggling while building sitemaps. This file
 * also includes the SQL used to retrieve posts and images to be included
 * in the sitemaps.
 *
 * @since 4.7.0
 * @package Jetpack
 */

/**
 * This object handles any database interaction required
 * for sitemap generation.
 *
 * @since 4.7.0
 */
class Jetpack_Sitemap_Librarian {

	/**
	 * Master sitemap name string.
	 *
	 * @since 4.7.0
	 */
	const MASTER_SITEMAP_NAME = 'sitemap';

	/**
	 * Master sitemap type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const MASTER_SITEMAP_TYPE = 'jp_sitemap_master';

	/**
	 * Sitemap type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const SITEMAP_TYPE = 'jp_sitemap';

	/**
	 * Sitemap index type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const SITEMAP_INDEX_TYPE = 'jp_sitemap_index';

	/**
	 * Image sitemap type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const IMAGE_SITEMAP_TYPE = 'jp_img_sitemap';

	/**
	 * Image sitemap index type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const IMAGE_SITEMAP_INDEX_TYPE = 'jp_img_sitemap_index';

	/**
	 * Video sitemap type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const VIDEO_SITEMAP_TYPE = 'jp_vid_sitemap';

	/**
	 * Video sitemap index type string for custom database table.
	 *
	 * @since 4.7.0
	 */
	const VIDEO_SITEMAP_INDEX_TYPE = 'jp_vid_sitemap_index';

	/**
	 * The name prefix for sitemaps of the given type.
	 *
	 * @since 4.7.0
	 *
	 * @param string $type The sitemap type.
	 *
	 * @return string The sitemap name prefix.
	 */
	public static function name_prefix( $type ) {
		if ( self::SITEMAP_TYPE === $type ) {
			return 'sitemap-';
		} elseif ( self::SITEMAP_INDEX_TYPE === $type ) {
			return 'sitemap-index-';
		} elseif ( self::IMAGE_SITEMAP_TYPE === $type ) {
			return 'image-sitemap-';
		} elseif ( self::IMAGE_SITEMAP_INDEX_TYPE === $type ) {
			return 'image-sitemap-index-';
		} elseif ( self::VIDEO_SITEMAP_TYPE === $type ) {
			return 'video-sitemap-';
		} elseif ( self::VIDEO_SITEMAP_INDEX_TYPE === $type ) {
			return 'video-sitemap-index-';
		}
	}

	/**
	 * A human-friendly name for each sitemap type (for debug messages).
	 *
	 * @since 4.7.0
	 *
	 * @param string $type The sitemap type.
	 *
	 * @return string The sitemap debug name.
	 */
	public static function debug_name( $type ) {
		if ( self::SITEMAP_TYPE === $type ) {
			return 'Sitemap';
		} elseif ( self::SITEMAP_INDEX_TYPE === $type ) {
			return 'Sitemap Index';
		} elseif ( self::IMAGE_SITEMAP_TYPE === $type ) {
			return 'Image Sitemap';
		} elseif ( self::IMAGE_SITEMAP_INDEX_TYPE === $type ) {
			return 'Image Sitemap Index';
		} elseif ( self::VIDEO_SITEMAP_TYPE === $type ) {
			return 'Video Sitemap';
		} elseif ( self::VIDEO_SITEMAP_INDEX_TYPE === $type ) {
			return 'Video Sitemap Index';
		}
	}

	/**
	 * The index type corresponding to a sitemap type.
	 *
	 * @since 4.7.0
	 *
	 * @param string $type The sitemap type.
	 *
	 * @return string The index type.
	 */
	public static function index_type( $type ) {
		if ( self::SITEMAP_TYPE === $type ) {
			return self::SITEMAP_INDEX_TYPE;
		} elseif ( self::IMAGE_SITEMAP_TYPE === $type ) {
			return self::IMAGE_SITEMAP_INDEX_TYPE;
		} elseif ( self::VIDEO_SITEMAP_TYPE === $type ) {
			return self::VIDEO_SITEMAP_INDEX_TYPE;
		}
	}

	/**
	 * The index type corresponding to a sitemap type.
	 *
	 * @since 4.7.0
	 *
	 * @param string $type The index type.
	 *
	 * @return string The sitemap type.
	 */
	public static function sitemap_type( $type ) {
		if ( self::SITEMAP_INDEX_TYPE === $type ) {
			return self::SITEMAP_TYPE;
		} elseif ( self::IMAGE_SITEMAP_INDEX_TYPE === $type ) {
			return self::IMAGE_SITEMAP_TYPE;
		} elseif ( self::VIDEO_SITEMAP_INDEX_TYPE === $type ) {
			return self::VIDEO_SITEMAP_TYPE;
		}
	}

	/**
	 * Retrieve a single sitemap with given name and type.
	 * Returns null if no such sitemap exists.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $name Name of the sitemap to be retrieved.
	 * @param string $type Type of the sitemap to be retrieved.
	 *
	 * @return array $args {
	 *   @type int    $id        ID number of the sitemap in the database.
	 *   @type string $timestamp Most recent timestamp of the resources pointed to.
	 *   @type string $name      Name of the sitemap in the database. See *_NAME constants.
	 *   @type string $type      Type of the sitemap in the database. See *_TYPE constants.
	 *   @type string $text      The content of the sitemap.
	 * }
	 */
	public function read_sitemap_data( $name, $type ) {
		$the_post = get_page_by_title( $name, 'OBJECT', $type );

		if ( null === $the_post ) {
			return null;
		} else {
			return array(
				'id'        => $the_post->ID,
				'timestamp' => $the_post->post_date,
				'name'      => $the_post->post_title,
				'type'      => $the_post->post_type,
				'text'      => $the_post->post_content,
			);
		}
	}

	/**
	 * Store a sitemap in the database under a given type and name.
	 * Note that the sitemap contents are run through esc_html before
	 * being stored, and the timestamp reencoded as 'Y-m-d H:i:s'.
	 *
	 * If a sitemap with that type and name does not exist, create it.
	 * If a sitemap with that type and name does exist, update it.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $name Name of the sitemap to be stored.
	 * @param string $type Type of the sitemap to be stored.
	 * @param string $contents Contents of the sitemap to be stored.
	 * @param string $timestamp Timestamp of the sitemap to be stored, in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function store_sitemap_data( $name, $type, $contents, $timestamp ) {
		$the_post = get_page_by_title( $name, 'OBJECT', $type );

		if ( null === $the_post ) {
			// Post does not exist.
			wp_insert_post(array(
				'post_title'   => $name,
				'post_content' => esc_html( $contents ),
				'post_type'    => $type,
				'post_date'    => date( 'Y-m-d H:i:s', strtotime( $timestamp ) ),
			));
		} else {
			// Post does exist.
			wp_insert_post(array(
				'ID'           => $the_post->ID,
				'post_title'   => $name,
				'post_content' => esc_html( $contents ),
				'post_type'    => $type,
				'post_date'    => date( 'Y-m-d H:i:s', strtotime( $timestamp ) ),
			));
		}
		return;
	}

	/**
	 * Delete a sitemap by name and type.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $name Row name.
	 * @param string $type Row type.
	 *
	 * @return bool 'true' if a row was deleted, 'false' otherwise.
	 */
	public function delete_sitemap_data( $name, $type ) {
		$the_post = get_page_by_title( $name, 'OBJECT', $type );

		if ( null === $the_post ) {
			return false;
		} else {
			wp_delete_post( $the_post->ID );
			return true;
		}
	}

	/**
	 * Retrieve the contents of a sitemap with given name and type.
	 * If no such sitemap exists, return the empty string. Note that the
	 * returned string is run through wp_specialchars_decode.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $name Row name.
	 * @param string $type Row type.
	 *
	 * @return string Text of the specified sitemap, or the empty string.
	 */
	public function get_sitemap_text( $name, $type ) {
		$row = $this->read_sitemap_data( $name, $type );

		if ( null === $row ) {
			return '';
		} else {
			return wp_specialchars_decode( $row['text'], ENT_QUOTES );
		}
	}

	/**
	 * Delete numbered sitemaps named prefix-(p+1), prefix-(p+2), ...
	 * until the first nonexistent sitemap is found.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int    $position Number before the first sitemap to be deleted.
	 * @param string $type Sitemap type.
	 */
	public function delete_numbered_sitemap_rows_after( $position, $type ) {
		$any_left = true;

		$prefix = self::name_prefix( $type );

		while ( true === $any_left ) {
			$position += 1;
			$any_left = $this->delete_sitemap_data( $prefix . $position, $type );
		}

		return;
	}

	/**
	 * Deletes all stored sitemap data.
	 *
	 * @access public
	 * @since 4.7.0
	 */
	public function delete_all_stored_sitemap_data() {
		$this->delete_sitemap_data(
			self::MASTER_SITEMAP_NAME, self::MASTER_SITEMAP_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::SITEMAP_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::SITEMAP_INDEX_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::IMAGE_SITEMAP_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::IMAGE_SITEMAP_INDEX_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::VIDEO_SITEMAP_TYPE
		);

		$this->delete_numbered_sitemap_rows_after(
			0, self::VIDEO_SITEMAP_INDEX_TYPE
		);
		return;
	}

	/**
	 * Retrieve an array of sitemap rows (of a given type) sorted by ID.
	 *
	 * Returns the smallest $num_posts sitemap rows (measured by ID)
	 * of the given type which are larger than $from_id.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param string $type Type of the sitemap rows to retrieve.
	 * @param int    $from_id Greatest lower bound of retrieved sitemap post IDs.
	 * @param int    $num_posts Largest number of sitemap posts to retrieve.
	 *
	 * @return array The sitemaps, as an array of associative arrays.
	 */
	public function query_sitemaps_after_id( $type, $from_id, $num_posts ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT *
					FROM $wpdb->posts
					WHERE post_type=%s
						AND ID>%d
					ORDER BY ID ASC
					LIMIT %d;",
				$type,
				$from_id,
				$num_posts
			),
			ARRAY_A
		); // WPCS: db call ok; no-cache ok.
	}

	/**
	 * Retrieve an array of posts sorted by ID.
	 *
	 * More precisely, returns the smallest $num_posts posts
	 * (measured by ID) which are larger than $from_id.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int $from_id Greatest lower bound of retrieved post IDs.
	 * @param int $num_posts Largest number of posts to retrieve.
	 *
	 * @return array The posts.
	 */
	public function query_posts_after_id( $from_id, $num_posts ) {
		global $wpdb;

		// Get the list of post types to include and prepare for query.
		$post_types = Jetpack_Options::get_option_and_ensure_autoload(
			'jetpack_sitemap_post_types',
			array( 'page', 'post' )
		);
		foreach ( (array) $post_types as $i => $post_type ) {
			$post_types[ $i ] = $wpdb->prepare( '%s', $post_type );
		}
		$post_types_list = join( ',', $post_types );

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT *
					FROM $wpdb->posts
					WHERE post_status='publish'
						AND post_type IN ($post_types_list)
						AND ID>%d
					ORDER BY ID ASC
					LIMIT %d;",
				$from_id,
				$num_posts
			)
		); // WPCS: db call ok; no-cache ok.
	}

	/**
	 * Get the most recent timestamp among approved comments for the given post_id.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int $post_id Post identifier.
	 *
	 * @return int Timestamp in 'Y-m-d h:i:s' format (UTC) of the most recent comment on the given post, or null if no such comments exist.
	 */
	public function query_latest_approved_comment_time_on_post( $post_id ) {
		global $wpdb;

		return $wpdb->get_var(
			$wpdb->prepare(
				"SELECT MAX(comment_date_gmt)
					FROM $wpdb->comments
					WHERE comment_post_ID = %d AND comment_approved = '1' AND comment_type=''",
				$post_id
			)
		);
	}

	/**
	 * Retrieve an array of image posts sorted by ID.
	 *
	 * More precisely, returns the smallest $num_posts image posts
	 * (measured by ID) which are larger than $from_id.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int $from_id Greatest lower bound of retrieved image post IDs.
	 * @param int $num_posts Largest number of image posts to retrieve.
	 *
	 * @return array The posts.
	 */
	public function query_images_after_id( $from_id, $num_posts ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT *
					FROM $wpdb->posts
					WHERE post_type='attachment'
						AND post_mime_type IN ('image/jpeg','image/png','image/gif')
						AND ID>%d
					ORDER BY ID ASC
					LIMIT %d;",
				$from_id,
				$num_posts
			)
		); // WPCS: db call ok; no-cache ok.
	}

	/**
	 * Retrieve an array of video posts sorted by ID.
	 *
	 * More precisely, returns the smallest $num_posts video posts
	 * (measured by ID) which are larger than $from_id.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int $from_id Greatest lower bound of retrieved video post IDs.
	 * @param int $num_posts Largest number of video posts to retrieve.
	 *
	 * @return array The posts.
	 */
	public function query_videos_after_id( $from_id, $num_posts ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT *
					FROM $wpdb->posts
					WHERE post_type='attachment'
						AND post_mime_type IN ('video/mpeg','video/wmv','video/mov','video/avi','video/ogg')
						AND ID>%d
					ORDER BY ID ASC
					LIMIT %d;",
				$from_id,
				$num_posts
			)
		); // WPCS: db call ok; no-cache ok.
	}

	/**
	 * Retrieve an array of published posts from the last 2 days.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param int $num_posts Largest number of posts to retrieve.
	 *
	 * @return array The posts.
	 */
	public function query_most_recent_posts( $num_posts ) {
		global $wpdb;

		$two_days_ago = date( 'Y-m-d', strtotime( '-2 days' ) );

		/**
		 * Filter post types to be included in news sitemap.
		 *
		 * @module sitemaps
		 *
		 * @since 3.9.0
		 *
		 * @param array $post_types Array with post types to include in news sitemap.
		 */
		$post_types = apply_filters(
			'jetpack_sitemap_news_sitemap_post_types',
			array( 'page', 'post' )
		);

		foreach ( (array) $post_types as $i => $post_type ) {
			$post_types[ $i ] = $wpdb->prepare( '%s', $post_type );
		}

		$post_types_list = join( ',', $post_types );

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT *
					FROM $wpdb->posts
					WHERE post_status='publish'
						AND post_date >= '%s'
						AND post_type IN ($post_types_list)
					ORDER BY post_date DESC
					LIMIT %d;",
				$two_days_ago,
				$num_posts
			)
		); // WPCS: db call ok; no-cache ok.
	}

}
