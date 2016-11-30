<?php

class Jetpack_Custom_CSS_Data_Migration {
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'register_legacy_post_type' ) );

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			function jetpack_custom_css_data_migration_cli() {
				$result = Jetpack_Custom_CSS_Data_Migration::do_migration();
				if ( $result ) {
					WP_CLI::success( sprintf( __( '%d revisions migrated.', 'jetpack' ), $result ) );
					return;
				}
				WP_CLI::error( __( 'No revisions to migrate.', 'jetpack' ) );
			}
			WP_CLI::add_command( 'jetpack custom-css migrate', 'jetpack_custom_css_data_migration_cli' );
		}
	}

	public static function do_migration() {
		Jetpack_Options::update_option( 'custom_css_4.7_migration', true );
		Jetpack::log( 'custom_css_4.7_migration', 'start' );

		if ( ! post_type_exists( 'safecss' ) ) {
			self::register_legacy_post_type();
		}

		$core_css_post      = wp_get_custom_css_post();
		$current_stylesheet = get_stylesheet();

		$revisions = self::get_all_revisions();
		if ( empty( $revisions ) || ! is_array( $revisions ) ) {
			return null;
		}

		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors        = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		$jetpack_css_post     = self::get_post();
		$jetpack_css_revision = reset( $revisions ); // get first element of array -- newest revision.
		$revisions            = array_reverse( $revisions );
		$themes               = self::get_themes();
		$themes_posts         = array();
		$migrated             = array();

		foreach ( $revisions as $post_id => $post ) {
			// Jetpack had stored the theme Name, not the stylesheet directory, for ... reasons.
			// Get the stylesheet.  If null, the theme is no longer available.  Skip.
			$stylesheet = isset( $themes[ $post->post_excerpt ] ) ? $themes[ $post->post_excerpt ] : null;
			if ( empty( $stylesheet ) ) {
				continue;
			}

			$migrated[] = $post->ID;
			$preprocessor = get_post_meta( $post->ID, 'custom_css_preprocessor', true );
			$css = $post->post_content;
			$pre = null;

			if ( $preprocessor && isset( $preprocessors[ $preprocessor ] ) ) {
				$preprocessor = 'less';
				$pre = $css;
				$css = call_user_func( $preprocessors[ $preprocessor ]['callback'], $pre );
			}

			// Do we need to remove any filters here for users without `unfiltered_html` ?

			// Format here into calls to wp_insert_post() or wp_update_post()
			$args = array(
				'post_content'          => $css,
				'post_content_filtered' => $pre,
				'post_title'            => $stylesheet,
				'post_name'             => sanitize_title( $stylesheet ),
				'post_type'             => 'custom_css',
				'post_status'           => 'publish',
				'post_author'           => $post->post_author,
				'post_modified'         => $post->post_modified,
				'post_modified_gmt'     => $post->post_modified_gmt,
			);

			// Run one quick query to determine if we have a post for that theme.
			if ( empty( $themes_posts[ $stylesheet ] ) ) {
				$core_post = wp_get_custom_css_post( $stylesheet );
				$themes_posts[ $stylesheet ] = ( $core_post instanceof WP_Post ) ? $core_post->ID : null;
			}

			if ( $themes_posts[ $stylesheet ] ) {
				$args['ID'] = $themes_posts[ $stylesheet ];
				// We already know the ID, so no need to save the return value.
				wp_update_post( wp_slash( $args ) );
			} else {
				// This is a new post we're stashing it under, so save the ID.
				$themes_posts[ $stylesheet ] = wp_insert_post( wp_slash( $args ) );
			}
		}

		// Migrate the settings from revision meta to theme mod.
		$options = self::get_options( $jetpack_css_revision->ID );
		set_theme_mod( 'jetpack_custom_css', $options );

		// If we've migrated some CSS for the current theme and there was already something there in the Core dataset ...
		if ( isset( $jetpack_latest_theme_revisions[ $current_stylesheet ] ) && $core_css_post && $jetpack_css_revision ) {
			$preprocessor = $options['preprocessor'];

			$css = $core_css_post->post_content;
			$pre = $core_css_post->post_content_filtered;
			if ( $preprocessor ) {
				if ( $pre ) {
					$pre .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				}
				$pre .= $jetpack_css_revision->post_content_filtered;

				$css .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				$css .= call_user_func( $preprocessors[ $preprocessor ]['callback'], $jetpack_css_revision->post_content_filtered );
			} else {
				$css .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				$css .= $jetpack_css_revision->post_content;
			}

			wp_update_post( array(
				'ID'                    => $core_css_post->ID,
				'post_content'          => $css,
				'post_content_filtered' => $pre,
			) );
		}

		// delete the old posts stored in $to_delete.

		Jetpack::log( 'custom_css_4.7_migration', sizeof( $migrated ) . 'revisions migrated' );
		return sizeof( $migrated );
	}

	public static function register_legacy_post_type() {
		if ( post_type_exists( 'safecss' ) ) {
			return;
		}
		// Register safecss as a custom post_type
		// Explicit capability definitions are largely unnecessary because the posts are manipulated in code via an options page, managing CSS revisions does check the capabilities, so let's ensure that the proper caps are checked.
		register_post_type( 'safecss', array(
			'label'        => 'Custom CSS',
			'supports'     => array( 'revisions' ),
			'can_export'   => false,
			'rewrite'      => false,
			'capabilities' => array(
				'edit_post'          => 'edit_theme_options',
				'read_post'          => 'read',
				'delete_post'        => 'edit_theme_options',
				'edit_posts'         => 'edit_theme_options',
				'edit_others_posts'  => 'edit_theme_options',
				'publish_posts'      => 'edit_theme_options',
				'read_private_posts' => 'read',
			),
		) );
	}

	public static function get_post() {
		/**
		 * Filter the ID of the post where Custom CSS is stored, before the ID is retrieved.
		 *
		 * If the callback function returns a non-null value, then post_id() will immediately
		 * return that value, instead of retrieving the normal post ID.
		 *
		 * @module custom-css
		 *
		 * @since 3.8.1
		 *
		 * @param null null The ID to return instead of the normal ID.
		 */
		$custom_css_post_id = apply_filters( 'jetpack_custom_css_pre_post_id', null );
		if ( ! is_null( $custom_css_post_id ) ) {
			return get_post( $custom_css_post_id );
		}

		$custom_css_post_id = wp_cache_get( 'custom_css_post_id' );

		if ( false === $custom_css_post_id ) {
			$custom_css_posts = get_posts( array(
				'posts_per_page' => 1,
				'post_type'      => 'safecss',
				'post_status'    => 'publish',
				'orderby'        => 'date',
				'order'          => 'DESC',
			) );

			$custom_css_post_id = 0;
			if ( count( $custom_css_posts ) > 0 ) {
				$custom_css_post_id = $custom_css_posts[0]->ID;
			}

			// Save post_id=0 to note that no safecss post exists.
			wp_cache_set( 'custom_css_post_id', $custom_css_post_id );
		}

		if ( ! $custom_css_post_id ) {
			return false;
		}

		return get_post( $custom_css_post_id );
	}

	public static function get_all_revisions() {
		$post = self::get_post();
		$revisions = wp_get_post_revisions( $post->ID, array(
			'posts_per_page' => -1,
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );

		return $revisions;
	}

	public static function get_options( $post_id = null ) {
		if ( empty( $post_id ) ) {
			$post = self::get_post();
			$post_id = $post->ID;
		}

		$meta = get_post_meta( $post_id );

		return array(
			'preprocessor'  => isset( $meta['custom_css_preprocessor'][0] ) ? $meta['custom_css_preprocessor'][0] : '',
			'replace'       => isset( $meta['custom_css_add'][0] )          ? $meta['custom_css_add'][0]          : '',
			'content_width' => isset( $meta['content_width'][0] )           ? $meta['content_width'][0]           : '',
		);
	}

	public static function get_themes() {
		$themes = wp_get_themes( array( 'errors' => null ) );
		$all = array();
		foreach ( $themes as $theme ) {
			$all[ $theme->name ] = $theme->stylesheet;
		}
		return $all;
	}
}

Jetpack_Custom_CSS_Data_Migration::add_hooks();
