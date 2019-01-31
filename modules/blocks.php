<?php
/**
 * Load code specific to Gutenberg blocks which are not tied to a module.
 * This file is unusual, and is not an actual `module` as such.
 * It is included in ./module-extras.php
 */

/**
 * Map block.
 *
 * @since 6.8.0
 */
jetpack_register_block(
	'map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr - Array containing the map block attributes.
 * @param string $content - String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$dependencies = array(
		'lodash',
		'wp-element',
		'wp-i18n',
	);

	$api_key = Jetpack_Options::get_option( 'mapbox_api_key' );

	Jetpack_Gutenberg::load_assets_as_required( 'map', $dependencies );
	return preg_replace( '/<div /', '<div data-api-key="'. esc_attr( $api_key ) .'" ', $content, 1 );
}


/**
 * Tiled Gallery block. Depends on the Photon module.
 *
 * @since 6.9.0
*/
if (
	( defined( 'IS_WPCOM' ) && IS_WPCOM ) ||
	class_exists( 'Jetpack_Photon' ) && Jetpack::is_module_active( 'photon' )
) {
	jetpack_register_block(
		'tiled-gallery',
		array(
			'render_callback' => 'jetpack_tiled_gallery_load_block_assets',
		)
	);

	/**
	 * Tiled gallery block registration/dependency declaration.
	 *
	 * @param array $attr - Array containing the block attributes.
	 * @param string $content - String containing the block content.
	 *
	 * @return string
	 */
	function jetpack_tiled_gallery_load_block_assets( $attr, $content ) {
		$dependencies = array(
			'lodash',
			'wp-i18n',
			'wp-token-list',
		);
		Jetpack_Gutenberg::load_assets_as_required( 'tiled-gallery', $dependencies );

		/**
		 * Filter the output of the Tiled Galleries content.
		 *
		 * @module tiled-gallery
		 *
		 * @since 6.9.0
		 *
		 * @param string $content Tiled Gallery block content.
		 */
		return apply_filters( 'jetpack_tiled_galleries_block_content', $content );
	}
}

/**
 * GIF Block.
 *
 * @since 7.0.0
 */
jetpack_register_block(
	'gif',
	array(
		'render_callback' => 'jetpack_gif_block_render',
	)
);

/**
 * Gif block registration/dependency declaration.
 *
 * @param array $attr - Array containing the map block attributes.
 *
 * @return string
 */
function jetpack_gif_block_render( $attr ) {
	$align       = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$padding_top = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : 0;
	$style       = 'padding-top:' . $padding_top;
	$giphy_url   = isset( $attr['giphyUrl'] ) ? $attr['giphyUrl'] : null;
	$search_text = isset( $attr['searchText'] ) ? $attr['searchText'] : '';
	$caption     = isset( $attr['caption'] ) ? $attr['caption'] : null;

	if ( ! $giphy_url ) {
		return null;
	}

	$classes = array(
		'wp-block-jetpack-gif',
		'align' . $align,
	);
	if ( isset( $attr['className'] ) ) {
		array_push( $classes, $attr['className'] );
	}

	ob_start();
	?>
	<div class="<?php echo esc_attr( implode( $classes, ' ' ) ); ?>">
		<figure>
			<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
				<iframe src="<?php echo esc_url( $giphy_url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
			</div>
			<?php if ( $caption ) : ?>
				<figcaption class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
			<?php endif; ?>
		</figure>
	</div>
	<?php
	$html = ob_get_clean();

	Jetpack_Gutenberg::load_assets_as_required( 'gif' );
	return $html;
}

/**
 * Contact Info block and its child blocks.
 */
jetpack_register_block( 'contact-info' );
jetpack_register_block(
	'email',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block(
	'address',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block(
	'phone',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);

/**
 * VR Block.
 */
jetpack_register_block( 'vr' );

/**
 * Slideshow Block.
 */
jetpack_register_block(
	'slideshow',
	array(
		'render_callback' => 'jetpack_slideshow_block_load_assets',
	)
);

/**
 * Slideshow block registration/dependency declaration.
 *
 * @param array  $attr - Array containing the map block attributes.
 * @param string $content - String containing the map block content.
 *
 * @return string
 */
function jetpack_slideshow_block_load_assets( $attr, $content ) {
	$dependencies = array(
		'lodash',
		'wp-element',
		'wp-i18n',
	);
	Jetpack_Gutenberg::load_assets_as_required( 'slideshow', $dependencies );
	return $content;
}

jetpack_register_block(
	'business-hours',
	array( 'render_callback' => 'jetpack_business_hours_render' )
);

function jetpack_business_hours_render( $attributes, $content ) {
	global $wp_locale;

	if ( empty( $attributes['hours'] ) || ! is_array( $attributes['hours'] ) ) {
		return $content;
	}

	$start_of_week = (int) get_option( 'start_of_week', 0 );
	$time_format = get_option( 'time_format' );
	$today = current_time( 'D' );
	$content = '<dl class="business-hours built-by-php">';

	$days = array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' );

	if ( $start_of_week ) {
		$chunk1 = array_slice( $attributes['hours'], 0, $start_of_week );
		$chunk2 = array_slice( $attributes['hours'], $start_of_week );
		$attributes['hours'] = array_merge( $chunk2, $chunk1 );
	}

	foreach ( $attributes['hours'] as $day => $hours ) {
		$opening = strtotime( $hours['opening'] );
		$closing = strtotime( $hours['closing'] );

		$content .= '<dt class="' . esc_attr( $day ) . '">' . $wp_locale->get_weekday( array_search( $day, $days ) ) . '</dt>';
		$content .= '<dd class="' . esc_attr( $day ) . '">';
		if ( $hours['opening'] && $hours['closing'] ) {
			$content .= date( $time_format, $opening );
			$content .= '&nbsp;&mdash;&nbsp;';
			$content .= date( $time_format, $closing );

			if ( $today === $day ) {
				$now = strtotime( current_time( 'H:i' ) );
				if ( $now < $opening ) {
					$content .= '<br />';
					$content .= esc_html( sprintf( __( 'Opening in %s', 'jetpack' ), human_time_diff( $now, $opening ) ) );
				} elseif ( $now >= $opening && $now < $closing ) {
					$content .= '<br />';
					$content .= esc_html( sprintf( __( 'Closing in %s', 'jetpack' ), human_time_diff( $now, $closing ) ) );
				}
			}
		} else {
			$content .= esc_html__( 'CLOSED', 'jetpack' );
		}
		$content .= '</dd>';
	}

	$content .= '</dl>';

	return $content;
}
