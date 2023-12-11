<?php
/**
 * Like Block.
 *
 * @since 12.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use GP_Locales;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'api_version'     => 3,
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Load the editor scripts.
 */
function load_editor_scripts() {
	// phpcs:disable Squiz.PHP.CommentedOutCode.Found
	// todo: wp_enqueue_style( 'jetpack_likes', plugins_url( 'modules/likes/style.css', __FILE__ ), array(), JETPACK__VERSION );
	wp_register_script(
		'jetpack_likes_queuehandler',
		Assets::get_file_url_for_environment(
			'_inc/build/likes/queuehandler.min.js',
			'modules/likes/queuehandler.js'
		),
		array(),
		JETPACK__VERSION,
		true
	);

	wp_enqueue_script( 'jetpack_likes_queuehandler' );
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\load_editor_scripts' );

/**
 * This function needs to get loaded after the like scripts get added to the page.
 */
function jetpack_likes_master_iframe() {
	$version = gmdate( 'YW' );

	$_locale = get_locale();

	if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
		return false;
	}

	require_once JETPACK__GLOTPRESS_LOCALES_PATH;

	$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
	$_locale   = isset( $gp_locale->slug ) ? $gp_locale->slug : '';

	$likes_locale = ( '' === $_locale || 'en' === $_locale ) ? '' : '&amp;lang=' . strtolower( $_locale );
	/** This filter is documented in projects/plugins/jetpack/modules/likes.php */
	$new_layout       = apply_filters( 'likes_new_layout', true ) ? '&amp;n=1' : '';
	$new_layout_class = $new_layout ? 'wpl-new-layout' : '';

	$src = sprintf(
		'https://widgets.wp.com/likes/master.html?ver=%1$s#ver=%1$s%2$s%3$s',
		$version,
		$likes_locale,
		$new_layout
	);

	if ( $new_layout ) {
		// The span content is replaced by queuehandler when showOtherGravatars is called.
		$likers_text = wp_kses( '<span>%d</span>', array( 'span' => array() ) );
	} else {
		/* translators: The value of %d is not available at the time of output */
		$likers_text = wp_kses( __( '<span>%d</span> bloggers like this:', 'jetpack' ), array( 'span' => array() ) );
	}
	?>
	<iframe src='<?php echo esc_url( $src ); ?>' scrolling='no' id='likes-master' name='likes-master' style='display:none;'></iframe>
	<div id='likes-other-gravatars' class='<?php echo esc_attr( $new_layout_class ); ?>'><div class="likes-text"><?php echo $likers_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div><ul class="wpl-avatars sd-like-gravatars"></ul></div>
	<?php
}
add_action( 'admin_footer', __NAMESPACE__ . '\jetpack_likes_master_iframe' );

/**
 * Like block render function.
 *
 * @param array  $attr Array containing the Like block attributes.
 * @param string $content String containing the Like block content.
 * @param object $block Object containing the Like block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$html = '';

	$uniqid  = uniqid();
	$post_id = $block->context['postId'];
	$title   = esc_html__( 'Like or Reblog', 'jetpack' );

	/**
	 * Enable an alternate Likes layout.
	 *
	 * @since 12.9
	 *
	 * @module likes
	 *
	 * @param bool $new_layout Enable the new Likes layout. False by default.
	 */
	$new_layout = apply_filters( 'likes_new_layout', true ) ? '&amp;n=1' : '';

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id  = get_current_blog_id();
		$bloginfo = get_blog_details( (int) $blog_id );
		$domain   = $bloginfo->domain;
		$version  = '20231201';
		$src      = sprintf( '//widgets.wp.com/likes/index.html?ver=%1$d#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%4$s&amp;obj_id=%2$d-%3$d-%5$s%6$s', $version, $blog_id, $post_id, $domain, $uniqid, $new_layout );
		$headline = '';

		// provide the mapped domain when needed
		if ( isset( $_SERVER['HTTP_HOST'] ) && strpos( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ), '.wordpress.com' ) === false ) {
			$sanitized_host = filter_var( wp_unslash( $_SERVER['HTTP_HOST'] ), FILTER_SANITIZE_URL );
			$src           .= '&amp;domain=' . rawurlencode( $sanitized_host );
		}
	} else {
		$blog_id   = \Jetpack_Options::get_option( 'id' );
		$url       = home_url();
		$url_parts = wp_parse_url( $url );
		$domain    = $url_parts['host'];
		$src       = sprintf( 'https://widgets.wp.com/likes/#blog_id=%1$d&amp;post_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s%5$s', $blog_id, $post_id, $domain, $uniqid, $new_layout );
		$headline  = sprintf(
			/** This filter is already documented in modules/sharedaddy/sharing-service.php */
			apply_filters( 'jetpack_sharing_headline_html', '<h3 class="sd-title">%s</h3>', esc_html__( 'Like this:', 'jetpack' ), 'likes' ),
			esc_html__( 'Like this:', 'jetpack' )
		);
	}

	$name    = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
	$wrapper = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );

	$html = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='" . esc_attr( $wrapper ) . "' data-src='" . esc_attr( $src ) . "' data-name='" . esc_attr( $name ) . "' data-title='" . esc_attr( $title ) . "'>"
		. $headline
		. "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height: 55px;'><span class='button'><span>" . esc_html__( 'Like', 'jetpack' ) . "</span></span> <span class='loading'>" . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>'
		. "<span class='sd-text-color'></span><a class='sd-link-color'></a>"
		. '</div>';

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$html
	);
}
