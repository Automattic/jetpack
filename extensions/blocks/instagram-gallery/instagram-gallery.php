<?php
/**
 * Instagram Gallery Block.
 *
 * @since 8.5.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Instagram_Gallery;

use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Instagram_Gallery_Helper;

const FEATURE_NAME = 'instagram-gallery';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
		jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => __NAMESPACE__ . '\render_block' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Instagram Gallery block render callback.
 *
 * @param array  $attributes Array containing the Instagram Gallery block attributes.
 * @param string $content The Instagram Gallery block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if ( ! array_key_exists( 'accessToken', $attributes ) ) {
		return '';
	}

	$access_token = $attributes['accessToken'];
	$columns      = get_instagram_gallery_attribute( 'columns', $attributes );
	$count        = get_instagram_gallery_attribute( 'count', $attributes );
	$spacing      = get_instagram_gallery_attribute( 'spacing', $attributes );

	$grid_classes = Jetpack_Gutenberg::block_classes(
		FEATURE_NAME,
		$attributes,
		array(
			'wp-block-jetpack-instagram-gallery__grid',
			'wp-block-jetpack-instagram-gallery__grid-columns-' . $columns,
		)
	);
	$grid_style   = 'grid-gap: ' . $spacing . 'px;';
	$photo_style  = 'padding: ' . $spacing . 'px;';

	if ( ! class_exists( 'Jetpack_Instagram_Gallery_Helper' ) ) {
		\jetpack_require_lib( 'class-jetpack-instagram-gallery-helper' );
	}
	$gallery = Jetpack_Instagram_Gallery_Helper::get_instagram_gallery( $access_token, $count );
	$images  = array_slice( $gallery->images, 0, $count );

	if ( is_wp_error( $gallery ) || empty( $gallery->images ) ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	ob_start();
	?>

	<div class="<?php echo esc_attr( $grid_classes ); ?>" style="<?php echo esc_attr( $grid_style ); ?>">
		<?php foreach ( $images as $image ) : ?>
			<a
				class="wp-block-jetpack-instagram-gallery__grid-post"
				href="<?php echo esc_url( $image->link ); ?>"
				rel="noopener noreferrer"
				style="<?php echo esc_attr( $photo_style ); ?>"
				target="_blank"
			>
				<img
					alt="<?php echo esc_attr( $image->title ? $image->title : $image->link ); ?>"
					src="<?php echo esc_url( $image->url ); ?>"
				/>
			</a>
		<?php endforeach; ?>
	</div>

	<?php
	return ob_get_clean();
}

/**
 * Get Instagram Gallery block attribute.
 *
 * @param string $attribute  String containing the attribute name to get.
 * @param array  $attributes Array containing the Instagram Gallery block attributes.
 *
 * @return mixed
 */
function get_instagram_gallery_attribute( $attribute, $attributes ) {
	if ( array_key_exists( $attribute, $attributes ) ) {
		return $attributes[ $attribute ];
	}

	$default_attributes = array(
		'columns' => 3,
		'count'   => 9,
		'spacing' => 10,
	);

	if ( array_key_exists( $attribute, $default_attributes ) ) {
		return $default_attributes[ $attribute ];
	}
}
