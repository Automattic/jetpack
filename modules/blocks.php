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
register_block_type(
	'jetpack/map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Map block registration/dependency declaration.
 *
 * @param array $attr - Array containing the map block attributes.
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

	return preg_replace( '/<div /', '<div data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 );
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
	register_block_type(
		'jetpack/tiled-gallery',
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
register_block_type(
	'jetpack/gif',
	array(
		'render_callback' => 'jetpack_gif_block_render',
	)
);

/**
 * Gif block registration/dependency declaration.
 *
 * @param array $attr - Array containing the gif block attributes.
 *
 * @return string
 */
function jetpack_gif_block_render( $attr ) {
	$padding_top = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : 0;
	$style       = 'padding-top:' . $padding_top;
	$giphy_url   = isset( $attr['giphyUrl'] ) ? $attr['giphyUrl'] : null;
	$search_text = isset( $attr['searchText'] ) ? $attr['searchText'] : '';
	$caption     = isset( $attr['caption'] ) ? $attr['caption'] : null;

	if ( ! $giphy_url ) {
		return null;
	}

	/* TODO: replace with centralized block_class function */
	$align   = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$type    = 'gif';
	$classes = array(
		'wp-block-jetpack-' . $type,
		'align' . $align,
	);
	if ( isset( $attr['className'] ) ) {
		array_push( $classes, $attr['className'] );
	}
	$classes = implode( $classes, ' ' );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
				<iframe src="<?php echo esc_url( $giphy_url ); ?>"
						title="<?php echo esc_attr( $search_text ); ?>"></iframe>
			</div>
			<?php if ( $caption ) : ?>
				<figcaption
						class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
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
register_block_type(
	'jetpack/contact-info',
	array(
		'render_callback' => 'jetpack_contact_info_block_load_assets',
	)
);
register_block_type(
	'jetpack/email',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
register_block_type(
	'jetpack/address',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
register_block_type(
	'jetpack/phone',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);

/**
 * Contact info block registration/dependency declaration.
 *
 * @param array  $attr - Array containing the contact info block attributes.
 * @param string $content - String containing the contact info block content.
 *
 * @return string
 */
function jetpack_contact_info_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'contact-info' );
	return $content;
}

/**
 * VR Block.
 */
register_block_type( 'jetpack/vr' );

/**
 * Slideshow Block.
 */
register_block_type(
	'jetpack/slideshow',
	array(
		'render_callback' => 'jetpack_slideshow_block_load_assets',
	)
);

/**
 * Slideshow block registration/dependency declaration.
 *
 * @param array  $attr - Array containing the slideshow block attributes.
 * @param string $content - String containing the slideshow block content.
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

/**
 * Business Hours Block.
 */
register_block_type(
	'jetpack/business-hours',
	array( 'render_callback' => 'jetpack_business_hours_render' )
);

/**
 * Business Hours Block dynamic rending of the glock.
 *
 * @param array  $attributes Array containing the business hours block attributes.
 * @param string $content    String containing the business hours block content.
 *
 * @return string
 */
function jetpack_business_hours_render( $attributes, $content ) {
	global $wp_locale;

	if ( empty( $attributes['hours'] ) || ! is_array( $attributes['hours'] ) ) {
		return $content;
	}

	$start_of_week     = (int) get_option( 'start_of_week', 0 );
	$time_format       = get_option( 'time_format' );
	$today             = current_time( 'D' );
	$custom_class_name = isset( $attributes['className'] ) ? $attributes['className'] : '';
	$content           = sprintf(
		'<dl class="jetpack-business-hours %s">',
		! empty( $attributes['className'] ) ? esc_attr( $attributes['className'] ) : ''
	);

	$days = array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' );

	if ( $start_of_week ) {
		$chunk1              = array_slice( $attributes['hours'], 0, $start_of_week );
		$chunk2              = array_slice( $attributes['hours'], $start_of_week );
		$attributes['hours'] = array_merge( $chunk2, $chunk1 );
	}

	foreach ( $attributes['hours'] as $day => $hours ) {
		$opening = strtotime( $hours['opening'] );
		$closing = strtotime( $hours['closing'] );

		$content .= '<dt class="' . esc_attr( $day ) . '">' .
			ucfirst( $wp_locale->get_weekday( array_search( $day, $days ) ) ) .
			'</dt>';
		$content .= '<dd class="' . esc_attr( $day ) . '">';
		if ( $hours['opening'] && $hours['closing'] ) {
			$content .= sprintf(
				/* Translators: Business opening hours info. */
				_x( 'From %1$s to %2$s', 'from business opening hour to closing hour', 'jetpack' ),
				date( $time_format, $opening ),
				date( $time_format, $closing )
			);

			if ( $today === $day ) {
				$now = strtotime( current_time( 'H:i' ) );
				if ( $now < $opening ) {
					$content .= '<br />';
					$content .= esc_html( sprintf(
						/* Translators: Amount of time until business opens. */
						_x( 'Opening in %s', 'Amount of time until business opens', 'jetpack' ),
						human_time_diff( $now, $opening )
					) );
				} elseif ( $now >= $opening && $now < $closing ) {
					$content .= '<br />';
					$content .= esc_html( sprintf(
						/* Translators: Amount of time until business closes. */
						_x( 'Closing in %s', 'Amount of time until business closes', 'jetpack' ),
						human_time_diff( $now, $closing )
					) );
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

/**
 * Mailchimp Block.
 */
if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	register_block_type(
		'jetpack/mailchimp',
		array(
			'render_callback' => 'jetpack_mailchimp_block_load_assets',
		)
	);
}

/**
 * Mailchimp block registration/dependency declaration.
 *
 * @param array $attr - Array containing the map block attributes.
 *
 * @return string
 */
function jetpack_mailchimp_block_load_assets( $attr ) {
	$values  = array();
	$blog_id = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ?
		get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	Jetpack_Gutenberg::load_assets_as_required( 'mailchimp', null );
	$defaults = array(
		'title'            => esc_html__( 'Join my email list', 'jetpack' ),
		'emailPlaceholder' => esc_html__( 'Enter your email', 'jetpack' ),
		'submitLabel'      => esc_html__( 'Join my email list', 'jetpack' ),
		'consentText'      => esc_html__( 'By clicking submit, you agree to share your email address with the site owner and MailChimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
		'processingLabel'  => esc_html__( 'Processing…', 'jetpack' ),
		'successLabel'     => esc_html__( 'Success! You\'re on the list.', 'jetpack' ),
		'errorLabel'       => esc_html__( 'Whoops! There was an error and we couldn\'t process your subscription. Please reload the page and try again.', 'jetpack' ),
	);
	foreach ( $defaults as $id => $default ) {
		$values[ $id ] = isset( $attr[ $id ] ) ? $attr[ $id ] : $default;
	}

	/* TODO: replace with centralized block_class function */
	$align   = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$type    = 'mailchimp';
	$classes = array(
		'wp-block-jetpack-' . $type,
		'align' . $align,
	);
	if ( isset( $attr['className'] ) ) {
		array_push( $classes, $attr['className'] );
	}
	$classes = implode( $classes, ' ' );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>" data-blog-id="<?php echo esc_attr( $blog_id ); ?>">
		<div class="components-placeholder">
			<h3><?php echo esc_html( $values['title'] ); ?></h3>
			<form>
				<input
					type="text"
					class="components-text-control__input wp-block-jetpack-mailchimp-email"
					required
					placeholder="<?php echo esc_attr( $values['emailPlaceholder'] ); ?>"
				/>
				<button type="submit" class="components-button is-button is-primary">
					<?php echo esc_html( $values['submitLabel'] ); ?>
				</button>
				<figcaption>
					<?php echo esc_html( $values['consentText'] ); ?>
				</figcaption>
			</form>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-processing">
				<?php echo esc_html( $values['processingLabel'] ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-success">
				<?php echo esc_html( $values['successLabel'] ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-error">
				<?php echo esc_html( $values['errorLabel'] ); ?>
			</div>
		</div>
	</div>
	<?php
	$html = ob_get_clean();
	return $html;
}

/**
 * Visited Block
 */
jetpack_register_block( 
	'visited', 
	array(
		'render_callback' => 'jetpack_visited_block_render',
	)
);

/**
 * Visited block dependency declaration.
 *
 * @param array  $attributes - Array containing the map block attributes.
 * @param string $content - String containing the visited block content.
 *
 * @return string
 */
function jetpack_visited_block_render( $attributes, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'visited' );

	$count = intval( $_COOKIE[ 'wp-visit-tracking' ] );
	$criteria = isset( $attributes['criteria'] ) ? $attributes['criteria'] : 'after-visits';
	$threshold = isset( $attributes['threshold'] ) ? intval( $attributes['threshold'] ) : 3;

	if (
		( 'after-visits' === $criteria && $count >= $threshold ) ||
		( 'before-visits' === $criteria && $count <= $threshold )
	) {
		return $content;
	}
	// return an empty div so that view script increments the visit counter in the cookie
	return '<div class="wp-block-jetpack-visited"></div>';
}
