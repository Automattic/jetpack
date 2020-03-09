<?php
/**
 * Podcast Episodes Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Jetpack\Podcast_Episodes_Block;

const FEATURE_NAME = 'podcast-episodes';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'attributes'      => array(
				'url'         => array(
					'type' => 'url',
				),
				'itemsToShow' => array(
					'type'    => 'integer',
					'default' => 5,
				),
			),
			'render_callback' => __NAMESPACE__ . '\load_assets',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Podcast Episodes block registration/dependency declaration.
 *
 * @param array  $attributes Array containing the Podcast Episodes block attributes.
 * @param string $content String containing the Podcast Episodes block content.
 *
 * @return string
 */
function load_assets( $attributes, $content ) {
	$rss = fetch_feed( 'https://anchor.fm/s/9400d7c/podcast/rss' );

	if ( is_wp_error( $rss ) ) {
		return '<div class="components-placeholder"><div class="notice notice-error"><strong>' . __( 'RSS Error:', 'jetpack' ) . '</strong> ' . $rss->get_error_message() . '</div></div>';
	}

	if ( ! $rss->get_item_quantity() ) {
		return '<div class="components-placeholder"><div class="notice notice-error">' . __( 'An error has occurred, which probably means the feed is down. Try again later.', 'jetpack' ) . '</div></div>';
	}

	$episodes   = $rss->get_items( 0, $attributes['itemsToShow'] );
	$list_items = array();

	foreach ( $episodes as $episode ) {
		$list_item = array(
			'src'         => esc_url( $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] ),
			'type'        => esc_attr( $episode->data['child']['']['enclosure'][0]['attribs']['']['type'] ),
			'caption'     => '',
			'description' => wp_kses_post( $episode->get_description() ),
			'meta'        => array(),
		);

		if ( ! empty( $episode->data['child']['http://www.itunes.com/dtds/podcast-1.0.dtd']['image'][0]['attribs']['']['href'] ) ) {
			$list_item['image']['src'] = esc_url( $episode->data['child']['http://www.itunes.com/dtds/podcast-1.0.dtd']['image'][0]['attribs']['']['href'] );
			$list_item['thumb']['src'] = $list_item['image']['src'];
		}

		if ( ! empty( $episode->data['child']['']['enclosure'][0]['attribs']['']['length'] ) ) {
			$list_item['meta']['length_formatted'] = date_i18n( 'H:i:s', $episode->data['child']['http://www.itunes.com/dtds/podcast-1.0.dtd']['duration'][0]['data'] );
		}

		if ( ! empty( $episode->data['child']['http://purl.org/dc/elements/1.1/']['creator'][0]['data'] ) ) {
			$list_item['meta']['artist'] = esc_html( $episode->data['child']['http://purl.org/dc/elements/1.1/']['creator'][0]['data'] );
		}

		$list_item['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );
		if ( empty( $list_item['title'] ) ) {
			$list_item['title'] = __( '(no title)', 'jetpack' );
		}

		$list_items[] = $list_item;
	}

	global $content_width;

	$data = array(
		'type'         => 'audio',
		// Don't pass strings to JSON, will be truthy in JS.
		'tracklist'    => true,
		'tracknumbers' => true,
		'images'       => true,
		'artists'      => true,
		'tracks'       => $list_items,
	);

	$outer         = 22; // Default padding and border of wrapper.
	$default_width = 640;
	$theme_width   = empty( $content_width ) ? $default_width : ( $content_width - $outer );

	ob_start();
	wp_playlist_scripts( 'audio' );
	/**
	 * Prints and enqueues playlist scripts, styles, and JavaScript templates.
	 *
	 * @since 3.9.0
	 *
	 * @param string $type  Type of playlist. Possible values are 'audio' or 'video'.
	 * @param string $style The 'theme' for the playlist. Core provides 'light' and 'dark'.
	 */
	do_action( 'wp_playlist_scripts', 'audio', 'light' );

	?>
	<div class="wp-playlist wp-audio-playlist wp-playlist-light">
		<div class="wp-playlist-current-item"></div>
		<audio controls="controls" preload="none" width="<?php echo (int) $theme_width; ?>"></audio>
		<div class="wp-playlist-next"></div>
		<div class="wp-playlist-prev"></div>
		<noscript>
			<ol>
				<?php
				foreach ( $list_items as $att_id => $attachment ) :
					printf( '<li>%s</li>', esc_url( $attachment['src'] ) );
				endforeach;
				?>
			</ol>
		</noscript>
		<script type="application/json" class="wp-playlist-script"><?php echo wp_json_encode( $data ); ?></script>
	</div>
	<?php
	/*
	 * Enqueue necessary scripts and styles.
	 */
	\Jetpack_Gutenberg::load_assets_as_required( 'podcast-episodes' );

	return ob_get_clean();
}
