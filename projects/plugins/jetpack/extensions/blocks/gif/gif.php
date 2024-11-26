<?php
/**
 * GIF Block.
 *
 * @since 7.0.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Gif;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Gif block registration/dependency declaration.
 *
 * @param array $attr - Array containing the gif block attributes.
 *
 * @return string
 */
function render_block( $attr ) {
	$padding_top = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : '56.2%';
	$style       = 'padding-top:' . esc_attr( $padding_top ) . '; width: 100%;';
	$gif_url     = isset( $attr['gifUrl'] ) ? esc_url( $attr['gifUrl'] ) : null;
	$giphy_url   = isset( $attr['giphyUrl'] ) ? esc_url( $attr['giphyUrl'] ) : null;
	$search_text = isset( $attr['searchText'] ) ? esc_attr( $attr['searchText'] ) : '';
	$caption     = isset( $attr['caption'] ) ? wp_kses_post( $attr['caption'] ) : null;

	if ( ! $gif_url && ! $giphy_url ) {
		return null;
	}

	// If the giphy url is set, use it for backward compatibility. Otherwise, use the gif url from Tumblr.
	$url = $giphy_url ? $giphy_url : $gif_url;

	$classes     = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr );
	$placeholder = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_attr( $search_text ) );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<?php if ( Blocks::is_amp_request() ) : ?>
				<amp-iframe src="<?php echo esc_url( $url ); ?>" width="100" height="<?php echo absint( $padding_top ); ?>" sandbox="allow-scripts allow-same-origin" layout="responsive">
					<div placeholder>
						<?php echo wp_kses_post( $placeholder ); ?>
					</div>
				</amp-iframe>
			<?php else : ?>
				<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
					<iframe src="<?php echo esc_url( $url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
				</div>
			<?php endif; ?>

			<?php if ( $caption ) : ?>
				<figcaption class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
			<?php endif; ?>
		</figure>
	</div>
	<?php
	$html = ob_get_clean();

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $html;
}
