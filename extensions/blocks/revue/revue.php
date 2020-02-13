<?php
/**
 * Revue Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/revue',
	array(
		'render_callback' => 'jetpack_render_revue_block',
	)
);

/**
 * Revue block render callback.
 *
 * @param array $attributes Array containing the Revue block attributes.
 *
 * @return string
 */
function jetpack_render_revue_block( $attributes ) {
	if ( ! array_key_exists( 'revueUsername', $attributes ) ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( 'revue' );

	wp_localize_script(
		'jetpack-block-revue',
		'jetpackRevueBlock',
		array(
			'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
			'nonce'         => wp_create_nonce( 'jetpack-revue-subscribe' ),
			'revueUsername' => $attributes['revueUsername'],
		)
	);

	ob_start();
	?>

<div class="wp-block-jetpack-revue">
	<form
		action="
		<?php
		echo esc_url(
			sprintf( 'https://www.getrevue.co/profile/%s/add_subscriber', $attributes['revueUsername'] )
		);
		?>
		"
		method="post"
		name="revue-form"
		target="_blank"
	>
		<div>
			<label>
				<?php esc_html_e( 'Email address', 'jetpack' ); ?>
				<span class="required">*</span>
				<input
					class="wp-block-jetpack-revue__email"
					name="member[email]"
					placeholder="<?php esc_attr_e( 'Your email address…', 'jetpack' ); ?>"
					required
					type="email"
				/>
			</label>
		</div>
		<div>
			<label>
				<?php esc_html_e( 'First name', 'jetpack' ); ?>
				<input
					class="wp-block-jetpack-revue__first-name"
					name="member[first_name]"
					placeholder="<?php esc_attr_e( 'First name… (Optional)', 'jetpack' ); ?>"
					type="text"
				/>
			</label>
		</div>
		<div>
			<label>
				<?php esc_html_e( 'Last name', 'jetpack' ); ?>
				<input
					class="wp-block-jetpack-revue__last-name"
					name="member[last_name]"
					placeholder="<?php esc_attr_e( 'Last name… (Optional)', 'jetpack' ); ?>"
					type="text"
				/>
			</label>
		</div>
		<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo jetpack_get_revue_button( $attributes );
		?>
	</form>
</div>

	<?php
	return ob_get_clean();
}

/**
 * Create the Revue subscribe button.
 *
 * @param array $attributes Array containing the Revue block attributes.
 *
 * @return string
 */
function jetpack_get_revue_button( $attributes ) {
	$classes = array( 'wp-block-button__link' );
	$styles  = array();

	$has_text                    = array_key_exists( 'className', $attributes );
	$has_class_name              = array_key_exists( 'className', $attributes );
	$has_named_text_color        = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color       = array_key_exists( 'customTextColor', $attributes );
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );
	$has_named_gradient          = array_key_exists( 'gradient', $attributes );
	$has_custom_gradient         = array_key_exists( 'customGradient', $attributes );
	$has_border_radius           = array_key_exists( 'borderRadius', $attributes );

	if ( $has_class_name ) {
		$classes[] = $attributes['className'];
	}

	if ( $has_named_text_color || $has_custom_text_color ) {
		$classes[] = 'has-text-color';
	}
	if ( $has_named_text_color ) {
		$classes[] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		$styles[] = sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	if (
		$has_named_background_color ||
		$has_custom_background_color ||
		$has_named_gradient ||
		$has_custom_gradient
	) {
		$classes[] = 'has-background';
	}
	if ( $has_named_background_color && ! $has_custom_gradient ) {
		$classes[] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	}
	if ( $has_named_gradient ) {
		$classes[] = sprintf( 'has-%s-gradient-background', $attributes['gradient'] );
	} elseif ( $has_custom_gradient ) {
		$styles[] = sprintf( 'background: %s;', $attributes['customGradient'] );
	}
	if (
		$has_custom_background_color &&
		! $has_named_background_color &&
		! $has_named_gradient &&
		! $has_custom_gradient
	) {
		$styles[] = sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	if ( $has_border_radius ) {
		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( 0 == $attributes['borderRadius'] ) {
			$classes[] = 'no-border-radius';
		} else {
			$styles[] = sprintf( 'border-radius: %spx;', $attributes['borderRadius'] );
		}
	}

	ob_start();
	?>

<div class="wp-block-button">
	<button
		class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"
		name="member[subscribe]"
		style="<?php echo esc_attr( implode( ' ', $styles ) ); ?>"
		type="submit"
	>
		<?php echo $has_text ? esc_html( $attributes['text'] ) : esc_html__( 'Subscribe', 'jetpack' ); ?>
	</button>
</div>

	<?php
	return ob_get_clean();
}

add_action( 'wp_ajax_jetpack_revue_subscribe', 'jetpack_ajax_revue_subscribe' );
add_action( 'wp_ajax_nopriv_jetpack_revue_subscribe', 'jetpack_ajax_revue_subscribe' );

/**
 * Revue subscription AJAX callback.
 */
function jetpack_ajax_revue_subscribe() {
	check_ajax_referer( 'jetpack-revue-subscribe' );

	if ( empty( $_POST['revueUsername'] ) ) {
		wp_send_json(
			array(
				'status'  => 'error',
				'message' => __( 'Unexpected error, try again!', 'jetpack' ),
			)
		);
		wp_die();
	}
	if ( empty( $_POST['member'] ) || empty( $_POST['member']['email'] ) ) {
		wp_send_json(
			array(
				'status'  => 'error',
				'message' => __( 'We really need the email address!', 'jetpack' ),
			)
		);
		wp_die();
	}

	wp_remote_post(
		sprintf( 'https://www.getrevue.co/profile/%s/add_subscriber', $_POST['revueUsername'] ),
		array( 'body' => array( 'member' => $_POST['member'] ) )
	);

	wp_send_json(
		array(
			'status' => 'success',
		)
	);
	wp_die();
}
