<?php
/**
 * Mailchimp Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
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
