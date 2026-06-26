<?php
/**
 * Gif block render implementation.
 *
 * Loaded lazily from gif.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Gif;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Dynamic rendering of the block.
 *
 * @param array $attr - Array containing the gif block attributes.
 *
 * @return string
 */
function render_implementation( $attr ) {
	$padding_top = $attr['paddingTop'] ?? 0;
	$style       = 'padding-top:' . $padding_top;
	$giphy_url   = isset( $attr['giphyUrl'] )
		? Jetpack_Gutenberg::validate_block_embed_url( $attr['giphyUrl'], array( 'giphy.com' ) )
		: null;
	$search_text = $attr['searchText'] ?? '';
	$caption     = $attr['caption'] ?? null;

	if ( ! $giphy_url ) {
		return null;
	}

	$classes = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr );

	$placeholder = sprintf( '<a href="%s">%s</a>', esc_url( $giphy_url ), esc_attr( $search_text ) );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<?php if ( Blocks::is_amp_request() ) : ?>
				<amp-iframe src="<?php echo esc_url( $giphy_url ); ?>" width="100" height="<?php echo absint( $padding_top ); ?>" sandbox="allow-scripts allow-same-origin" layout="responsive">
					<div placeholder>
						<?php echo wp_kses_post( $placeholder ); ?>
					</div>
				</amp-iframe>
			<?php else : ?>
				<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
					<iframe src="<?php echo esc_url( $giphy_url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
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
