<?php
/**
 * Update post titles since Nov 28, 2019, to undo the lodash escaping
 * introduced in https://github.com/WordPress/gutenberg/pull/18616
 *
 * This class can be access via the WP CLI subcommand `wp wpcomsh post-titles-data-migration`
 *
 * @see pbAok1-dx-p2
 */

if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 * Update post titles since Nov 28, 2019, to undo the lodash escaping
 * introduced in https://github.com/WordPress/gutenberg/pull/18616
 *
 * See pbAok1-dx-p2
 */
class WPCOM_Post_Titles_Migration_Helper {
	/**
	 * This is ultimately what we want to reverse.
	 * See https://github.com/lodash/lodash/blob/3f585df/escape.js#L3-L7
	 */
	const LODASH_HTML_ESCAPES = [
		'&amp;' => '&',
		'&lt;' => '<',
		'&gt;' => '>',
		'&quot;' => '"',
		'&#39;' => "'",
		'&#039;' => "'",
	];

	// Release date based on timestamp of this commit: r200056-wpcom
	const GUTENBERG_7_RELEASE_DATE = '2019-11-28 14:18:23';

	/**
	 * Checks if title changed between last pre G7 (non-infected) revision and any post G7 revisions
	 */
	private static function confirm_title_updated_during_infection_period( $post ) {
		$gutenberg_release_datetime = strtotime( self::GUTENBERG_7_RELEASE_DATE );
		$revisions = wp_get_post_revisions( $post->ID );// defaults to `ORDER BY ID DESC` (hence latest first)

		// revisions falling after G 7.0 release
		$revisions_since_G7_release = array_filter(
			$revisions,
			function( $revision ) use ( $gutenberg_release_datetime ) {
				if ( strtotime( $revision->post_modified_gmt ) >= $gutenberg_release_datetime ) {
					return true;
				}
				return false;
			}
		);

		// all revisions happened during infectious period
		if ( count( $revisions ) === count( $revisions_since_G7_release ) ) {
			return true;
		}

		// no revisions during infectious period
		if ( 0 === count( $revisions_since_G7_release ) ) {
			return false;
		}

		// find revisions before G 7.0 release
		$revision_ids_before_G7_release = array_diff( array_keys( $revisions ), array_keys( $revisions_since_G7_release ) );
		if ( ! $revision_ids_before_G7_release ) {
			return true;
		}

		// get last revision before G 7.0 release
		$pre_infection_revision = $revisions[ reset( $revision_ids_before_G7_release ) ];

		foreach ( $revisions_since_G7_release as $revision ) {
			// if last known non-infected title is different than post-infection revisions'
			if ( $revision->post_title !== $pre_infection_revision->post_title ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param bool $dry_run Whether to migrate the infected posts
	 * @param array $logger A custom logger to log triples of { id, title, curated title }
	 */
	private static function process_infected_posts( $blog_id, $logger, $dry_run = true ) {
		$logger['info']( sprintf( 'Start processing blog %d', $blog_id ) );
		$event = 'post_titles_migration';

		if ( ! $dry_run ) {
			error_log( 'Starting cleanup' );
		}

		$all_posts = get_posts( [
			'numberposts' => -1,
			'date_query' => [
				'column' => 'post_modified_gmt',
				'after' => self::GUTENBERG_7_RELEASE_DATE
			],
		] );

		$regex = '/' . implode( '|', array_keys( self::LODASH_HTML_ESCAPES ) ) . '/';
		$gutenberg_release_datetime = strtotime( self::GUTENBERG_7_RELEASE_DATE );

		$num_posts_cleaned = 0;

		foreach( $all_posts as $post ) {
			$line = "";

			// --------------------------------------------------------------------
			// Check 1: Bail if title does not contain the escape entities
			// --------------------------------------------------------------------
			if ( ! preg_match( $regex, $post->post_title ) ) {
				continue;
			}

			// --------------------------------------------------------------------
			// Check 2: Bail if title has not been updated since G 7.0 release date
			// --------------------------------------------------------------------
			if ( ! self::confirm_title_updated_during_infection_period( $post ) ) {
				continue;
			}

			$curated_title = str_ireplace(
				array_keys( self::LODASH_HTML_ESCAPES ),
				array_values( self::LODASH_HTML_ESCAPES ),
				$post->post_title
			);

			// The following line is commented out because in Atomic environments wp_kses will not be applied when the post is updated
			// $save_ready_title = wp_kses( $curated_title, 'title_save_pre' );
			$save_ready_title = $curated_title;

			// No action if no change (title may have been updated with old editor/ non-Gutenberg)
			if ( $save_ready_title === $post->post_title ) {
				continue;
			}

			$csv_log = array(
				$blog_id,
				$post->ID,
				$post->post_title,
				$curated_title,
				$save_ready_title
			);

			if ( $dry_run ) {
				// Fail if we can't log
				if ( ! $logger['csv']( $csv_log ) ) {
					return false;
				}
				continue;
			}

			$updated_post_id = wp_update_post( [
				'ID' => $post->ID,
				'post_title' => $save_ready_title,
			] );

			if ( is_wp_error( $updated_post_id ) ) {
				$logger['error']( $updated_post_id->get_error_message() );
				// we are not updating as expected - fail
				return false;
			}

			$num_posts_cleaned++;

			if ( 0 === $num_posts_cleaned % 100 ) {
				/*
				 * We've done 100 successful updates
				 *   - Clear the object cache to prevent OOM
				 *   - Sleep 3 secs to give DB time to replicate
				 * See https://wpvip.com/documentation/writing-custom-wp-cli-commands/
				 */
				self::stop_the_insanity();
				sleep( 3 );
			}

			$logger['csv']( $csv_log );
		}

		if ( ! $dry_run ) {
			error_log( sprintf( 'Finished: cleaned %d post titles', $num_posts_cleaned ) );
		}

		if ( $num_posts_cleaned ) {
			// Sleep 3 secs to make sure we give DB time to replicate in case we haven't reached 100 posts (or processed more)
			sleep( 3 );
		}

		// all processed - logged and/or updated
		return true;
	}

	private static function file_logger( $file_handle ) {
		$just_log = function( $content ) {
			echo $content . PHP_EOL;
			return true;
		};

		$just_log_csv = function( $content ) use ( $file_handle ) {
			if ( fputcsv( $file_handle, $content ) === false ) {
				echo "Cannot write to file";
				return false;
			}
			return true;
		};

		return [
			'csv' => $just_log_csv,
			'info' => $just_log,
			'error' => $just_log,
		];
	}

	/**
	 * @returns true/false depending on success
	 */
	public static function migrate_infected_posts( $blog_id, $dry_run = false, $write_to_csv ) {
		$filename = $write_to_csv ?? 'php://stdout';
		$file_handle = fopen( $filename, 'w' );
		$logger = self::file_logger( $file_handle );
		$curated = self::process_infected_posts( $blog_id, $logger, $dry_run );

		fclose( $file_handle );

		if ( empty( trim( file_get_contents( $filename ) ) ) ) {
			unlink( $filename );
		}

		return $curated;
	}

	/**
	 * Workaround to prevent memory leaks from growing variables
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 * @global WP_Object_Cache $wp_object_cache Class that implements an object cache.
	 */
	public static function stop_the_insanity() {
		global $wpdb, $wp_object_cache;
		$wpdb->queries = array(); // or define( 'WP_IMPORTING', true );
		if ( ! is_object( $wp_object_cache ) ) {
			return;
		}
		$wp_object_cache->group_ops = array();
		$wp_object_cache->stats = array();
		$wp_object_cache->memcache_debug = array();
		$wp_object_cache->cache = array();
		if ( method_exists( $wp_object_cache, '__remoteset' ) ) {
			$wp_object_cache->__remoteset();
		}
	}
}
