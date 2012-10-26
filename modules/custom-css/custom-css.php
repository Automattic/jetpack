<?php

/**
 * Migration routine for moving safecss from wp_options to wp_posts to support revisions
 *
 * @return void
 */
function migrate() {
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
		$safecss_post = get_safecss_post();
		if ( empty( $safecss_post ) )
			return;
		$safecss_post_hash = md5( $safecss_post['post_content'] );
		$current_revision = get_current_revision();
		if ( null == $current_revision )
			return;
		$current_revision_hash = md5( $current_revision['post_content'] );

		// If hashes are not equal, set safecss post with content from current revision
		if ( $safecss_post_hash !== $current_revision_hash ) {
			save_revision( $current_revision['post_content'] );
			// Reset post_content to display the migrated revsion
			$safecss_post['post_content'] = $current_revision['post_content'];
		}

		// Set option so that we dont keep doing this
		update_option( 'safecss_revision_migrated', time() );
	}

	$newest_safecss_post = get_current_revision();

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

function safecss_revision_redirect( $redirect ) {
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

// Add safecss to allowed post_type's for revision
add_filter('revision_redirect', 'safecss_revision_redirect');

function safecss_revision_post_link( $post_link, $post_id, $context ) {
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

// Override the edit link, the default link causes a redirect loop
add_filter( 'get_edit_post_link', 'safecss_revision_post_link', 10, 3 );

/**
 * Get the safecss record
 *
 * @return array
 */
function get_safecss_post() {
	$safecss_post = array();
	$a = array_shift( get_posts( array( 'posts_per_page' => 1, 'post_type' => 'safecss', 'post_status' => 'publish', 'orderby' => 'date', 'order' => 'DESC' ) ) );
	if ( $a )
		$safecss_post = get_object_vars( $a ); // needed for php 5.3
	return $safecss_post;
}

/**
 * Get the current revision of the original safecss record
 *
 * @return object
 */
function get_current_revision() {
	$safecss_post = get_safecss_post();

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
function save_revision( $css, $is_preview = false ) {
	$safecss_post = get_safecss_post();

	$compressed_css = custom_css_minify( $css );

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
		return wp_insert_post( $post );
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
		return wp_update_post( $safecss_post );
	}
	else if ( !defined( 'DOING_MIGRATE' ) ) {
		return _wp_put_post_revision( $safecss_post );
	}
}

function safecss_skip_stylesheet() {
	if ( custom_css_is_customizer_preview() )
		return false;
	else {
		if ( safecss_is_preview() ) {
			$safecss_post = get_current_revision();

			return (bool) ( get_option('safecss_preview_add') == 'no' || get_post_meta( $safecss_post['ID'], 'custom_css_add', true ) == 'no' );
		}
		else {
			$safecss_post = get_safecss_post();
			$safecss_post_id = isset( $safecss_post['ID'] ) ? $safecss_post['ID'] : null;
			return (bool) ( get_option('safecss_add') == 'no' || get_post_meta( $safecss_post_id, 'custom_css_add', true ) == 'no' );
		}
	}
}

function safecss_init() {
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
		safecss_print();
		exit;
	}

	if ( isset( $_GET['page'] ) && 'editcss' == $_GET['page'] && is_admin() ) {
		// Do migration routine if necessary
		migrate();

		do_action( 'safecss_migrate_post' );
	}

	add_action( 'wp_head', 'safecss_style', 101 );

	if ( !current_user_can('switch_themes') && !is_super_admin() )
		return;

	add_action('admin_menu', 'safecss_menu');

	if ( isset($_POST['safecss']) && false == strstr( $_SERVER[ 'REQUEST_URI' ], 'options.php' ) ) {
		check_admin_referer('safecss');

		// Remove wp_filter_post_kses, this causes CSS escaping issues
		remove_filter( 'content_save_pre', 'wp_filter_post_kses' );
		remove_filter( 'content_filtered_save_pre', 'wp_filter_post_kses' );
		remove_all_filters( 'content_save_pre' );

		do_action( 'safecss_save_pre' );

		$warnings = array();

		safecss_class();
		$csstidy = new csstidy();
		$csstidy->optimise = new safecss($csstidy);

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

		$css = $orig = stripslashes($_POST['safecss']);

		$css = preg_replace('/\\\\([0-9a-fA-F]{4})/', '\\\\\\\\$1', $prev = $css);
		if ( $css != $prev )
			$warnings[] = 'preg_replace found stuff';

		// Some people put weird stuff in their CSS, KSES tends to be greedy
		$css = str_replace( '<=', '&lt;=', $css );
		// Why KSES instead of strip_tags?  Who knows?
		$css = wp_kses_split($prev = $css, array(), array());
		$css = str_replace( '&gt;', '>', $css ); // kses replaces lone '>' with &gt;
		// Why both KSES and strip_tags?  Because we just added some '>'.
		$css = strip_tags( $css );

		if ( $css != $prev )
			$warnings[] = 'kses found stuff';

		do_action( 'safecss_parse_pre', $csstidy, $css );

		$csstidy->parse($css);

		do_action( 'safecss_parse_post', $csstidy, $warnings );

		$css = $csstidy->print->plain();

		if ( isset( $_POST['custom_content_width'] ) && intval($_POST['custom_content_width']) > 0 )
			$custom_content_width = intval($_POST['custom_content_width']);
		else
			$custom_content_width = false;

		if ( $_POST['add_to_existing'] == 'true' )
			$add_to_existing = 'yes';
		else
			$add_to_existing = 'no';

		if ( $_POST['action'] == 'preview' || safecss_is_freetrial() ) {
			// Save the CSS
			$safecss_revision_id = save_revision( $css, true );

			// Cache Buster
			update_option('safecss_preview_rev', intval( get_option('safecss_preview_rev') ) + 1);

			update_metadata( 'post', $safecss_revision_id, 'custom_css_add', $add_to_existing );
			update_metadata( 'post', $safecss_revision_id, 'content_width', $custom_content_width );

			if ( $_POST['action'] == 'preview' ) {
				wp_safe_redirect( add_query_arg( 'csspreview', 'true', get_option('home') ) );
				exit;
			}

			do_action( 'safecss_save_preview_post' );
		}

		// Save the CSS
		$safecss_post_id = save_revision( $css );

		$safecss_post_revision = get_current_revision();

		update_option( 'safecss_rev', intval( get_option( 'safecss_rev' ) ) + 1 );

		update_post_meta( $safecss_post_id, 'custom_css_add', $add_to_existing );
		update_post_meta( $safecss_post_id, 'content_width', $custom_content_width );
		update_metadata( 'post', $safecss_post_revision['ID'], 'custom_css_add', $add_to_existing );
		update_metadata( 'post', $safecss_post_revision['ID'], 'content_width', $custom_content_width );

		add_action('admin_notices', 'safecss_saved');
	}

	// Modify all internal links so that preview state persists
	if ( safecss_is_preview() )
		ob_start('safecss_buffer');
}
add_action('init', 'safecss_init');

function safecss_is_preview() {
	return isset($_GET['csspreview']) && $_GET['csspreview'] === 'true';
}

/*
 * safecss_is_freetrial() is false when the site has the Custom Design upgrade.
 * Used only on WordPress.com.
 */
function safecss_is_freetrial() {
	return apply_filters( 'safecss_is_freetrial', false );
}

function safecss( $compressed = false ) {
	$default_css = apply_filters( 'safecss_get_css_error', false );

	if ( $default_css !== false )
		return $default_css;

	$option = ( safecss_is_preview() || safecss_is_freetrial() ) ? 'safecss_preview' : 'safecss';

	if ( 'safecss' == $option ) {
		if ( get_option( 'safecss_revision_migrated' ) ) {
			$safecss_post = get_safecss_post();
			$css = ( $compressed && $safecss_post['post_content_filtered'] ) ? $safecss_post['post_content_filtered'] : $safecss_post['post_content'];
		} else {
			$current_revision = get_current_revision();
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
		$safecss_post = get_current_revision();
		$css = $safecss_post['post_content'];
		$css = stripslashes( $css );
		$css = custom_css_minify( $css );
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

function safecss_print() {
	do_action( 'safecss_print_pre' );

	echo safecss( true );
}

function safecss_style() {
	global $blog_id, $current_blog;

	if ( apply_filters( 'safecss_style_error', false ) )
		return;

	if ( ! is_super_admin() && isset( $current_blog ) && ( 1 == $current_blog->spam || 1 == $current_blog->deleted ) )
		return;

	if ( custom_css_is_customizer_preview() )
		return;

	$option = safecss_is_preview() ? 'safecss_preview' : 'safecss';

	if ( 'safecss' == $option ) {
		if ( get_option( 'safecss_revision_migrated' ) ) {
			$safecss_post = get_safecss_post();
			$css = $safecss_post['post_content'];
		} else {
			$current_revision = get_current_revision();
			$css = $current_revision['post_content'];
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
		$safecss_post = get_current_revision();
		$css = $safecss_post['post_content'];
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

	if ( safecss_is_preview() )
		$href = add_query_arg( 'csspreview', 'true', $href );
?>

	<link rel="stylesheet" type="text/css" href="<?php echo esc_url( $href ); ?>" />
<?php
}

function safecss_style_filter( $current ) {
	if ( safecss_is_freetrial() && ( !safecss_is_preview() || !current_user_can('switch_themes') ) )
		return $current;

	else if ( safecss_skip_stylesheet() )
		return apply_filters( 'safecss_style_filter_url', 'http://' . $_SERVER['HTTP_HOST'] . '/wp-content/plugins/safecss/blank.css' );

	return $current;
}
add_filter( 'stylesheet_uri', 'safecss_style_filter' );

function safecss_buffer($html) {
	$html = str_replace('</body>', safecss_preview_flag(), $html);
	return preg_replace_callback('!href=([\'"])(.*?)\\1!', 'safecss_preview_links', $html);
}

function safecss_preview_links( $matches ) {
	if ( 0 !== strpos( $matches[2], get_option( 'home' ) ) )
		return $matches[0];

	$link = wp_specialchars_decode( $matches[2] );
	$link = add_query_arg( 'csspreview', 'true', $link );
	$link = esc_url( $link );
	return "href={$matches[1]}$link{$matches[1]}";
}

// Places a black bar above every preview page
function safecss_preview_flag() {
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

function safecss_menu() {
	$parent = 'themes.php';
	$title = __( 'Edit CSS', 'jetpack' );
	$hook = add_theme_page( $title, $title, 'edit_theme_options', 'editcss', 'safecss_admin' );
	add_action( "admin_print_scripts-$hook", 'safe_css_enqueue_scripts' );
	add_action( "admin_head-$hook", 'safecss_admin_head' );
	add_action( "load-revision.php", 'safecss_prettify_post_revisions' );
	add_action( "load-$hook", 'update_title' );
}

/**
 * Adds a menu item in the appearance section for this plugin's administration
 * page. Also adds hooks to enqueue the CSS and JS for the admin page.
 */
function update_title() {
	global $title;
	$title = __( 'CSS', 'jetpack' );
}

function safecss_prettify_post_revisions() {
	add_filter( 'the_title', 'safecss_post_title', 10, 2 );
	add_action( 'admin_head', 'safecss_remove_title_excerpt_from_revisions' );
}

function safecss_remove_title_excerpt_from_revisions() {
	global $post;

	if ( !$post ) {
		return;
	}

	if ( 'safecss' != $post->post_type ) {
		return;
	}
?>
<style type="text/css">
#revision-field-post_title, #revision-field-post_excerpt {
	display: none;
}
</style>
<?php
}
function safecss_post_title( $title, $post_id ) {
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

function safe_css_enqueue_scripts() {
	wp_enqueue_script( 'postbox' );
	if ( defined('SAFECSS_USE_ACE') && SAFECSS_USE_ACE ) {
		$url = plugins_url( 'safecss/js/', __FILE__ );
		wp_enqueue_script( 'jquery.spin' );
		wp_enqueue_script( 'safecss-ace', $url . 'ace/ace.js', array(), false, true );
		wp_enqueue_script( 'safecss-ace-css', $url . 'ace/mode-css.js', array( 'safecss-ace' ), false, true );
		wp_enqueue_script( 'safecss-ace-use', $url . 'safecss-ace.js', array( 'jquery', 'safecss-ace-css' ), false, true );
	}
}

function safecss_class() {
	// Wrapped so we don't need the parent class just to load the plugin
	if ( class_exists('safecss') )
		return;

	require_once( 'csstidy/class.csstidy.php' );

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

function safecss_admin_head() {
?>

<style type="text/css">
.wrap form.safecss {
	margin-right: 10px;
}
.wrap textarea#safecss {
	min-height: 250px;
	width: 100%;
}
p.submit {
	margin: 0 auto;
	overflow: hidden;
	padding: 5px 0 25px;
	width: 65%;
}
p.submit span {
	float: right;
	padding-right: 1.5em;
	text-align: right;
}
p.css-support {
	color: #777;
	font-size: 15px;
	font-weight: 300;
	margin: -10px 0 15px;
}
textarea#safecss {
	background: #f9f9f9;
	color: #444;
	font-family: Consolas, Monaco, Courier, monospace;
	font-size: 12px;
	line-height: 16px;
	outline: none;
	padding: 16px;
}
#poststuff .inside p.css-settings {
	margin-top: 15px;
}
#safecssform .button,
#safecssform .button-primary {
	padding: 7px 12px;
	margin-left: 6px;
}
<?php
if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) :
?>
#safecss-container {
	position: relative;
	width: 99.5%;
	height: 400px;
	border: 1px solid #dfdfdf;
	border-radius: 3px;
}
#safecss-container .ace_editor {
	font-family: Consolas, Monaco, Courier, monospace;
}
#safecss-ace {
	width: 100%;
	height: 100%;
	display: none; /* Hide on load otherwise it looks weird */
}
#safecss-ace.ace_editor {
	display: block;
}
#safecss-container .ace-tm .ace_gutter {
	background-color: #ededed;
}

<?php endif; // ace ?>

</style>
<script type="text/javascript">
/*<![CDATA[*/
var safecssResize, safecssInit;

(function($){
var safe, win;

safecssResize = function() {
	safe.height( win.height() - safe.offset().top - 250 );
};

safecssInit = function() {
	safe = $('#safecss');
	win  = $(window);

	postboxes.add_postbox_toggles('editcss');
	safecssResize();
	var button = document.getElementById('preview');
	button.onclick = function(event) {
		//window.open('<?php echo add_query_arg('csspreview', 'true', get_option('home')); ?>');
<?php
// hack for now for previewing.
// TODO: move all of this JS into its own file.
if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) { echo "\t\taceSyncCSS();\n"; } ?>
		document.forms["safecssform"].target = "csspreview";
		document.forms["safecssform"].action.value = 'preview';
		document.forms["safecssform"].submit();
		document.forms["safecssform"].target = "";
		document.forms["safecssform"].action.value = 'save';

		event = event || window.event;
		if ( event.preventDefault ) event.preventDefault();
		return false;
	}
};

window.onresize = safecssResize;
addLoadEvent(safecssInit);

})(jQuery);
/*]]>*/
</script>

<?php
}

function safecss_saved() {
	echo '<div id="message" class="updated fade"><p><strong>' . __( 'Stylesheet saved.', 'jetpack' ) . '</strong></p></div>';
}

function safecss_admin() {
?>
<div class="wrap">
	<?php do_action( 'custom_design_header' ); ?>
	<div id="poststuff" class="has-right-sidebar metabox-holder">
	<h2><?php _e( 'CSS Stylesheet Editor', 'jetpack' ); ?></h2>
	<p class="css-support"><?php echo apply_filters( 'safecss_intro_text', __( 'New to CSS? Start with a <a href="http://www.htmldog.com/guides/cssbeginner/">beginner tutorial</a>. Questions?
	Ask in the <a href="http://wordpress.org/support/forum/themes-and-templates">Themes and Templates forum</a>.', 'jetpack' ) ); ?></p>

	<form id="safecssform" action="" method="post">
		<?php if ( defined( 'SAFECSS_USE_ACE' ) && SAFECSS_USE_ACE ) : ?>
			<div id="safecss-container">
				<div id="safecss-ace"></div>
			</div>
			<script type="text/javascript">
				jQuery.fn.spin && jQuery("#safecss-container").spin( 'large' );
			</script>
			<textarea id="safecss" name="safecss" class="hide-if-js"><?php echo esc_textarea( safecss() ); ?></textarea>
			<div class="clear"></div>
		<?php else : ?>
		<p><textarea id="safecss" name="safecss"><?php echo str_replace('</textarea>', '&lt;/textarea&gt', safecss()); ?></textarea></p>
		<?php endif; ?>
		<p class="submit">
			<span>
				<input type="hidden" name="action" value="save" />
				<?php wp_nonce_field( 'safecss' ) ?>
				<input type="button" class="button" id="preview" name="preview" value="<?php esc_attr_e( 'Preview', 'jetpack' ) ?>" />
				<input type="submit" class="button-primary" id="save" name="save" value="<?php ( safecss_is_freetrial() ) ? esc_attr_e( 'Save Stylesheet &amp; Buy Upgrade', 'jetpack' ) : esc_attr_e( 'Save Stylesheet', 'jetpack' ); ?>" />
				<?php wp_nonce_field( 'closedpostboxes', 'closedpostboxesnonce', false ); ?>
			</span>
		</p>

		<?php add_meta_box( 'settingsdiv', __( 'CSS Settings', 'jetpack' ), 'custom_css_meta_box', 'editcss', 'normal' ); ?>

		<?php
		$safecss_post = get_safecss_post();

		if ( ! empty( $safecss_post ) && 0 < $safecss_post['ID'] && wp_get_post_revisions( $safecss_post['ID'] ) ) {
			echo '<div id="side-info-column" class="inner-sidebar">';
			add_meta_box( 'revisionsdiv', __( 'CSS Revisions', 'jetpack' ), 'custom_css_post_revisions_meta_box', 'editcss', 'side' );
			do_meta_boxes( 'editcss', 'side', $safecss_post );
			echo '</div>';

			echo '<div id="post-body"><div id="post-body-content">';
			do_meta_boxes( 'editcss', 'normal', $safecss_post );
			echo '</div></div>';
			echo '<div class="clear"></div>';
		} else {
			do_meta_boxes( 'editcss', 'normal', $safecss_post );
		}
		?>
		</form>
	</div>
</div>
<?php
}

/**
 * Render CSS Settings metabox
 * Called by `safecss_admin`
 *
 * @uses get_option, checked, __, get_current_theme, apply_filters, get_stylesheet_uri, _e, esc_attr, wp_get_theme
 * @return string
 */
function custom_css_meta_box() {
	if ( function_exists( 'wp_get_theme' ) ) {
		$current_theme = wp_get_theme();
		$current_theme = $current_theme->Name;
	}
	else {
		$current_theme = get_current_theme();
	}

	$safecss_post = get_current_revision();

	?>
	<p class="css-settings">
		<label><input type="radio" name="add_to_existing" value="true" <?php checked( get_post_meta( $safecss_post['ID'], 'custom_css_add', true ) != 'no' ); ?> /> <?php printf( __( 'Add my CSS to <strong>%s&apos;s</strong> CSS stylesheet.', 'jetpack' ), $current_theme ); ?></label><br />
		<label><input type="radio" name="add_to_existing" value="false" <?php checked( get_post_meta( $safecss_post['ID'], 'custom_css_add', true ) == 'no' ); ?> /> <?php printf( __( 'Don&apos;t use <strong>%s&apos;s</strong> CSS, and replace everything with my own CSS.', 'jetpack' ), $current_theme ); ?></label>
	</p>
	<p><?php printf( __( '<a href="%s">View the original stylesheet</a> for the %s theme. Use this as a reference and do not copy and paste all of it into the CSS Editor.', 'jetpack' ), apply_filters( 'safecss_theme_stylesheet_url', get_stylesheet_uri() ), $current_theme ); ?></p>
	<?php

	do_action( 'custom_css_meta_fields' );

}

/**
 * Render metabox listing CSS revisions and the themes that correspond to the revisions.
 * Called by `safecss_admin`
 *
 * @param array $safecss_post
 * @global $post
 * @uses WP_Query, wp_post_revision_title, esc_html, add_query_arg, menu_page_url, wp_reset_query
 * @return string
 */
function custom_css_post_revisions_meta_box( $safecss_post ) {
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

	if ( $revisions->have_posts() ) : ?>
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

		if ( $revisions->found_posts > 6 ) : ?>

		<br>
		<a href="<?php echo add_query_arg( 'show_all_rev', 'true', menu_page_url( 'editcss', false ) ); ?>">Show more</a>

		<?php endif; // "Show more"
	endif; // have_posts();

	wp_reset_query();
}

if ( !function_exists( 'safecss_filter_attr' ) ) {
function safecss_filter_attr($css, $element = 'div') {

	safecss_class();
	$css = $element . ' {' . $css . '}';

	$csstidy = new csstidy();
	$csstidy->optimise = new safecss($csstidy);
	$csstidy->set_cfg('remove_bslash', false);
	$csstidy->set_cfg('compress_colors', false);
	$csstidy->set_cfg('compress_font-weight', false);
	$csstidy->set_cfg('discard_invalid_properties', true);
	$csstidy->set_cfg('merge_selectors', false);
	$csstidy->set_cfg('remove_last_;', false);
	$csstidy->set_cfg('css_level', 'CSS3.0');

	$css = preg_replace('/\\\\([0-9a-fA-F]{4})/', '\\\\\\\\$1', $css);
	$css = wp_kses_split($css, array(), array());
	$csstidy->parse($css);

	$css = $csstidy->print->plain();

	$css = str_replace(array("\n","\r","\t"), '', $css);

	preg_match("/^{$element}\s*{(.*)}\s*$/", $css, $matches);

	if ( empty($matches[1]) )
		return '';

	return $matches[1];
}
}

// hook on init at priority 11
function disable_safecss_style() {
	remove_action( 'wp_head', 'safecss_style', 101 );
	remove_filter( 'stylesheet_uri', 'safecss_style_filter' );
}

/**
 * Reset all aspects of Custom CSS on a theme switch so that changing
 * themes is a sure-fire way to get a clean start.
 */
function custom_css_reset() {
	$safecss_post_id = save_revision( '' );
	$safecss_revision = get_current_revision();

	update_option( 'safecss_rev', intval( get_option( 'safecss_rev' ) ) + 1 );

	update_post_meta( $safecss_post_id, 'custom_css_add', 'yes' );
	update_post_meta( $safecss_post_id, 'content_width', false );
	update_metadata( 'post', $safecss_revision['ID'], 'custom_css_add', 'yes' );
	update_metadata( 'post', $safecss_revision['ID'], 'content_width', false );
}

add_action( 'switch_theme', 'custom_css_reset' );

function custom_css_is_customizer_preview() {
	if ( isset ( $GLOBALS['wp_customize'] ) )
		return ! $GLOBALS['wp_customize']->is_theme_active();

	return false;
}

function custom_css_minify( $css ) {
	if ( ! $css )
		return '';

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
function custom_css_restore_revision( $_post_id, $_revision_id ) {
	$_post = get_post( $_post_id );

	if ( 'safecss' != $_post->post_type )
		return;

	$safecss_revision = get_current_revision();

	$content_width = get_post_meta( $_revision_id, 'content_width', true );
	$custom_css_add = get_post_meta( $_revision_id, 'custom_css_add', true );

	update_metadata( 'post', $safecss_revision['ID'], 'content_width', $content_width );
	update_metadata( 'post', $safecss_revision['ID'], 'custom_css_add', $custom_css_add );
	update_post_meta( $_post->ID, 'content_width', $content_width );
	update_post_meta( $_post->ID, 'custom_css_add', $custom_css_add );
}

add_action( 'wp_restore_post_revision', 'custom_css_restore_revision', 10, 2 );