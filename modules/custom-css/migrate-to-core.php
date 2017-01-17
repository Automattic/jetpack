<?php
/**
 * Migration from Jetpack Custom CSS to WordPress' Core CSS.
 *
 * @since 4.4.2
 *
 * @package Jetpack
 */

/**
 * Class Jetpack_Custom_CSS_Data_Migration
 */
class Jetpack_Custom_CSS_Data_Migration {
	/**
	 * Set up assorted actions and filters used by this class.
	 */
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'register_legacy_post_type' ) );
		add_action( 'admin_init', array( __CLASS__, 'do_migration' ) );

		include_once( dirname( __FILE__ ) . '/custom-css.php' );
		if ( ! is_admin() ) {
			add_action( 'init', array( 'Jetpack_Custom_CSS', 'init' ) );
		}
	}

	/**
	 * Do the bulk of the migration.
	 *
	 * @return int|null
	 */
	public static function do_migration() {
		Jetpack_Options::update_option( 'custom_css_4.7_migration', true );
		Jetpack::log( 'custom_css_4.7_migration', 'start' );

		if ( ! post_type_exists( 'safecss' ) ) {
			self::register_legacy_post_type();
		}

		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors      = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		$core_css_post      = wp_get_custom_css_post();
		$jetpack_css_post   = self::get_post();
		$revisions          = self::get_all_revisions();

		// Migrate the settings from revision meta to theme mod.
		$options = self::get_options( $jetpack_css_post->ID );
		set_theme_mod( 'jetpack_custom_css', $options );

		if ( empty( $revisions ) || ! is_array( $revisions ) ) {
			if ( $jetpack_css_post instanceof WP_Post ) {
				// Feed in the raw, if the current setting is Sass/LESS, it'll filter it inside.
				wp_update_custom_css_post( $jetpack_css_post->post_content );
				return 1;
			}
			return null;
		}

		$revisions            = array_reverse( $revisions );
		$themes               = Jetpack_Custom_CSS_Enhancements::get_themes();
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
			$pre = '';

			// Do a revision by revision parsing.
			if ( $preprocessor && isset( $preprocessors[ $preprocessor ] ) ) {
				$pre = $css;
				$css = call_user_func( $preprocessors[ $preprocessor ]['callback'], $pre );
			}

			// Do we need to remove any filters here for users without `unfiltered_html` ?
			wp_update_custom_css_post( $css, array(
				'stylesheet'   => $stylesheet,
				'preprocessed' => $pre,
			) );
		}

		// If we've migrated some CSS for the current theme and there was already something there in the Core dataset ...
		if ( $core_css_post && $jetpack_css_post ) {
			$preprocessor = $options['preprocessor'];

			$css = $core_css_post->post_content;
			$pre = $core_css_post->post_content_filtered;
			if ( $preprocessor ) {
				if ( $pre ) {
					$pre .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				}
				$pre .= $jetpack_css_post->post_content;

				$css .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				$css .= call_user_func( $preprocessors[ $preprocessor ]['callback'], $jetpack_css_post->post_content );
			} else {
				$css .= "\r\n\r\n/*\r\n\t" . esc_js( __( 'CSS Migrated from Jetpack:', 'jetpack' ) ) . "\r\n*/\r\n\r\n";
				$css .= $jetpack_css_post->post_content;
			}

			wp_update_custom_css_post( $css, array(
				'preprocessed' => $pre,
			) );
		}

		Jetpack::log( 'custom_css_4.7_migration', count( $migrated ) . 'revisions migrated' );
		return count( $migrated );
	}

	/**
	 * Re-register the legacy CPT so we can play with the content already in the database.
	 */
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

	/**
	 * Get the post used for legacy storage.
	 *
	 * Jetpack used to use a single post for all themes, just blanking it on theme switch.  This gets that post.
	 *
	 * @return array|bool|null|WP_Post
	 */
	public static function get_post() {
		/** This filter is documented in modules/custom-css/custom-css.php */
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

	/**
	 * Get all revisions of the Jetpack CSS CPT entry.
	 *
	 * @return array
	 */
	public static function get_all_revisions() {
		$post = self::get_post();

		if ( ! $post ) {
			return array();
		}

		$revisions = wp_get_post_revisions( $post->ID, array(
			'posts_per_page' => -1,
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );

		return $revisions;
	}

	/**
	 * Get the options stored for a given revision ID.
	 *
	 * Jetpack used to version the settings by storing them as meta on the revision.
	 *
	 * @param integer $post_id Post ID.
	 *
	 * @return array
	 */
	public static function get_options( $post_id = null ) {
		if ( empty( $post_id ) ) {
			$post = self::get_post();
			$post_id = $post->ID;
		}

		$meta = get_post_meta( $post_id );

		$replace = false;
		if ( isset( $meta['custom_css_add'][0] ) && 'no' === $meta['custom_css_add'][0] ) {
			$replace = true;
		}

		return array(
			'preprocessor'  => isset( $meta['custom_css_preprocessor'][0] ) ? $meta['custom_css_preprocessor'][0] : '',
			'replace'       => $replace,
			'content_width' => isset( $meta['content_width'][0] )           ? $meta['content_width'][0]           : '',
		);
	}
}

Jetpack_Custom_CSS_Data_Migration::add_hooks();
