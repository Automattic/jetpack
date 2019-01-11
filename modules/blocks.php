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

/**
 * Mailchimp Block.
 */
jetpack_register_block(
	'mailchimp',
	array(
		'render_callback' => 'jetpack_mailchimp_block_load_assets',
	)
);

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
		'submitLabel'      => esc_html__( 'Join My Email List', 'jetpack' ),
		'consentText'      => esc_html__( 'By clicking submit, you agree to share your email address with the site owner and MailChimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
		'processingLabel'  => esc_html__( 'Processing...', 'jetpack' ),
		'successLabel'     => esc_html__( 'Success! You\'ve been added to the list.', 'jetpack' ),
		'errorLabel'       => esc_html__( 'Oh no! Unfortunately there was an error. Please try reloading this page and adding your email once more.', 'jetpack' ),
	);
	foreach ( $defaults as $id => $default ) {
		$values[ $id ] = isset( $attr[ $id ] ) ? $attr[ $id ] : $default;
	}
	ob_start();
	?>
	<div class="wp-block-jetpack-mailchimp" data-blog-id="<?php echo( esc_attr( $blog_id ) ); ?>">
		<div class="components-placeholder">
			<h3><?php echo( esc_html( $values['title'] ) ); ?></h3>
			<form>
				<input
					type="text"
					class="components-text-control__input wp-block-jetpack-mailchimp-email"
					required
					placeholder="<?php echo( esc_attr( $values['emailPlaceholder'] ) ); ?>"
				/>
				<button type="submit" class="components-button is-button is-primary">
					<?php echo( esc_html( $values['submitLabel'] ) ); ?>
				</button>
				<figcaption>
					<?php echo( esc_html( $values['consentText'] ) ); ?>
				</figcaption>
			</form>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-processing">
				<?php echo( esc_html( $values['processingLabel'] ) ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-success">
				<?php echo( esc_html( $values['successLabel'] ) ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp-notification wp-block-jetpack-mailchimp-error">
				<?php echo( esc_html( $values['errorLabel'] ) ); ?>
			</div>
		</div>
	</div>
	<?php
	$html = ob_get_clean();
	return $html;
}
