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
	$padding_top      = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : '56.2%';
	$style            = 'padding-top:' . esc_attr( $padding_top );
	$gif_url          = isset( $attr['gifUrl'] ) ? esc_url( $attr['gifUrl'] ) : null;
	$giphy_url        = isset( $attr['giphyUrl'] ) ? esc_url( $attr['giphyUrl'] ) : null;
	$search_text      = isset( $attr['searchText'] ) ? esc_attr( $attr['searchText'] ) : '';
	$caption          = isset( $attr['caption'] ) ? wp_kses_post( $attr['caption'] ) : null;
	$attribution_url  = isset( $attr['attributionUrl'] ) ? esc_url( $attr['attributionUrl'] ) : null;
	$attribution_name = isset( $attr['attributionName'] ) ? esc_html( $attr['attributionName'] ) : '';

	if ( ! $gif_url && ! $giphy_url ) {
		return null;
	}

	$classes     = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr );
	$placeholder = sprintf( '<a href="%s">%s</a>', esc_url( $giphy_url ), esc_attr( $search_text ) );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<?php if ( $giphy_url ) : ?>
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
			<?php else : ?>
				<img src="<?php echo esc_url( $gif_url ); ?>" alt="<?php echo esc_attr( $search_text ); ?>" />
			<?php endif; ?>
			<?php if ( $caption ) : ?>
				<figcaption class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
			<?php endif; ?>
			<?php if ( $attribution_url && $attribution_name && $gif_url ) : ?>
				<figcaption class="wp-block-jetpack-gif-attribution">
					<a href="<?php echo esc_url( $attribution_url ); ?>" target="_blank" rel="noopener noreferrer">
						<?php
						/* translators: %s: attribution name */
						printf( esc_html__( 'GIF by %s on Tumblr', 'jetpack' ), esc_html( $attribution_name ) );
						?>
					</a>
				</figcaption>
			<?php endif; ?>
		</figure>
	</div>
	<?php
	$html = ob_get_clean();

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $html;
}
