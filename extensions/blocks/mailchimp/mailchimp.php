<?php
/**
 * Mailchimp Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	jetpack_register_block(
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

	if ( ! jetpack_mailchimp_verify_connection() ) {
		return null;
	}
	$values  = array();
	$blog_id = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
		? get_current_blog_id()
		: Jetpack_Options::get_option( 'id' );
	Jetpack_Gutenberg::load_assets_as_required( 'mailchimp' );
	$defaults = array(
		'emailPlaceholder' => esc_html__( 'Enter your email', 'jetpack' ),
		'submitButtonText' => esc_html__( 'Join my email list', 'jetpack' ),
		'consentText'      => esc_html__( 'By clicking submit, you agree to share your email address with the site owner and Mailchimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
		'processingLabel'  => esc_html__( 'Processing…', 'jetpack' ),
		'successLabel'     => esc_html__( 'Success! You\'re on the list.', 'jetpack' ),
		'errorLabel'       => esc_html__( 'Whoops! There was an error and we couldn\'t process your subscription. Please reload the page and try again.', 'jetpack' ),
	);
	foreach ( $defaults as $id => $default ) {
		$values[ $id ] = isset( $attr[ $id ] ) ? $attr[ $id ] : $default;
	}

	$values['submitButtonText'] = empty( $values['submitButtonText'] ) ? $defaults['submitButtonText'] : $values['submitButtonText'];

	$classes = Jetpack_Gutenberg::block_classes( 'mailchimp', $attr );

	$button_styles = array();
	if ( ! empty( $attr['customBackgroundButtonColor'] ) ) {
		array_push(
			$button_styles,
			sprintf(
				'background-color: %s',
				sanitize_hex_color( $attr['customBackgroundButtonColor'] )
			)
		);
	}
	if ( ! empty( $attr['customTextButtonColor'] ) ) {
		array_push(
			$button_styles,
			sprintf(
				'color: %s',
				sanitize_hex_color( $attr['customTextButtonColor'] )
			)
		);
	}
	$button_styles = implode( ';', $button_styles );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>" data-blog-id="<?php echo esc_attr( $blog_id ); ?>">
		<div class="components-placeholder">
			<form aria-describedby="wp-block-jetpack-mailchimp_consent-text">
				<p>
					<input
						aria-label="<?php echo esc_attr( $values['emailPlaceholder'] ); ?>"
						placeholder="<?php echo esc_attr( $values['emailPlaceholder'] ); ?>"
						required
						title="<?php echo esc_attr( $values['emailPlaceholder'] ); ?>"
						type="email"
					/>
				</p>
				<p>
					<button type="submit" class="components-button is-button is-primary" style="<?php echo esc_attr( $button_styles ); ?>">
						<?php echo wp_kses_post( $values['submitButtonText'] ); ?>
					</button>
				</p>
				<p id="wp-block-jetpack-mailchimp_consent-text" name="wp-block-jetpack-mailchimp_consent-text">
					<?php echo wp_kses_post( $values['consentText'] ); ?>
				</p>
			</form>
			<div class="wp-block-jetpack-mailchimp_notification wp-block-jetpack-mailchimp_processing" role="status">
				<?php echo esc_html( $values['processingLabel'] ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp_notification wp-block-jetpack-mailchimp_success" role="status">
				<?php echo esc_html( $values['successLabel'] ); ?>
			</div>
			<div class="wp-block-jetpack-mailchimp_notification wp-block-jetpack-mailchimp_error" role="alert">
				<?php echo esc_html( $values['errorLabel'] ); ?>
			</div>
		</div>
	</div>
	<?php
	$html = ob_get_clean();
	return $html;
}

/**
 * Mailchimp connection/list selection verification.
 *
 * @return boolean
 */
function jetpack_mailchimp_verify_connection() {
	$option = get_option( 'jetpack_mailchimp' );
	if ( ! $option ) {
		return false;
	}
	$data = json_decode( $option, true );
	if ( ! $data ) {
		return false;
	}
	return isset( $data['follower_list_id'], $data['keyring_id'] );
}
