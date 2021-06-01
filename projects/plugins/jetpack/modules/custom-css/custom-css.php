<?php

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;

class Jetpack_Custom_CSS {
	static function init() {
		add_action( 'switch_theme', array( __CLASS__, 'reset' ) );
		add_action( 'wp_restore_post_revision', array( __CLASS__, 'restore_revision' ), 10, 2 );

		// Save revisions for posts of type safecss.
		add_action( 'load-revision.php', array( __CLASS__, 'add_revision_redirect' ) );

		// Override the edit link, the default link causes a redirect loop
		add_filter( 'get_edit_post_link', array( __CLASS__, 'revision_post_link' ), 10, 3 );

		// Overwrite the content width global variable if one is set in the custom css
		add_action( 'template_redirect', array( __CLASS__, 'set_content_width' ) );
		add_action( 'admin_init', array( __CLASS__, 'set_content_width' ) );

		if ( ! is_admin() )
			add_filter( 'stylesheet_uri', array( __CLASS__, 'style_filter' ) );

		define(
			'SAFECSS_USE_ACE',
			! jetpack_is_mobile() &&
			! User_Agent_Info::is_ipad() &&
			/**
			 * Should the Custom CSS module use ACE to process CSS.
			 * @see https://ace.c9.io/
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 *
			 * @param bool true Use ACE to process the Custom CSS. Default to true.
			 */
			apply_filters( 'safecss_use_ace', true )
		);

		// Register safecss as a custom post_type
		// Explicit capability definitions are largely unnecessary because the posts are manipulated in code via an options page, managing CSS revisions does check the capabilities, so let's ensure that the proper caps are checked.
		register_post_type( 'safecss', array(
	//		These are the defaults
	//		'exclude_from_search' => true,
	//		'public' => false,
	//		'publicly_queryable' => false,
	//		'show_ui' => false,
			'supports' => array( 'revisions' ),
			'label' => 'Custom CSS',
			'can_export' => false,
			'rewrite' => false,
			'capabilities' => array(
				'edit_post' => 'edit_theme_options',
				'read_post' => 'read',
				'delete_post' => 'edit_theme_options',
				'edit_posts' => 'edit_theme_options',
				'edit_others_posts' => 'edit_theme_options',
				'publish_posts' => 'edit_theme_options',
				'read_private_posts' => 'read'
			)
		) );

		// Short-circuit WP if this is a CSS stylesheet request
		if ( isset( $_GET['custom-css'] ) ) {
			header( 'Content-Type: text/css', true, 200 );
			header( 'Expires: ' . gmdate( 'D, d M Y H:i:s', time() + 31536000) . ' GMT' ); // 1 year
			Jetpack_Custom_CSS::print_css();
			exit;
		}

		add_action( 'admin_enqueue_scripts', array( 'Jetpack_Custom_CSS', 'enqueue_scripts' ) );

		if ( isset( $_GET['page'] ) && 'editcss' == $_GET['page'] && is_admin() ) {
			// Do migration routine if necessary
			Jetpack_Custom_CSS::upgrade();

			/**
			 * Allows additional work when migrating safecss from wp_options to wp_post.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 */
			do_action( 'safecss_migrate_post' );
		}

		/**
		 * Never embed the style in the head on wpcom.
		 * Yes, this filter should be added to an unsynced file on wpcom, but
		 * there is no good syntactically-correct location to put it yet.
		 * @link https://github.com/Automattic/jetpack/commit/a1be114e9179f64d147124727a58e2cf76c7e5a1#commitcomment-7763921
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_filter( 'safecss_embed_style', '__return_false' );
		} else {
			add_filter( 'safecss_embed_style', array( 'Jetpack_Custom_CSS', 'should_we_inline_custom_css' ), 10, 2 );
		}

		add_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );

		add_filter( 'jetpack_content_width', array( 'Jetpack_Custom_CSS', 'jetpack_content_width' ) );
		add_filter( 'editor_max_image_size', array( 'Jetpack_Custom_CSS', 'editor_max_image_size' ), 10, 3 );

		if ( !current_user_can( 'switch_themes' ) && !is_super_admin() )
			return;

		add_action( 'admin_menu', array( 'Jetpack_Custom_CSS', 'menu' ) );

		if ( isset( $_POST['safecss'] ) && false == strstr( $_SERVER[ 'REQUEST_URI' ], 'options.php' ) ) {
			check_admin_referer( 'safecss' );

			$save_result = self::save( array(
				'css' => stripslashes( $_POST['safecss'] ),
				'is_preview' => isset( $_POST['action'] ) && $_POST['action'] == 'preview',
				'preprocessor' => isset( $_POST['custom_css_preprocessor'] ) ? $_POST['custom_css_preprocessor'] : '',
				'add_to_existing' => isset( $_POST['add_to_existing'] ) ? $_POST['add_to_existing'] == 'true' : true,
				'content_width' => isset( $_POST['custom_content_width'] ) ? $_POST['custom_content_width'] : false,
			) );

			if ( $_POST['action'] == 'preview' ) {
				wp_safe_redirect( add_query_arg( 'csspreview', 'true', get_option( 'home' ) ) );
				exit;
			}

			if ( $save_result )
				add_action( 'admin_notices', array( 'Jetpack_Custom_CSS', 'saved_message' ) );
		}

		// Prevent content filters running on CSS when restoring revisions
		if ( isset( $_REQUEST[ 'action' ] ) && 'restore' === $_REQUEST[ 'action' ] && false !== strstr( $_SERVER[ 'REQUEST_URI' ], 'revision.php' ) ) {
			$parent_post = get_post( wp_get_post_parent_id( (int) $_REQUEST['revision'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
			if ( $parent_post && ! is_wp_error( $parent_post ) && 'safecss' === $parent_post->post_type ) {
				// Remove wp_filter_post_kses, this causes CSS escaping issues
				remove_filter( 'content_save_pre', 'wp_filter_post_kses' );
				remove_filter( 'content_filtered_save_pre', 'wp_filter_post_kses' );
				remove_all_filters( 'content_save_pre' );
			}
		}

		// Modify all internal links so that preview state persists
		if ( Jetpack_Custom_CSS::is_preview() )
			ob_start( array( 'Jetpack_Custom_CSS', 'buffer' ) );
	}

	/**
	 * Save new custom CSS. This should be the entry point for any third-party code using Jetpack_Custom_CSS
	 * to save CSS.
	 *
	 * @param array $args Array of arguments:
	 *        string $css The CSS (or LESS or Sass)
	 *        bool $is_preview Whether this CSS is preview or published
	 *        string preprocessor Which CSS preprocessor to use
	 *        bool $add_to_existing Whether this CSS replaces the theme's CSS or supplements it.
	 *        int $content_width A custom $content_width to go along with this CSS.
	 * @return int The post ID of the saved Custom CSS post.
	 */
	public static function save( $args = array() ) {
		$defaults = array(
			'css' => '',
			'is_preview' => false,
			'preprocessor' => '',
			'add_to_existing' => true,
			'content_width' => false,
		);

		$args = wp_parse_args( $args, $defaults );

		if (
			$args['content_width']
			&& (int) $args['content_width'] > 0
			&& (
				! isset( $GLOBALS['content_width'] )
				|| $args['content_width'] !== $GLOBALS['content_width']
			)
		) {
			$args['content_width'] = (int) $args['content_width'];
		} else {
			$args['content_width'] = false;
		}

		// Remove wp_filter_post_kses, this causes CSS escaping issues
		remove_filter( 'content_save_pre', 'wp_filter_post_kses' );
		remove_filter( 'content_filtered_save_pre', 'wp_filter_post_kses' );
		remove_all_filters( 'content_save_pre' );

		/**
		 * Fires prior to saving custom css values. Necessitated because the
		 * core WordPress save_pre filters were removed:
		 * - content_save_pre
		 * - content_filtered_save_pre
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param array $args {
		 * Array of custom CSS arguments.
		 * 	@type string $css The CSS (or LESS or Sass).
		 * 	@type bool $is_preview Whether this CSS is preview or published.
		 * 	@type string preprocessor Which CSS preprocessor to use.
		 * 	@type bool $add_to_existing Whether this CSS replaces the theme's CSS or supplements it.
		 * 	@type int $content_width A custom $content_width to go along with this CSS.
		 * }
		 */
		do_action( 'safecss_save_pre', $args );

		$warnings = array();

		safecss_class();
		$csstidy = new csstidy();
		$csstidy->optimise = new safecss( $csstidy );

		$csstidy->set_cfg( 'remove_bslash',              false );
		$csstidy->set_cfg( 'compress_colors',            false );
		$csstidy->set_cfg( 'compress_font-weight',       false );
		$csstidy->set_cfg( 'optimise_shorthands',        0 );
		$csstidy->set_cfg( 'remove_last_;',              false );
		$csstidy->set_cfg( 'case_properties',            false );
		$csstidy->set_cfg( 'discard_invalid_properties', true );
		$csstidy->set_cfg( 'css_level',                  'CSS3.0' );
		$csstidy->set_cfg( 'preserve_css',               true );
		$csstidy->set_cfg( 'template',                   dirname( __FILE__ ) . '/csstidy/wordpress-standard.tpl' );

		$css = $orig = $args['css'];

		$css = preg_replace( '/\\\\([0-9a-fA-F]{4})/', '\\\\\\\\$1', $prev = $css );
		// prevent content: '\3434' from turning into '\\3434'
		$css = str_replace( array( '\'\\\\', '"\\\\' ), array( '\'\\', '"\\' ), $css );

		if ( $css != $prev )
			$warnings[] = 'preg_replace found stuff';

		// Some people put weird stuff in their CSS, KSES tends to be greedy
		$css = str_replace( '<=', '&lt;=', $css );
		// Why KSES instead of strip_tags?  Who knows?
		$css = wp_kses_split( $prev = $css, array(), array() );
		$css = str_replace( '&gt;', '>', $css ); // kses replaces lone '>' with &gt;
		// Why both KSES and strip_tags?  Because we just added some '>'.
		$css = strip_tags( $css );

		if ( $css != $prev )
			$warnings[] = 'kses found stuff';

		// if we're not using a preprocessor
		if ( ! $args['preprocessor'] ) {

			/**
			 * Fires before parsing the css with CSSTidy, but only if
			 * the preprocessor is not configured for use.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 *
			 * @param obj $csstidy The csstidy object.
			 * @param string $css Custom CSS.
			 * @param array $args Array of custom CSS arguments.
			 */
			do_action( 'safecss_parse_pre', $csstidy, $css, $args );

			$csstidy->parse( $css );

			/**
			 * Fires after parsing the css with CSSTidy, but only if
			 * the preprocessor is not cinfigured for use.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 *
			 * @param obj $csstidy The csstidy object.
			 * @param array $warnings Array of warnings.
			 * @param array $args Array of custom CSS arguments.
			 */
			do_action( 'safecss_parse_post', $csstidy, $warnings, $args );

			$css = $csstidy->print->plain();
		}

		if ( $args['add_to_existing'] )
			$add_to_existing = 'yes';
		else
			$add_to_existing = 'no';

		if ( $args['is_preview'] || Jetpack_Custom_CSS::is_freetrial() ) {
			// Save the CSS
			$safecss_revision_id = Jetpack_Custom_CSS::save_revision( $css, true, $args['preprocessor'] );

			// Cache Buster
			update_option( 'safecss_preview_rev', (int) get_option( 'safecss_preview_rev' ) + 1 );

			update_metadata( 'post', $safecss_revision_id, 'custom_css_add', $add_to_existing );
			update_metadata( 'post', $safecss_revision_id, 'content_width', $args['content_width'] );
			update_metadata( 'post', $safecss_revision_id, 'custom_css_preprocessor', $args['preprocessor'] );

			delete_option( 'safecss_add' );
			delete_option( 'safecss_content_width' );

			if ( $args['is_preview'] ) {
				return $safecss_revision_id;
			}

			/**
			 * Fires after saving Custom CSS.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 */
			do_action( 'safecss_save_preview_post' );
		}

		// Save the CSS
		$safecss_post_id = Jetpack_Custom_CSS::save_revision( $css, false, $args['preprocessor'] );

		$safecss_post_revision = Jetpack_Custom_CSS::get_current_revision();

		update_option( 'safecss_rev', (int) get_option( 'safecss_rev' ) + 1 );

		update_post_meta( $safecss_post_id, 'custom_css_add', $add_to_existing );
		update_post_meta( $safecss_post_id, 'content_width', $args['content_width'] );
		update_post_meta( $safecss_post_id, 'custom_css_preprocessor', $args['preprocessor'] );

		delete_option( 'safecss_add' );
		delete_option( 'safecss_content_width' );

		update_metadata( 'post', $safecss_post_revision['ID'], 'custom_css_add', $add_to_existing );
		update_metadata( 'post', $safecss_post_revision['ID'], 'content_width', $args['content_width'] );
		update_metadata( 'post', $safecss_post_revision['ID'], 'custom_css_preprocessor', $args['preprocessor'] );

		delete_option( 'safecss_preview_add' );

		return $safecss_post_id;
	}

	/**
	 * Get the published custom CSS post.
	 *
	 * @return array
	 */
	static function get_post() {
		$custom_css_post_id = Jetpack_Custom_CSS::post_id();

		if ( $custom_css_post_id )
			return get_post( $custom_css_post_id, ARRAY_A );

		return array();
	}

	/**
	 * Get the post ID of the published custom CSS post.
	 *
	 * @return int|bool The post ID if it exists; false otherwise.
	 */
	static function post_id() {
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
			return $custom_css_post_id;
		}

		$custom_css_post_id = wp_cache_get( 'custom_css_post_id' );

		if ( false === $custom_css_post_id ) {
			$custom_css_posts = get_posts( array(
				'posts_per_page' => 1,
				'post_type' => 'safecss',
				'post_status' => 'publish',
				'orderby' => 'date',
				'order' => 'DESC'
			) );

			if ( count( $custom_css_posts ) > 0 )
				$custom_css_post_id = $custom_css_posts[0]->ID;
			else
				$custom_css_post_id = 0;

			// Save post_id=0 to note that no safecss post exists.
			wp_cache_set( 'custom_css_post_id', $custom_css_post_id );
		}

		if ( ! $custom_css_post_id )
			return false;

		return $custom_css_post_id;
	}

	/**
	 * Get the current revision of the original safecss record
	 *
	 * @return object
	 */
	static function get_current_revision() {
		$safecss_post = Jetpack_Custom_CSS::get_post();

		if ( empty( $safecss_post ) ) {
			return false;
		}

		$revisions = wp_get_post_revisions( $safecss_post['ID'], array( 'posts_per_page' => 1, 'orderby' => 'date', 'order' => 'DESC' ) );

		// Empty array if no revisions exist
		if ( empty( $revisions ) ) {
			// Return original post
			return $safecss_post;
		} else {
			// Return the first entry in $revisions, this will be the current revision
			$current_revision = get_object_vars( array_shift( $revisions ) );
			return $current_revision;
		}
	}

	/**
	 * Save new revision of CSS
	 * Checks to see if content was modified before really saving
	 *
	 * @param string $css
	 * @param bool $is_preview
	 * @return bool|int If nothing was saved, returns false. If a post
	 *                  or revision was saved, returns the post ID.
	 */
	static function save_revision( $css, $is_preview = false, $preprocessor = '' ) {
		$safecss_post = Jetpack_Custom_CSS::get_post();

		$compressed_css = Jetpack_Custom_CSS::minify( $css, $preprocessor );

		// If null, there was no original safecss record, so create one
		if ( null == $safecss_post ) {
			if ( ! $css )
				return false;

			$post = array();
			$post['post_content'] = wp_slash( $css );
			$post['post_title'] = 'safecss';
			$post['post_status'] = 'publish';
			$post['post_type'] = 'safecss';
			$post['post_content_filtered'] = wp_slash( $compressed_css );

			// Set excerpt to current theme, for display in revisions list
			$current_theme = wp_get_theme();
			$post['post_excerpt'] = $current_theme->Name;

			// Insert the CSS into wp_posts
			$post_id = wp_insert_post( $post );
			wp_cache_set( 'custom_css_post_id', $post_id );
			return $post_id;
		}

		// Update CSS in post array with new value passed to this function
		$safecss_post['post_content'] = $css;
		$safecss_post['post_content_filtered'] = $compressed_css;

		// Set excerpt to current theme, for display in revisions list
		$current_theme = wp_get_theme();
		$safecss_post['post_excerpt'] = $current_theme->Name;

		// Don't carry over last revision's timestamps, otherwise revisions all have matching timestamps
		unset( $safecss_post['post_date'] );
		unset( $safecss_post['post_date_gmt'] );
		unset( $safecss_post['post_modified'] );
		unset( $safecss_post['post_modified_gmt'] );

		// Do not update post if we are only saving a preview
		if ( false === $is_preview ) {
			$safecss_post['post_content'] = wp_slash( $safecss_post['post_content'] );
			$safecss_post['post_content_filtered'] = wp_slash( $safecss_post['post_content_filtered'] );
			$post_id = wp_update_post( $safecss_post );
			wp_cache_set( 'custom_css_post_id', $post_id );
			return $post_id;
		}
		else if ( ! defined( 'DOING_MIGRATE' ) ) {
			return _wp_put_post_revision( $safecss_post );
		}
	}

	static function skip_stylesheet() {
		/**
		 * Prevent the Custom CSS stylesheet from being enqueued.
		 *
		 * @module custom-css
		 *
		 * @since 2.2.1
		 *
		 * @param null Should the stylesheet be skipped. Default to null. Anything else will force the stylesheet to be skipped.
		 */
		$skip_stylesheet = apply_filters( 'safecss_skip_stylesheet', null );

		if ( null !== $skip_stylesheet ) {
			return $skip_stylesheet;
		} elseif ( Jetpack_Custom_CSS::is_customizer_preview() ) {
			return false;
		} else {
			if ( Jetpack_Custom_CSS::is_preview() ) {
				$safecss_post = Jetpack_Custom_CSS::get_current_revision();

				if ( $safecss_post )
					return (bool) ( get_post_meta( $safecss_post['ID'], 'custom_css_add', true ) == 'no' );
				else
					return (bool) ( get_option( 'safecss_preview_add' ) == 'no' );
			}
			else {
				$custom_css_post_id = Jetpack_Custom_CSS::post_id();

				if ( $custom_css_post_id ) {
					$custom_css_add = get_post_meta( $custom_css_post_id, 'custom_css_add', true );

					// It is possible for the CSS to be stored in a post but for the safecss_add option
					// to have not been upgraded yet if the user hasn't opened their Custom CSS editor
					// since October 2012.
					if ( ! empty( $custom_css_add ) )
						return (bool) ( $custom_css_add === 'no' );
				}

				return (bool) ( Jetpack_Options::get_option_and_ensure_autoload( 'safecss_add', '' ) == 'no' );
			}
		}
	}

	static function is_preview() {
		return isset( $_GET['csspreview'] ) && $_GET['csspreview'] === 'true';
	}

	/**
	 * Currently this filter function gets called on
	 * 'template_redirect' action and
	 * 'admin_init' action
	 */
	static function set_content_width(){
		// Don't apply this filter on the Edit CSS page
		if ( isset( $_GET ) && isset( $_GET['page'] ) &&  'editcss' == $_GET['page'] && is_admin() ) {
			return;
		}

		$GLOBALS['content_width'] = Jetpack::get_content_width();
	}

	/*
	 * False when the site has the Custom Design upgrade.
	 * Used only on WordPress.com.
	 */
	static function is_freetrial() {
		/**
		 * Determine if a WordPress.com site uses a Free trial of the Custom Design Upgrade.
		 * Used only on WordPress.com.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param bool false Does the site use a Free trial of the Custom Design Upgrade. Default to false.
		 */
		return apply_filters( 'safecss_is_freetrial', false );
	}

	static function get_preprocessor_key() {
		$safecss_post = Jetpack_Custom_CSS::get_current_revision();
		return get_post_meta( $safecss_post['ID'], 'custom_css_preprocessor', true );
	}

	static function get_preprocessor() {
		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		$selected_preprocessor_key = self::get_preprocessor_key();
		$selected_preprocessor = isset( $preprocessors[ $selected_preprocessor_key ] ) ? $preprocessors[ $selected_preprocessor_key ] : null;
		return $selected_preprocessor;
	}

	static function get_css( $compressed = false ) {
		/**
		 * Filter the Custom CSS returned.
		 * Can be used to return an error, or no CSS at all.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param bool false Should we return an error instead of the Custom CSS. Default to false.
		 */
		$default_css = apply_filters( 'safecss_get_css_error', false );

		if ( $default_css !== false )
			return $default_css;

		$option = ( Jetpack_Custom_CSS::is_preview() || Jetpack_Custom_CSS::is_freetrial() ) ? 'safecss_preview' : 'safecss';
		$css = '';

		if ( 'safecss' == $option ) {
			// Don't bother checking for a migrated 'safecss' option if it never existed.
			if ( false === get_option( 'safecss' ) || get_option( 'safecss_revision_migrated' ) ) {
				$safecss_post = Jetpack_Custom_CSS::get_post();
				if ( ! empty( $safecss_post ) ) {
					$css = ( $compressed && $safecss_post['post_content_filtered'] ) ? $safecss_post['post_content_filtered'] : $safecss_post['post_content'];
				}
			} else {
				$current_revision = Jetpack_Custom_CSS::get_current_revision();
				if ( false === $current_revision ) {
					$css = '';
				} else {
					$css = ( $compressed && $current_revision['post_content_filtered'] ) ? $current_revision['post_content_filtered'] : $current_revision['post_content'];
				}
			}

			// Fix for un-migrated Custom CSS
			if ( empty( $safecss_post ) ) {
				$_css = get_option( 'safecss' );
				if ( !empty( $_css ) ) {
					$css = $_css;
				}
			}
		}
		else if ( 'safecss_preview' == $option ) {
			$safecss_post = Jetpack_Custom_CSS::get_current_revision();
			$css = $safecss_post['post_content'];
			$css = Jetpack_Custom_CSS::minify( $css, get_post_meta( $safecss_post['ID'], 'custom_css_preprocessor', true ) );
		}

		$css = str_replace( array( '\\\00BB \\\0020', '\0BB \020', '0BB 020' ), '\00BB \0020', $css );

		if ( empty( $css ) ) {
			$css = "/*\n"
				. wordwrap(
					/**
					 * Filter the default message displayed in the Custom CSS editor.
					 *
					 * @module custom-css
					 *
					 * @since 1.7.0
					 *
					 * @param string $str Default Custom CSS editor content.
					 */
					apply_filters(
						'safecss_default_css',
						__(
							"Welcome to Custom CSS!\n\nTo learn how this works, see https://wp.me/PEmnE-Bt",
							'jetpack'
						)
					)
				)
				. "\n*/";
		}

		/**
		 * Filter the Custom CSS returned from the editor.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param string $css Custom CSS.
		 */
		$css = apply_filters( 'safecss_css', $css );

		return $css;
	}

	static function replace_insecure_urls( $css ) {
		if ( ! function_exists( '_sa_get_frontend_https_url_replacement_map' ) ) {
			return $css;
		}
		list( $http_urls, $secure_urls ) = _sa_get_frontend_https_url_replacement_map();

		return str_replace( $http_urls, $secure_urls, $css );
	}

	static function print_css() {

		/**
		 * Fires right before printing the custom CSS inside the <head> element.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 */
		do_action( 'safecss_print_pre' );
		$css = Jetpack_Custom_CSS::get_css( true );
		echo self::replace_insecure_urls( $css );
	}

	static function should_we_inline_custom_css( $should_we, $css ) {
		// If the CSS is less than 2,000 characters, inline it! otherwise return what was passed in.
		return ( strlen( $css ) < 2000 ) ? true : $should_we;
	}

	static function link_tag() {
		global $blog_id, $current_blog;

		if (
			/**
			 * Do not include any CSS on the page if the CSS includes an error.
			 * Setting this filter to true stops any Custom CSS from being enqueued.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 *
			 * @param bool false Does the CSS include an error. Default to false.
			 */
			apply_filters( 'safecss_style_error', false )
		) {
			return;
		}

		if ( ! is_super_admin() && isset( $current_blog ) && ( 1 == $current_blog->spam || 1 == $current_blog->deleted ) )
			return;

		if ( Jetpack_Custom_CSS::is_customizer_preview() )
			return;

		$css    = '';
		$option = Jetpack_Custom_CSS::is_preview() ? 'safecss_preview' : 'safecss';

		if ( 'safecss' == $option ) {
			if ( Jetpack_Options::get_option_and_ensure_autoload( 'safecss_revision_migrated', '0' ) ) {
				$safecss_post = Jetpack_Custom_CSS::get_post();

				if ( ! empty( $safecss_post['post_content'] ) ) {
					$css = $safecss_post['post_content'];
				}
			} else {
				$current_revision = Jetpack_Custom_CSS::get_current_revision();

				if ( ! empty( $current_revision['post_content'] ) ) {
					$css = $current_revision['post_content'];
				}
			}

			// Fix for un-migrated Custom CSS
			if ( empty( $safecss_post ) ) {
				$_css = Jetpack_Options::get_option_and_ensure_autoload( 'safecss', '' );
				if ( !empty( $_css ) ) {
					$css = $_css;
				}
			}
		}

		if ( 'safecss_preview' == $option ) {
			$safecss_post = Jetpack_Custom_CSS::get_current_revision();

			if ( !empty( $safecss_post['post_content'] ) ) {
				$css = $safecss_post['post_content'];
			}
		}

		$css = str_replace( array( '\\\00BB \\\0020', '\0BB \020', '0BB 020' ), '\00BB \0020', $css );

		if ( $css == '' )
			return;

		if (
			/**
			 * Allow inserting CSS inline instead of through a separate file.
			 *
			 * @module custom-css
			 *
			 * @since 3.4.0
			 *
			 * @param bool false Should the CSS be added inline instead of through a separate file. Default to false.
			 * @param string $css Custom CSS.
			 */
			apply_filters( 'safecss_embed_style', false, $css )
		) {

			echo "\r\n" . '<style id="custom-css-css">' . Jetpack_Custom_CSS::get_css( true ) . "</style>\r\n";

		} else {

			$href = home_url( '/' );
			$href = add_query_arg( 'custom-css', 1, $href );
			$href = add_query_arg( 'csblog', $blog_id, $href );
			$href = add_query_arg( 'cscache', 6, $href );
			$href = add_query_arg( 'csrev', (int) get_option( $option . '_rev' ), $href );

			/**
			 * Filter the Custom CSS link enqueued in the head.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 *
			 * @param string $href Custom CSS link enqueued in the head.
			 * @param string $blog_id Blog ID.
			 */
			$href = apply_filters( 'safecss_href', $href, $blog_id );

			if ( Jetpack_Custom_CSS::is_preview() )
				$href = add_query_arg( 'csspreview', 'true', $href );

			?>
			<link rel="stylesheet" id="custom-css-css" type="text/css" href="<?php echo esc_url( $href ); ?>" />
			<?php

		}

		/**
		 * Fires after creating the <link> in the <head> element for the custom css stylesheet.
		 *
		 * @module custom-css
		 *
		 * @since 2.2.2
		 */
		do_action( 'safecss_link_tag_post' );
	}

	static function style_filter( $current ) {
		if ( Jetpack_Custom_CSS::is_freetrial() && ( ! Jetpack_Custom_CSS::is_preview() || ! current_user_can( 'switch_themes' ) ) )
			return $current;
		else if ( Jetpack_Custom_CSS::skip_stylesheet() )
			/**
			 * Filter the default blank Custom CSS URL.
			 *
			 * @module custom-css
			 *
			 * @since 2.2.1
			 *
			 * @param string $url Default blank Custom CSS URL.
			 */
			return apply_filters( 'safecss_style_filter_url', plugins_url( 'custom-css/css/blank.css', __FILE__ ) );

		return $current;
	}

	static function buffer( $html ) {
		$html = str_replace( '</body>', Jetpack_Custom_CSS::preview_flag(), $html );
		return preg_replace_callback( '!href=([\'"])(.*?)\\1!', array( 'Jetpack_Custom_CSS', 'preview_links' ), $html );
	}

	static function preview_links( $matches ) {
		if ( 0 !== strpos( $matches[2], get_option( 'home' ) ) )
			return $matches[0];

		$link = wp_specialchars_decode( $matches[2] );
		$link = add_query_arg( 'csspreview', 'true', $link );
		$link = esc_url( $link );
		return "href={$matches[1]}$link{$matches[1]}";
	}

	/**
	 * Places a black bar above every preview page
	 */
	static function preview_flag() {
		if ( is_admin() )
			return;

		$message = esc_html__( 'Preview: changes must be saved or they will be lost', 'jetpack' );
		/**
		 * Filter the Preview message displayed on the site when previewing custom CSS, before to save it.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param string $message Custom CSS preview message.
		 */
		$message = apply_filters( 'safecss_preview_message', $message );

		$preview_flag_js = "var flag = document.createElement('div');
		flag.innerHTML = " . json_encode( $message ) . ";
		flag.style.background = '#FF6600';
		flag.style.color = 'white';
		flag.style.textAlign = 'center';
		flag.style.fontSize = '15px';
		flag.style.padding = '2px';
		flag.style.fontFamily = 'sans-serif';
		document.body.style.paddingTop = '0px';
		document.body.insertBefore(flag, document.body.childNodes[0]);
		";

		/**
		 * Filter the Custom CSS preview message JS styling.
		 *
		 * @module custom-css
		 *
		 * @since 1.7.0
		 *
		 * @param string $preview_flag_js Custom CSS preview message JS styling.
		 */
		$preview_flag_js = apply_filters( 'safecss_preview_flag_js', $preview_flag_js );
		if ( $preview_flag_js ) {
			$preview_flag_js = '<script type="text/javascript">
	// <![CDATA[
	' . $preview_flag_js . '
	// ]]>
	</script>';
		}

		return $preview_flag_js;
	}

	static function menu() {
		$parent = 'themes.php';
		$title  = __( 'Additional CSS', 'jetpack' );
		$hook   = add_theme_page( $title, $title, 'edit_theme_options', 'editcss', array( 'Jetpack_Custom_CSS', 'admin' ) );

		add_action( "load-revision.php", array( 'Jetpack_Custom_CSS', 'prettify_post_revisions' ) );
		add_action( "load-$hook", array( 'Jetpack_Custom_CSS', 'update_title' ) );
	}

	/**
	 * Adds a menu item in the appearance section for this plugin's administration
	 * page. Also adds hooks to enqueue the CSS and JS for the admin page.
	 */
	static function update_title() {
		global $title;
		$title = __( 'CSS', 'jetpack' );
	}

	static function prettify_post_revisions() {
		add_filter( 'the_title', array( 'Jetpack_Custom_CSS', 'post_title' ), 10, 2 );
	}

	static function post_title( $title, $post_id ) {
		if ( !$post_id = (int) $post_id ) {
			return $title;
		}

		if ( !$post = get_post( $post_id ) ) {
			return $title;
		}

		if ( 'safecss' != $post->post_type ) {
			return $title;
		}

		return __( 'Custom CSS Stylesheet', 'jetpack' );
	}

	static function enqueue_scripts( $hook ) {
		if ( 'appearance_page_editcss' != $hook )
			return;

		wp_enqueue_script( 'postbox' );
		wp_enqueue_script(
			'custom-css-editor',
			Assets::get_file_url_for_environment(
				'_inc/build/custom-css/custom-css/js/css-editor.min.js',
				'modules/custom-css/custom-css/js/css-editor.js'
			),
			'jquery',
			'20130325',
			true
		);
		wp_enqueue_style( 'custom-css-editor', plugins_url( 'custom-css/css/css-editor.css', __FILE__ ) );

		if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) {
			wp_register_style( 'jetpack-css-codemirror', plugins_url( 'custom-css/css/codemirror.css', __FILE__ ), array(), '20120905' );
			wp_enqueue_style( 'jetpack-css-use-codemirror', plugins_url( 'custom-css/css/use-codemirror.css', __FILE__ ), array( 'jetpack-css-codemirror' ), '20120905' );

			wp_register_script( 'jetpack-css-codemirror', plugins_url( 'custom-css/js/codemirror.min.js', __FILE__ ), array(), '3.16', true );
			wp_enqueue_script(
				'jetpack-css-use-codemirror',
				Assets::get_file_url_for_environment(
					'_inc/build/custom-css/custom-css/js/use-codemirror.min.js',
					'modules/custom-css/custom-css/js/use-codemirror.js'
				),
				array( 'jquery', 'underscore', 'jetpack-css-codemirror' ),
				'20131009',
				true
			);
		}
	}

	static function saved_message() {
		echo '<div id="message" class="updated fade"><p><strong>' . __( 'Stylesheet saved.', 'jetpack' ) . '</strong></p></div>';
	}

	static function admin() {
		add_meta_box( 'submitdiv', __( 'Publish', 'jetpack' ), array( __CLASS__, 'publish_box' ), 'editcss', 'side' );
		add_action( 'custom_css_submitbox_misc_actions', array( __CLASS__, 'content_width_settings' ) );

		$safecss_post = Jetpack_Custom_CSS::get_post();

		if ( ! empty( $safecss_post ) && 0 < $safecss_post['ID'] && wp_get_post_revisions( $safecss_post['ID'], array( 'posts_per_page' => 1 ) ) )
			add_meta_box( 'revisionsdiv', __( 'CSS Revisions', 'jetpack' ), array( __CLASS__, 'revisions_meta_box' ), 'editcss', 'side' );
		?>
		<div class="wrap">
			<?php

			/**
			 * Fires right before the custom css page begins.
			 *
			 * @module custom-css
			 *
			 * @since 1.7.0
			 */
			do_action( 'custom_design_header' );

			?>
			<h1><?php _e( 'CSS Stylesheet Editor', 'jetpack' ); ?></h1>
			<form id="safecssform" action="" method="post">
				<?php wp_nonce_field( 'safecss' ) ?>
				<?php wp_nonce_field( 'meta-box-order', 'meta-box-order-nonce', false ); ?>
				<?php wp_nonce_field( 'closedpostboxes', 'closedpostboxesnonce', false ); ?>
				<input type="hidden" name="action" value="save" />
				<div id="poststuff">
					<p class="css-support">
					<?php
						/**
						 * Filter the intro text appearing above the Custom CSS Editor.
						 *
						 * @module custom-css
						 *
						 * @since 1.7.0
						 *
						 * @param string $str Intro text appearing above the Custom CSS editor.
						 */
						echo apply_filters( 'safecss_intro_text', __( 'New to CSS? Start with a <a href="https://www.htmldog.com/guides/css/beginner/" rel="noopener noreferrer" target="_blank">beginner tutorial</a>. Questions?
		Ask in the <a href="https://wordpress.org/support/forum/themes-and-templates" rel="noopener noreferrer" target="_blank">Themes and Templates forum</a>.', 'jetpack' ) );
					?></p>
					<p class="css-support"><?php echo __( 'Note: Custom CSS will be reset when changing themes.', 'jetpack' ); ?></p>

					<div id="post-body" class="metabox-holder columns-2">
						<div id="post-body-content">
							<div class="postarea">
								<textarea id="safecss" name="safecss"<?php if ( SAFECSS_USE_ACE ) echo ' class="hide-if-js"'; ?>><?php echo esc_textarea( Jetpack_Custom_CSS::get_css() ); ?></textarea>
								<div class="clear"></div>
							</div>
						</div>
						<div id="postbox-container-1" class="postbox-container">
						<?php do_meta_boxes( 'editcss', 'side', $safecss_post ); ?>
					</div>
					</div>
					<br class="clear" />
				</div>
			</form>
		</div>
		<?php
	}

	/**
	 * Content width setting callback
	 */
	static function content_width_settings() {
		$safecss_post = Jetpack_Custom_CSS::get_current_revision();

		$custom_content_width = get_post_meta( $safecss_post['ID'], 'content_width', true );

		// If custom content width hasn't been overridden and the theme has a content_width value, use that as a default.
		if ( $custom_content_width <= 0 && ! empty( $GLOBALS['content_width'] ) )
			$custom_content_width = $GLOBALS['content_width'];

		if ( ! $custom_content_width || ( isset( $GLOBALS['content_width'] ) && $custom_content_width == $GLOBALS['content_width'] ) )
			$custom_content_width = '';

		?>
		<div class="misc-pub-section">
			<label><?php esc_html_e( 'Media Width:', 'jetpack' ); ?></label>
			<span id="content-width-display" data-default-text="<?php esc_attr_e( 'Default', 'jetpack' ); ?>" data-custom-text="<?php esc_attr_e( '%s px', 'jetpack' ); ?>"><?php echo $custom_content_width ? sprintf( esc_html__( '%s px', 'jetpack' ), $custom_content_width ) : esc_html_e( 'Default', 'jetpack' ); ?></span>
			<a class="edit-content-width hide-if-no-js" href="#content-width"><?php echo esc_html_e( 'Edit', 'jetpack' ); ?></a>
			<div id="content-width-select" class="hide-if-js">
				<input type="hidden" name="custom_content_width" id="custom_content_width" value="<?php echo esc_attr( $custom_content_width ); ?>" />
				<p>
					<?php

					printf( /* translators: %1$s is replaced with an input field for numbers. */
						__( 'Limit width to %1$s pixels for full size images. (<a href="%2$s" rel="noopener noreferrer" target="_blank">More info</a>.)', 'jetpack' ),
						'<input type="text" id="custom_content_width_visible" value="' . esc_attr( $custom_content_width ) . '" size="4" />',
						/**
						 * Filter the Custom CSS limited width's support doc URL.
						 *
						 * @module custom-css
						 *
						 * @since 2.2.3
						 *
						 * @param string $url Custom CSS limited width's support doc URL.
						 */
						esc_url(
							apply_filters( 'safecss_limit_width_link', Redirect::get_url( 'jetpack-support-custom-css', array( 'anchor' => 'limited-width' ) ) )
						)
					);

					?>
				</p>
				<?php

				if (
					! empty( $GLOBALS['content_width'] )
					&& $custom_content_width != $GLOBALS['content_width']
				) {
					$current_theme = wp_get_theme()->Name;

					?>
					<p>
					<?php
					echo esc_html(
						sprintf(
							/* translators: %1$s is the theme name, %2$d is an amount of pixels. */
							_n(
								'The default content width for the %1$s theme is %2$d pixel.',
								'The default content width for the %1$s theme is %2$d pixels.',
								(int) $GLOBALS['content_width'],
								'jetpack'
							),
							$current_theme,
							(int) $GLOBALS['content_width']
						)
					);
					?>
					</p>
					<?php
				}

				?>
				<a class="save-content-width hide-if-no-js button" href="#content-width"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
				<a class="cancel-content-width hide-if-no-js" href="#content-width"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
			</div>
			<script type="text/javascript">
				jQuery( function ( $ ) {
					var defaultContentWidth = <?php echo isset( $GLOBALS['content_width'] ) ? json_encode( (int) $GLOBALS['content_width'] ) : 0; ?>;

					$( '.edit-content-width' ).bind( 'click', function ( e ) {
						e.preventDefault();

						$( '#content-width-select' ).slideDown();
						$( this ).hide();
					} );

					$( '.cancel-content-width' ).bind( 'click', function ( e ) {
						e.preventDefault();

						$( '#content-width-select' ).slideUp( function () {
							$( '.edit-content-width' ).show();
							$( '#custom_content_width_visible' ).val( $( '#custom_content_width' ).val() );
						} );
					} );

					$( '.save-content-width' ).bind( 'click', function ( e ) {
						e.preventDefault();

						$( '#content-width-select' ).slideUp();

						var newContentWidth = parseInt( $( '#custom_content_width_visible' ).val(), 10 );

						if ( newContentWidth && newContentWidth != defaultContentWidth ) {
							$( '#content-width-display' ).text(
								$( '#content-width-display' )
									.data( 'custom-text' )
										.replace( '%s', $( '#custom_content_width_visible' ).val() )
							);
						}
						else {
							$( '#content-width-display' ).text( $( '#content-width-display' ).data( 'default-text' ) );
						}

						$( '#custom_content_width' ).val( $( '#custom_content_width_visible' ).val() );
						$( '.edit-content-width' ).show();
					} );
				} );
			</script>
		</div>
		<?php
	}

	static function publish_box() {
		?>
		<div id="minor-publishing">
			<div id="misc-publishing-actions">
				<?php

				/**
				 * Filter the array of available Custom CSS preprocessors.
				 *
				 * @module custom-css
				 *
				 * @since 2.0.3
				 *
				 * @param array array() Empty by default.
				 */
				$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );

				if ( ! empty( $preprocessors ) ) {
					$safecss_post = Jetpack_Custom_CSS::get_current_revision();
					$selected_preprocessor_key = get_post_meta( $safecss_post['ID'], 'custom_css_preprocessor', true );
					$selected_preprocessor = isset( $preprocessors[$selected_preprocessor_key] ) ? $preprocessors[$selected_preprocessor_key] : null;

					?>
					<div class="misc-pub-section">
						<label><?php esc_html_e( 'Preprocessor:', 'jetpack' ); ?></label>
						<span id="preprocessor-display"><?php echo esc_html( $selected_preprocessor ? $selected_preprocessor['name'] : __( 'None', 'jetpack' ) ); ?></span>
						<a class="edit-preprocessor hide-if-no-js" href="#preprocessor"><?php echo esc_html_e( 'Edit', 'jetpack' ); ?></a>
						<div id="preprocessor-select" class="hide-if-js">
							<input type="hidden" name="custom_css_preprocessor" id="custom_css_preprocessor" value="<?php echo esc_attr( $selected_preprocessor_key ); ?>" />
							<select id="preprocessor_choices">
								<option value=""><?php esc_html_e( 'None', 'jetpack' ); ?></option>
								<?php

								foreach ( $preprocessors as $preprocessor_key => $preprocessor ) {
								?>
									<option value="<?php echo esc_attr( $preprocessor_key ); ?>" <?php selected( $selected_preprocessor_key, $preprocessor_key ); ?>><?php echo esc_html( $preprocessor['name'] ); ?></option>
									<?php
								}

								?>
							</select>
							<a class="save-preprocessor hide-if-no-js button" href="#preprocessor"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
							<a class="cancel-preprocessor hide-if-no-js" href="#preprocessor"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
						</div>
					</div>
					<?php
				}

				$safecss_post = Jetpack_Custom_CSS::get_current_revision();

				$add_css = ( get_post_meta( $safecss_post['ID'], 'custom_css_add', true ) != 'no' );

				?>
				<div class="misc-pub-section">
					<label><?php esc_html_e( 'Mode:', 'jetpack' ); ?></label>
					<span id="css-mode-display"><?php echo esc_html( $add_css ? __( 'Add-on', 'jetpack' ) : __( 'Replacement', 'jetpack' ) ); ?></span>
					<a class="edit-css-mode hide-if-no-js" href="#css-mode"><?php echo esc_html_e( 'Edit', 'jetpack' ); ?></a>
					<div id="css-mode-select" class="hide-if-js">
						<input type="hidden" name="add_to_existing" id="add_to_existing" value="<?php echo $add_css ? 'true' : 'false'; ?>" />
						<p>
							<label>
								<input type="radio" name="add_to_existing_display" value="true" <?php checked( $add_css ); ?>/>
								<?php _e( 'Add-on CSS <b>(Recommended)</b>', 'jetpack' ); ?>
							</label>
							<br />
							<label>
								<input type="radio" name="add_to_existing_display" value="false" <?php checked( ! $add_css ); ?>/>
								<?php printf(
									__( 'Replace <a href="%s">theme\'s CSS</a> <b>(Advanced)</b>', 'jetpack' ),
									/**
									 * Filter the theme's stylesheet URL.
									 *
									 * @module custom-css
									 *
									 * @since 1.7.0
									 *
									 * @param string $url Active theme's stylesheet URL. Default to get_stylesheet_uri().
									 */
									apply_filters( 'safecss_theme_stylesheet_url', get_stylesheet_uri() )
								); ?>
							</label>
						</p>
						<a class="save-css-mode hide-if-no-js button" href="#css-mode"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
						<a class="cancel-css-mode hide-if-no-js" href="#css-mode"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
					</div>
				</div>
				<?php

				/**
				 * Allows addition of elements to the submit box for custom css on the wp-admin side.
				 *
				 * @module custom-css
				 *
				 * @since 2.0.3
				 */
				do_action( 'custom_css_submitbox_misc_actions' );

				?>
			</div>
		</div>
		<div id="major-publishing-actions">
			<input type="button" class="button" id="preview" name="preview" value="<?php esc_attr_e( 'Preview', 'jetpack' ) ?>" />
			<div id="publishing-action">
				<input type="submit" class="button-primary" id="save" name="save" value="<?php ( Jetpack_Custom_CSS::is_freetrial() ) ? esc_attr_e( 'Save &amp; Buy Upgrade', 'jetpack' ) : esc_attr_e( 'Save Stylesheet', 'jetpack' ); ?>" />
			</div>
		</div>
		<?php
	}

	/**
	 * Render metabox listing CSS revisions and the themes that correspond to the revisions.
	 * Called by safecss_admin
	 *
	 * @global $post
	 * @param array $safecss_post
	 * @uses wp_revisions_to_keep
	 * @uses WP_Query
	 * @uses wp_post_revision_title
	 * @uses esc_html
	 * @uses add_query_arg
	 * @uses menu_page_url
	 * @uses wp_reset_query
	 * @return string
	 */
	static function revisions_meta_box( $safecss_post ) {

		$show_all_revisions = isset( $_GET['show_all_rev'] );

		if ( function_exists( 'wp_revisions_to_keep' ) ) {
			$max_revisions = wp_revisions_to_keep( (object) $safecss_post );
		} else {
			$max_revisions = defined( 'WP_POST_REVISIONS' ) && is_numeric( WP_POST_REVISIONS ) ? (int) WP_POST_REVISIONS : 25;
		}

		$posts_per_page = $show_all_revisions ? $max_revisions : 6;

		$revisions = new WP_Query( array(
			'posts_per_page' => $posts_per_page,
			'post_type' => 'revision',
			'post_status' => 'inherit',
			'post_parent' => $safecss_post['ID'],
			'orderby' => 'date',
			'order' => 'DESC'
		) );

		if ( $revisions->have_posts() ) { ?>
			<ul class="post-revisions"><?php

			global $post;

			while ( $revisions->have_posts() ) :
				$revisions->the_post();

				?><li>
					<?php
						echo wp_post_revision_title( $post );

						if ( ! empty( $post->post_excerpt ) )
							echo ' (' . esc_html( $post->post_excerpt ) . ')';
					?>
				</li><?php

			endwhile;

			?></ul><?php

			if ( $revisions->found_posts > 6 && !$show_all_revisions ) {
				?>
				<br>
				<a href="<?php echo add_query_arg( 'show_all_rev', 'true', menu_page_url( 'editcss', false ) ); ?>"><?php esc_html_e( 'Show all', 'jetpack' ); ?></a>
				<?php
			}
		}

		wp_reset_query();
	}

	/**
	 * Hook in init at priority 11 to disable custom CSS.
	 */
	static function disable() {
		remove_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );
	    remove_filter( 'stylesheet_uri', array( 'Jetpack_Custom_CSS', 'style_filter' ) );
	}

	/**
	 * Reset all aspects of Custom CSS on a theme switch so that changing
	 * themes is a sure-fire way to get a clean start.
	 */
	static function reset() {
		$safecss_post_id = Jetpack_Custom_CSS::save_revision( '' );
		$safecss_revision = Jetpack_Custom_CSS::get_current_revision();

		update_option( 'safecss_rev', (int) get_option( 'safecss_rev' ) + 1 );

		update_post_meta( $safecss_post_id, 'custom_css_add', 'yes' );
		update_post_meta( $safecss_post_id, 'content_width', false );
		update_post_meta( $safecss_post_id, 'custom_css_preprocessor', '' );

		delete_option( 'safecss_add' );
		delete_option( 'safecss_content_width' );

		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_add', 'yes' );
		update_metadata( 'post', $safecss_revision['ID'], 'content_width', false );
		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_preprocessor', '' );

		delete_option( 'safecss_preview_add' );
	}

	static function is_customizer_preview() {
		if ( isset ( $GLOBALS['wp_customize'] ) )
			return ! $GLOBALS['wp_customize']->is_theme_active();

		return false;
	}

	static function minify( $css, $preprocessor = '' ) {
		if ( ! $css )
			return '';

		if ( $preprocessor ) {
			/** This filter is documented in modules/custom-css/custom-css.php */
			$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );

			if ( isset( $preprocessors[$preprocessor] ) ) {
				$css = call_user_func( $preprocessors[$preprocessor]['callback'], $css );
			}
		}

		safecss_class();
		$csstidy = new csstidy();
		$csstidy->optimise = new safecss( $csstidy );

		$csstidy->set_cfg( 'remove_bslash',              false );
		$csstidy->set_cfg( 'compress_colors',            true );
		$csstidy->set_cfg( 'compress_font-weight',       true );
		$csstidy->set_cfg( 'remove_last_;',              true );
		$csstidy->set_cfg( 'case_properties',            true );
		$csstidy->set_cfg( 'discard_invalid_properties', true );
		$csstidy->set_cfg( 'css_level',                  'CSS3.0' );
		$csstidy->set_cfg( 'template', 'highest');
		$csstidy->parse( $css );

		return $csstidy->print->plain();
	}

	/**
	 * When restoring a SafeCSS post revision, also copy over the
	 * content_width and custom_css_add post metadata.
	 */
	static function restore_revision( $_post_id, $_revision_id ) {
		$_post = get_post( $_post_id );

		if ( 'safecss' != $_post->post_type )
			return;

		$safecss_revision = Jetpack_Custom_CSS::get_current_revision();

		$content_width = get_post_meta( $_revision_id, 'content_width', true );
		$custom_css_add = get_post_meta( $_revision_id, 'custom_css_add', true );
		$preprocessor = get_post_meta( $_revision_id, 'custom_css_preprocessor', true );

		update_metadata( 'post', $safecss_revision['ID'], 'content_width', $content_width );
		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_add', $custom_css_add );
		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_preprocessor', $preprocessor );

		delete_option( 'safecss_add' );
		delete_option( 'safecss_content_width' );

		update_post_meta( $_post->ID, 'content_width', $content_width );
		update_post_meta( $_post->ID, 'custom_css_add', $custom_css_add );
		update_post_meta( $_post->ID, 'custom_css_preprocessor', $preprocessor );

		delete_option( 'safecss_preview_add' );
	}

	/**
	 * Migration routine for moving safecss from wp_options to wp_posts to support revisions
	 *
	 * @return void
	 */
	static function upgrade() {
		$css = get_option( 'safecss' );

		if ( get_option( 'safecss_revision_migrated' ) ) {
			return false;
		}

		// Check if CSS is stored in wp_options
		if ( $css ) {
			// Remove the async actions from publish_post
			remove_action( 'publish_post', 'queue_publish_post' );

			$post = array();
			$post['post_content'] = $css;
			$post['post_title'] = 'safecss';
			$post['post_status'] = 'publish';
			$post['post_type'] = 'safecss';

			// Insert the CSS into wp_posts
			$post_id = wp_insert_post( $post );
			// Check for errors
			if ( !$post_id or is_wp_error( $post_id ) )
				die( $post_id->get_error_message() );

			// Delete safecss option
			delete_option( 'safecss' );
		}

		unset( $css );

		// Check if we have already done this
		if ( !get_option( 'safecss_revision_migrated' ) ) {
			define( 'DOING_MIGRATE', true );

			// Get hashes of safecss post and current revision
			$safecss_post = Jetpack_Custom_CSS::get_post();

			if ( empty( $safecss_post ) )
				return;

			$safecss_post_hash = md5( $safecss_post['post_content'] );
			$current_revision = Jetpack_Custom_CSS::get_current_revision();

			if ( null == $current_revision )
				return;

			$current_revision_hash = md5( $current_revision['post_content'] );

			// If hashes are not equal, set safecss post with content from current revision
			if ( $safecss_post_hash !== $current_revision_hash ) {
				Jetpack_Custom_CSS::save_revision( $current_revision['post_content'] );
				// Reset post_content to display the migrated revsion
				$safecss_post['post_content'] = $current_revision['post_content'];
			}

			// Set option so that we dont keep doing this
			update_option( 'safecss_revision_migrated', time() );
		}

		$newest_safecss_post = Jetpack_Custom_CSS::get_current_revision();

		if ( $newest_safecss_post ) {
			if ( get_option( 'safecss_content_width' ) ) {
				// Add the meta to the post and the latest revision.
				update_post_meta( $newest_safecss_post['ID'], 'content_width', get_option( 'safecss_content_width' ) );
				update_metadata( 'post', $newest_safecss_post['ID'], 'content_width', get_option( 'safecss_content_width' ) );

				delete_option( 'safecss_content_width' );
			}

			if ( get_option( 'safecss_add' ) ) {
				update_post_meta( $newest_safecss_post['ID'], 'custom_css_add', get_option( 'safecss_add' ) );
				update_metadata( 'post', $newest_safecss_post['ID'], 'custom_css_add', get_option( 'safecss_add' ) );

				delete_option( 'safecss_add' );
			}
		}
	}

	/**
	 * Adds a filter to the redirect location in `wp-admin/revisions.php`.
	 */
	static function add_revision_redirect() {
		add_filter( 'wp_redirect', array( __CLASS__, 'revision_redirect' ) );
	}

	/**
	 * Filters the redirect location in `wp-admin/revisions.php`.
	 *
	 * @param string $location The path to redirect to.
	 * @return string
	 */
	static function revision_redirect( $location ) {
		$post = get_post();

		if ( ! empty( $post->post_type ) && 'safecss' == $post->post_type ) {
			$location = 'themes.php?page=editcss';

			if ( 'edit.php' == $location ) {
				$location = '';
			}
		}

		return $location;
	}

	static function revision_post_link( $post_link, $post_id, $context ) {
		if ( !$post_id = (int) $post_id ) {
			return $post_link;
		}

		if ( !$post = get_post( $post_id ) ) {
			return $post_link;
		}

		if ( 'safecss' != $post->post_type ) {
			return $post_link;
		}

		$post_link = admin_url( 'themes.php?page=editcss' );

		if ( 'display' == $context ) {
			return esc_url( $post_link );
		}

		return esc_url_raw( $post_link );
	}

	/**
	 * When on the edit screen, make sure the custom content width
	 * setting is applied to the large image size.
	 */
	static function editor_max_image_size( $dims, $size = 'medium', $context = null ) {
		list( $width, $height ) = $dims;

		if ( 'large' == $size && 'edit' == $context )
			$width = Jetpack::get_content_width();

		return array( $width, $height );
	}

	/**
	 * Override the content_width with a custom value if one is set.
	 */
	static function jetpack_content_width( $content_width ) {
		$custom_content_width = 0;

		if ( Jetpack_Custom_CSS::is_preview() ) {
			$safecss_post = Jetpack_Custom_CSS::get_current_revision();
			$custom_content_width = (int) get_post_meta( $safecss_post['ID'], 'content_width', true );
		} else if ( ! Jetpack_Custom_CSS::is_freetrial() ) {
			$custom_css_post_id = Jetpack_Custom_CSS::post_id();
			if ( $custom_css_post_id )
				$custom_content_width = (int) get_post_meta( $custom_css_post_id, 'content_width', true );
		}

		if ( $custom_content_width > 0 )
			$content_width = $custom_content_width;

		return $content_width;
	}
}

class Jetpack_Safe_CSS {
	static function filter_attr( $css, $element = 'div' ) {
		safecss_class();

		$css = $element . ' {' . $css . '}';

		$csstidy = new csstidy();
		$csstidy->optimise = new safecss( $csstidy );
		$csstidy->set_cfg( 'remove_bslash', false );
		$csstidy->set_cfg( 'compress_colors', false );
		$csstidy->set_cfg( 'compress_font-weight', false );
		$csstidy->set_cfg( 'discard_invalid_properties', true );
		$csstidy->set_cfg( 'merge_selectors', false );
		$csstidy->set_cfg( 'remove_last_;', false );
		$csstidy->set_cfg( 'css_level', 'CSS3.0' );

		// Turn off css shorthands when in block editor context as it breaks block validation.
		if ( true === isset( $_REQUEST['_gutenberg_nonce'] ) && wp_verify_nonce( $_REQUEST['_gutenberg_nonce'], 'gutenberg_request' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			$csstidy->set_cfg( 'optimise_shorthands', 0 );
		}

		$css = preg_replace( '/\\\\([0-9a-fA-F]{4})/', '\\\\\\\\$1', $css );
		$css = wp_kses_split( $css, array(), array() );
		$csstidy->parse( $css );

		$css = $csstidy->print->plain();

		$css = str_replace( array( "\n","\r","\t" ), '', $css );

		preg_match( "/^{$element}\s*{(.*)}\s*$/", $css, $matches );

		if ( empty( $matches[1] ) )
			return '';

		return $matches[1];
	}
}

function migrate() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::upgrade()' );

	return Jetpack_Custom_CSS::upgrade();
}

function safecss_revision_redirect( $redirect ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::revision_redirect()' );

	return Jetpack_Custom_CSS::revision_redirect( $redirect );
}

function safecss_revision_post_link( $post_link, $post_id, $context ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::revision_post_link()' );

	return Jetpack_Custom_CSS::revision_post_link( $post_link, $post_id, $context );
}

function get_safecss_post() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::get_post()' );

	return Jetpack_Custom_CSS::get_post();
}

function custom_css_post_id() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::post_id()' );

	return Jetpack_Custom_CSS::post_id();
}

function get_current_revision() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::get_current_revision()' );

	return Jetpack_Custom_CSS::get_current_revision();
}

function save_revision( $css, $is_preview = false, $preprocessor = '' ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::save_revision()' );

	return Jetpack_Custom_CSS::save_revision( $css, $is_preview, $preprocessor );
}

function safecss_skip_stylesheet() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::skip_stylesheet()' );

	return Jetpack_Custom_CSS::skip_stylesheet();
}

function safecss_init() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::init()' );

	return Jetpack_Custom_CSS::init();
}

function safecss_is_preview() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::is_preview()' );

	return Jetpack_Custom_CSS::is_preview();
}

function safecss_is_freetrial() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::is_freetrial()' );

	return Jetpack_Custom_CSS::is_freetrial();
}

function safecss( $compressed = false ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::get_css()' );

	return Jetpack_Custom_CSS::get_css( $compressed );
}

function safecss_print() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::print_css()' );

	return Jetpack_Custom_CSS::print_css();
}

function safecss_style() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::link_tag()' );

	return Jetpack_Custom_CSS::link_tag();
}

function safecss_style_filter( $current ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::style_filter()' );

	return Jetpack_Custom_CSS::style_filter( $current );
}

function safecss_buffer( $html ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::buffer()' );

	return Jetpack_Custom_CSS::buffer( $html );
}

function safecss_preview_links( $matches ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::preview_links()' );

	return Jetpack_Custom_CSS::preview_links( $matches );
}

function safecss_preview_flag() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::preview_flag()' );

	return Jetpack_Custom_CSS::preview_flag();
}

function safecss_menu() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::menu()' );

	return Jetpack_Custom_CSS::menu();
}

function update_title() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::update_title()' );

	return Jetpack_Custom_CSS::update_title();
}

function safecss_prettify_post_revisions() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::prettify_post_revisions()' );

	return Jetpack_Custom_CSS::prettify_post_revisions();
}

function safecss_remove_title_excerpt_from_revisions() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::remove_title_excerpt_from_revisions()' );

	return Jetpack_Custom_CSS::remove_title_excerpt_from_revisions();
}

function safecss_post_title( $title, $post_id ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::post_title()' );

	return Jetpack_Custom_CSS::post_title( $title, $post_id );
}

function safe_css_enqueue_scripts() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::enqueue_scripts()' );

	return Jetpack_Custom_CSS::enqueue_scripts( null );
}

function safecss_admin_head() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::admin_head()' );

	return Jetpack_Custom_CSS::admin_head();
}

function safecss_saved() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::saved_message()' );

	return Jetpack_Custom_CSS::saved_message();
}

function safecss_admin() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::admin()' );

	return Jetpack_Custom_CSS::admin();
}

function custom_css_meta_box() {
	_deprecated_function( __FUNCTION__, '2.1', 'add_meta_box( $id, $title, $callback, \'editcss\', \'side\' )' );
}

function custom_css_post_revisions_meta_box( $safecss_post ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::revisions_meta_box()' );

	return Jetpack_Custom_CSS::revisions_meta_box( $safecss_post );
}

function disable_safecss_style() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::disable()' );

	return Jetpack_Custom_CSS::disable();
}

function custom_css_reset() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::reset()' );

	return Jetpack_Custom_CSS::reset();
}

function custom_css_is_customizer_preview() {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::is_customizer_preview()' );

	return Jetpack_Custom_CSS::is_customizer_preview();
}

function custom_css_minify( $css, $preprocessor = '' ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::minify()' );

	return Jetpack_Custom_CSS::minify( $css, $preprocessor );
}

function custom_css_restore_revision( $_post_id, $_revision_id ) {
	_deprecated_function( __FUNCTION__, '2.1', 'Jetpack_Custom_CSS::restore_revision()' );

	return Jetpack_Custom_CSS::restore_revision( $_post_id, $_revision_id );
}

if ( ! function_exists( 'safecss_class' ) ) :
function safecss_class() {
	// Wrapped so we don't need the parent class just to load the plugin
	if ( class_exists('safecss') )
		return;

	require_once( dirname( __FILE__ ) . '/csstidy/class.csstidy.php' );

	class safecss extends csstidy_optimise {

		function postparse() {

			/**
			 * Fires after parsing the css.
			 *
			 * @module custom-css
			 *
			 * @since 1.8.0
			 *
			 * @param obj $this CSSTidy object.
			 */
			do_action( 'csstidy_optimize_postparse', $this );

			return parent::postparse();
		}

		function subvalue() {

			/**
			 * Fires before optimizing the Custom CSS subvalue.
			 *
			 * @module custom-css
			 *
			 * @since 1.8.0
			 *
			 * @param obj $this CSSTidy object.
			 **/
			do_action( 'csstidy_optimize_subvalue', $this );

			return parent::subvalue();
		}
	}
}
endif;

if ( ! function_exists( 'safecss_filter_attr' ) ) {
	function safecss_filter_attr( $css, $element = 'div' ) {
		return Jetpack_Safe_CSS::filter_attr( $css, $element );
	}
}

include_once dirname( __FILE__ ) . '/custom-css/preprocessors.php';
