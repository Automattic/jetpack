<?php

class Jetpack_Custom_CSS {
	static function init() {
		add_action( 'switch_theme', array( __CLASS__, 'reset' ) );
		add_action( 'wp_restore_post_revision', array( __CLASS__, 'restore_revision' ), 10, 2 );

		// Save revisions for posts of type safecss.
		add_filter( 'revision_redirect', array( __CLASS__, 'revision_redirect' ) );

		// Override the edit link, the default link causes a redirect loop
		add_filter( 'get_edit_post_link', array( __CLASS__, 'revision_post_link' ), 10, 3 );

		if ( ! is_admin() )
			add_filter( 'stylesheet_uri', array( __CLASS__, 'style_filter' ) );

		define( 'SAFECSS_USE_ACE', ! jetpack_is_mobile() && ! Jetpack_User_Agent_Info::is_ipad() && apply_filters( 'safecss_use_ace', true ) );

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

			do_action( 'safecss_migrate_post' );
		}

		add_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );

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

		// Modify all internal links so that preview state persists
		if ( Jetpack_Custom_CSS::is_preview() )
			ob_start( array( 'Jetpack_Custom_CSS', 'buffer' ) );

		add_filter( 'jetpack_content_width', array( 'Jetpack_Custom_CSS', 'jetpack_content_width' ) );
		add_filter( 'editor_max_image_size', array( 'Jetpack_Custom_CSS', 'editor_max_image_size' ), 10, 3 );
	}

	/**
	 * Save new custom CSS. This should be the entry point for any third-party code using Jetpack_Custom_CSS
	 * to save CSS.
	 *
	 * @param array $args Array of arguments:
	 *        string $css The CSS (or LESS or Sass)
	 *        bool $is_preview Whether this CSS is preview or published
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

		if ( $args['content_width'] && intval( $args['content_width']) > 0 && ( ! isset( $GLOBALS['content_width'] ) || $args['content_width'] != $GLOBALS['content_width'] ) )
			$args['content_width'] = intval( $args['content_width'] );
		else
			$args['content_width'] = false;

		// Remove wp_filter_post_kses, this causes CSS escaping issues
		remove_filter( 'content_save_pre', 'wp_filter_post_kses' );
		remove_filter( 'content_filtered_save_pre', 'wp_filter_post_kses' );
		remove_all_filters( 'content_save_pre' );

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
			do_action( 'safecss_parse_pre', $csstidy, $css, $args );

			$csstidy->parse( $css );

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
			update_option( 'safecss_preview_rev', intval( get_option( 'safecss_preview_rev' ) ) + 1);

			update_metadata( 'post', $safecss_revision_id, 'custom_css_add', $add_to_existing );
			update_metadata( 'post', $safecss_revision_id, 'content_width', $args['content_width'] );
			update_metadata( 'post', $safecss_revision_id, 'custom_css_preprocessor', $args['preprocessor'] );

			if ( $args['is_preview'] ) {
				return $safecss_revision_id;
			}

			// Freetrial only.
			do_action( 'safecss_save_preview_post' );
		}

		// Save the CSS
		$safecss_post_id = Jetpack_Custom_CSS::save_revision( $css, false, $args['preprocessor'] );

		$safecss_post_revision = Jetpack_Custom_CSS::get_current_revision();

		update_option( 'safecss_rev', intval( get_option( 'safecss_rev' ) ) + 1 );

		update_post_meta( $safecss_post_id, 'custom_css_add', $add_to_existing );
		update_post_meta( $safecss_post_id, 'content_width', $args['content_width'] );
		update_post_meta( $safecss_post_id, 'custom_css_preprocessor', $args['preprocessor'] );
		update_metadata( 'post', $safecss_post_revision['ID'], 'custom_css_add', $add_to_existing );
		update_metadata( 'post', $safecss_post_revision['ID'], 'content_width', $args['content_width'] );
		update_metadata( 'post', $safecss_post_revision['ID'], 'custom_css_preprocessor', $args['preprocessor'] );

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
			$post['post_content'] = $css;
			$post['post_title'] = 'safecss';
			$post['post_status'] = 'publish';
			$post['post_type'] = 'safecss';
			$post['post_content_filtered'] = $compressed_css;

			// Set excerpt to current theme, for display in revisions list
			if ( function_exists( 'wp_get_theme' ) ) {
				$current_theme = wp_get_theme();
				$post['post_excerpt'] = $current_theme->Name;
			}
			else {
				$post['post_excerpt'] = get_current_theme();
			}

			// Insert the CSS into wp_posts
			$post_id = wp_insert_post( $post );
			wp_cache_set( 'custom_css_post_id', $post_id );
			return $post_id;
		}

		// Update CSS in post array with new value passed to this function
		$safecss_post['post_content'] = $css;
		$safecss_post['post_content_filtered'] = $compressed_css;

		// Set excerpt to current theme, for display in revisions list
		if ( function_exists( 'wp_get_theme' ) ) {
			$current_theme = wp_get_theme();
			$safecss_post['post_excerpt'] = $current_theme->Name;
		}
		else {
			$safecss_post['post_excerpt'] = get_current_theme();
		}

		// Don't carry over last revision's timestamps, otherwise revisions all have matching timestamps
		unset( $safecss_post['post_date'] );
		unset( $safecss_post['post_date_gmt'] );
		unset( $safecss_post['post_modified'] );
		unset( $safecss_post['post_modified_gmt'] );

		// Do not update post if we are only saving a preview
		if ( false === $is_preview ) {
			$post_id = wp_update_post( $safecss_post );
			wp_cache_set( 'custom_css_post_id', $post_id );
			return $post_id;
		}
		else if ( ! defined( 'DOING_MIGRATE' ) ) {
			return _wp_put_post_revision( $safecss_post );
		}
	}

	static function skip_stylesheet() {
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

				if ( $custom_css_post_id )
					return (bool) ( get_post_meta( $custom_css_post_id, 'custom_css_add', true ) == 'no' );
				else
					return (bool) ( get_option( 'safecss_add' ) == 'no' );
			}
		}
	}

	static function is_preview() {
		return isset( $_GET['csspreview'] ) && $_GET['csspreview'] === 'true';
	}

	/*
	 * False when the site has the Custom Design upgrade.
	 * Used only on WordPress.com.
	 */
	static function is_freetrial() {
		return apply_filters( 'safecss_is_freetrial', false );
	}

	static function get_css( $compressed = false ) {
		$default_css = apply_filters( 'safecss_get_css_error', false );

		if ( $default_css !== false )
			return $default_css;

		$option = ( Jetpack_Custom_CSS::is_preview() || Jetpack_Custom_CSS::is_freetrial() ) ? 'safecss_preview' : 'safecss';

		if ( 'safecss' == $option ) {
			if ( get_option( 'safecss_revision_migrated' ) ) {
				$safecss_post = Jetpack_Custom_CSS::get_post();
				$css = ( $compressed && $safecss_post['post_content_filtered'] ) ? $safecss_post['post_content_filtered'] : $safecss_post['post_content'];
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
			$css = stripslashes( $css );
			$css = Jetpack_Custom_CSS::minify( $css, get_post_meta( $safecss_post['ID'], 'custom_css_preprocessor', true ) );
		}

		$css = str_replace( array( '\\\00BB \\\0020', '\0BB \020', '0BB 020' ), '\00BB \0020', $css );

		if ( empty( $css ) ) {
			$css = "/*\n"
				. wordwrap(
					apply_filters(
						'safecss_default_css',
						__(
							"Welcome to Custom CSS!\n\nCSS (Cascading Style Sheets) is a kind of code that tells the browser how to render a web page. You may delete these comments and get started with your customizations.\n\nBy default, your stylesheet will be loaded after the theme stylesheets, which means that your rules can take precedence and override the theme CSS rules. Just write here what you want to change, you don't need to copy all your theme's stylesheet content.",
							'jetpack'
						)
					)
				)
				. "\n*/";
		}

		$css = apply_filters( 'safecss_css', $css );

		return $css;
	}

	static function print_css() {
		do_action( 'safecss_print_pre' );

		echo Jetpack_Custom_CSS::get_css( true );
	}

	static function link_tag() {
		global $blog_id, $current_blog;

		if ( apply_filters( 'safecss_style_error', false ) )
			return;

		if ( ! is_super_admin() && isset( $current_blog ) && ( 1 == $current_blog->spam || 1 == $current_blog->deleted ) )
			return;

		if ( Jetpack_Custom_CSS::is_customizer_preview() )
			return;

		$css    = '';
		$option = Jetpack_Custom_CSS::is_preview() ? 'safecss_preview' : 'safecss';

		if ( 'safecss' == $option ) {
			if ( get_option( 'safecss_revision_migrated' ) ) {
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
				$_css = get_option( 'safecss' );
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

		$href = trailingslashit( site_url() );
		$href = add_query_arg( 'custom-css', 1, $href );
		$href = add_query_arg( 'csblog', $blog_id, $href );
		$href = add_query_arg( 'cscache', 6, $href );
		$href = add_query_arg( 'csrev', (int) get_option( $option . '_rev' ), $href );

		$href = apply_filters( 'safecss_href', $href, $blog_id );

		if ( Jetpack_Custom_CSS::is_preview() )
			$href = add_query_arg( 'csspreview', 'true', $href );

		?>
		<link rel="stylesheet" id="custom-css-css" type="text/css" href="<?php echo esc_url( $href ); ?>" />
		<?php

		do_action( 'safecss_link_tag_post' );
	}

	static function style_filter( $current ) {
		if ( Jetpack_Custom_CSS::is_freetrial() && ( ! Jetpack_Custom_CSS::is_preview() || ! current_user_can( 'switch_themes' ) ) )
			return $current;
		else if ( Jetpack_Custom_CSS::skip_stylesheet() )
			return apply_filters( 'safecss_style_filter_url', plugins_url( 'custom-css/blank.css', __FILE__ ) );

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
		$message = apply_filters( 'safecss_preview_message', $message );

		$preview_flag_js = "var flag = document.createElement('div');
	flag.innerHTML = " . json_encode( $message ) . ";
	flag.style.background = 'black';
	flag.style.color = 'white';
	flag.style.textAlign = 'center';
	flag.style.fontSize = '15px';
	flag.style.padding = '1px';
	document.body.style.paddingTop = '32px';
	document.body.insertBefore(flag, document.body.childNodes[0]);
	";

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
		$title = __( 'Edit CSS', 'jetpack' );
		$hook = add_theme_page( $title, $title, 'edit_theme_options', 'editcss', array( 'Jetpack_Custom_CSS', 'admin' ) );

		add_action( "admin_head-$hook", array( 'Jetpack_Custom_CSS', 'admin_head' ) );
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
		wp_enqueue_script( 'custom-css-editor', plugins_url( 'custom-css/js/css-editor.js', __FILE__ ), 'jquery', '20130325', true );
		wp_enqueue_style( 'custom-css-editor', plugins_url( 'custom-css/css/css-editor.css', __FILE__ ) );

		if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) {
			$url = plugins_url( 'custom-css/js/', __FILE__ );

			wp_enqueue_script( 'jquery.spin' );
			wp_enqueue_script( 'safecss-ace', $url . 'ace/ace.js', array(), '20130213', true );
			wp_enqueue_script( 'safecss-ace-css', $url . 'ace/mode-css.js', array( 'safecss-ace' ), '20130213', true );
			wp_enqueue_script( 'safecss-ace-less', $url . 'ace/mode-less.js', array( 'safecss-ace' ), '20130213', true );
			wp_enqueue_script( 'safecss-ace-scss', $url . 'ace/mode-scss.js', array( 'safecss-ace' ), '20130213', true );
			wp_enqueue_script( 'safecss-ace-use', $url . 'safecss-ace.js', array( 'jquery', 'safecss-ace-css' ), '20130213', true );

			wp_enqueue_style( 'custom-css-ace', plugins_url( 'custom-css/css/ace.css', __FILE__ ) );
		}
	}

	static function admin_head() {
		if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) {
			?>
			<script type="text/javascript">
				/*<![CDATA[*/
				var SAFECSS_USE_ACE = true;
				var safecssAceSrcPath = <?php echo json_encode( parse_url( plugins_url( 'custom-css/js/ace/', __FILE__ ), PHP_URL_PATH ) ); ?>;
				/*]]>*/
			</script>
			<?php
		}
	}

	static function saved_message() {
		echo '<div id="message" class="updated fade"><p><strong>' . __( 'Stylesheet saved.', 'jetpack' ) . '</strong></p></div>';
	}

	static function admin() {
		add_meta_box( 'submitdiv', __( 'Publish', 'jetpack' ), array( __CLASS__, 'publish_box' ), 'editcss', 'side' );
		add_action( 'custom_css_submitbox_misc_actions', array( __CLASS__, 'content_width_settings' ) );

		$safecss_post = Jetpack_Custom_CSS::get_post();

		if ( ! empty( $safecss_post ) && 0 < $safecss_post['ID'] && wp_get_post_revisions( $safecss_post['ID'] ) )
			add_meta_box( 'revisionsdiv', __( 'CSS Revisions', 'jetpack' ), array( __CLASS__, 'revisions_meta_box' ), 'editcss', 'side' );
		?>
		<div class="wrap columns-2">
			<?php do_action( 'custom_design_header' ); ?>
			<h2><?php _e( 'CSS Stylesheet Editor', 'jetpack' ); ?></h2>
			<form id="safecssform" action="" method="post">
				<?php wp_nonce_field( 'safecss' ) ?>
				<?php wp_nonce_field( 'meta-box-order', 'meta-box-order-nonce', false ); ?>
				<?php wp_nonce_field( 'closedpostboxes', 'closedpostboxesnonce', false ); ?>
				<input type="hidden" name="action" value="save" />
				<div id="poststuff" class="metabox-holder has-right-sidebar">
					<p class="css-support"><?php echo apply_filters( 'safecss_intro_text', __( 'New to CSS? Start with a <a href="http://www.htmldog.com/guides/cssbeginner/">beginner tutorial</a>. Questions?
		Ask in the <a href="http://wordpress.org/support/forum/themes-and-templates">Themes and Templates forum</a>.', 'jetpack' ) ); ?></p>
					<div id="postbox-container-1" class="inner-sidebar">
						<?php do_meta_boxes( 'editcss', 'side', $safecss_post ); ?>
					</div>
					<div id="post-body">
						<div id="post-body-content">
							<div class="postarea">
								<?php if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) { ?>
									<div id="safecss-container">
										<div id="safecss-ace"></div>
									</div>
									<script type="text/javascript">
										jQuery.fn.spin && jQuery("#safecss-container").spin( 'large' );
									</script>
									<textarea id="safecss" name="safecss" class="hide-if-js"><?php echo esc_textarea( Jetpack_Custom_CSS::get_css() ); ?></textarea>
									<div class="clear"></div>
								<?php } else { ?>
									<p><textarea id="safecss" name="safecss"><?php echo str_replace('</textarea>', '&lt;/textarea&gt', Jetpack_Custom_CSS::get_css()); ?></textarea></p>
								<?php } ?>
							</div>
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
			<label><?php esc_html_e( 'Content Width:', 'jetpack' ); ?></label>
			<span id="content-width-display" data-default-text="<?php esc_attr_e( 'Default', 'jetpack' ); ?>" data-custom-text="<?php esc_attr_e( '%s px', 'jetpack' ); ?>"><?php echo $custom_content_width ? sprintf( esc_html__( '%s px', 'jetpack' ), $custom_content_width ) : esc_html_e( 'Default', 'jetpack' ); ?></span>
			<a class="edit-content-width hide-if-no-js" href="#content-width"><?php echo esc_html_e( 'Edit', 'jetpack' ); ?></a>
			<div id="content-width-select" class="hide-if-js">
				<input type="hidden" name="custom_content_width" id="custom_content_width" value="<?php echo esc_attr( $custom_content_width ); ?>" />
				<p>
					<?php

					printf(
						__( 'Limit width to %1$s pixels for videos, full size images, and other shortcodes. (<a href="%2$s">More info</a>.)', 'jetpack' ),
						'<input type="text" id="custom_content_width_visible" value="' . esc_attr( $custom_content_width ) . '" size="4" />',
						apply_filters( 'safecss_limit_width_link', 'http://jetpack.me/support/custom-css/#limited-width' )
					);

					?>
				</p>
				<?php

				if ( !empty( $GLOBALS['content_width'] ) && $custom_content_width != $GLOBALS['content_width'] ) {
					if ( function_exists( 'wp_get_theme' ) )
						$current_theme = wp_get_theme()->Name;
					else
						$current_theme = get_current_theme();

					?>
					<p><?php printf( __( 'The default content width for the %s theme is %d pixels.', 'jetpack' ), $current_theme, intval( $GLOBALS['content_width'] ) ); ?></p>
					<?php
				}

				?>
				<a class="save-content-width hide-if-no-js button" href="#content-width"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
				<a class="cancel-content-width hide-if-no-js" href="#content-width"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
			</div>
			<script type="text/javascript">
				jQuery( function ( $ ) {
					var defaultContentWidth = <?php echo isset( $GLOBALS['content_width'] ) ? json_encode( intval( $GLOBALS['content_width'] ) ) : 0; ?>;

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
								<?php printf( __( 'Replace <a href="%s">theme\'s CSS</a> <b>(Advanced)</b>', 'jetpack' ), apply_filters( 'safecss_theme_stylesheet_url', get_stylesheet_uri() ) ); ?>
							</label>
						</p>
						<a class="save-css-mode hide-if-no-js button" href="#css-mode"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
						<a class="cancel-css-mode hide-if-no-js" href="#css-mode"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
					</div>
				</div>
				<?php do_action( 'custom_css_submitbox_misc_actions' ); ?>
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
	 * Called by afecss_admin	 *
	 * @param array $safecss_post
	 * @global $post
	 * @uses WP_Query, wp_post_revision_title, esc_html, add_query_arg, menu_page_url, wp_reset_query
	 * @return string
	 */
	static function revisions_meta_box( $safecss_post ) {
		$max_revisions = defined( 'WP_POST_REVISIONS' ) && is_numeric( WP_POST_REVISIONS ) ? (int) WP_POST_REVISIONS : 25;
		$posts_per_page = isset( $_GET['show_all_rev'] ) ? $max_revisions : 6;

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

			if ( $revisions->found_posts > 6 ) {
				?>
				<br>
				<a href="<?php echo add_query_arg( 'show_all_rev', 'true', menu_page_url( 'editcss', false ) ); ?>"><?php esc_html_e( 'Show more', 'jetpack' ); ?></a>
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

		update_option( 'safecss_rev', intval( get_option( 'safecss_rev' ) ) + 1 );

		update_post_meta( $safecss_post_id, 'custom_css_add', 'yes' );
		update_post_meta( $safecss_post_id, 'content_width', false );
		update_post_meta( $safecss_post_id, 'custom_css_preprocessor', '' );
		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_add', 'yes' );
		update_metadata( 'post', $safecss_revision['ID'], 'content_width', false );
		update_metadata( 'post', $safecss_revision['ID'], 'custom_css_preprocessor', '' );
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
		update_post_meta( $_post->ID, 'content_width', $content_width );
		update_post_meta( $_post->ID, 'custom_css_add', $custom_css_add );
		update_post_meta( $_post->ID, 'custom_css_preprocessor', $preprocessor );
	}

	/**
	 * Migration routine for moving safecss from wp_options to wp_posts to support revisions
	 *
	 * @return void
	 */
	static function upgrade() {
		$css = get_option( 'safecss' );

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

	static function revision_redirect( $redirect ) {
		global $post;

		if ( 'safecss' == $post->post_type ) {
			if ( strstr( $redirect, 'action=edit' ) ) {
				return 'themes.php?page=editcss';
			}

			if ( 'edit.php' == $redirect ) {
				return '';
			}
		}

		return $redirect;
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
			$custom_content_width = intval( get_post_meta( $safecss_post['ID'], 'content_width', true ) );
		} else if ( ! Jetpack_Custom_CSS::is_freetrial() ) {
			$custom_css_post_id = Jetpack_Custom_CSS::post_id();
			if ( $custom_css_post_id )
				$custom_content_width = intval( get_post_meta( $custom_css_post_id, 'content_width', true ) );
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

	return Jetpack_Custom_CSS::enqueue_scripts();
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

	return Jetpack_Custom_CSS::restore_revision( $_post_id, $_revision_id );;
}

function safecss_class() {
	// Wrapped so we don't need the parent class just to load the plugin
	if ( class_exists('safecss') )
		return;

	require_once( dirname( __FILE__ ) . '/csstidy/class.csstidy.php' );

	class safecss extends csstidy_optimise {
		function safecss( &$css ) {
			return $this->csstidy_optimise( $css );
		}

		function postparse() {
			do_action( 'csstidy_optimize_postparse', $this );

			return parent::postparse();
		}

		function subvalue() {
			do_action( 'csstidy_optimize_subvalue', $this );

			return parent::subvalue();
		}
	}
}

if ( ! function_exists( 'safecss_filter_attr' ) ) {
	function safecss_filter_attr( $css, $element = 'div' ) {
		return Jetpack_Safe_CSS::filter_attr( $css, $element );
	}
}

add_action( 'init', array( 'Jetpack_Custom_CSS', 'init' ) );

include dirname( __FILE__ ) . '/custom-css/preprocessors.php';