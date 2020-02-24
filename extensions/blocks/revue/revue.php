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

	$first_name_field = array_key_exists( 'firstNameField', $attributes ) ? $attributes['firstNameField'] : true;
	$last_name_field  = array_key_exists( 'lastNameField', $attributes ) ? $attributes['lastNameField'] : true;

	Jetpack_Gutenberg::load_assets_as_required( 'revue' );

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
		class="wp-block-jetpack-revue__form is-visible"
		method="post"
		name="revue-form"
		target="_blank"
	>
		<div>
			<label>
				<?php esc_html_e( 'Email address', 'jetpack' ); ?>
				<span class="required"><?php esc_html_e( '(required)', 'jetpack' ); ?></span>
				<input
					class="wp-block-jetpack-revue__email"
					name="member[email]"
					placeholder="<?php esc_attr_e( 'Your email address…', 'jetpack' ); ?>"
					required
					type="email"
				/>
			</label>
		</div>
		<?php if ( $first_name_field ) : ?>
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
			<?php
			endif;
		if ( $last_name_field ) :
			?>
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
			endif;
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo jetpack_get_revue_button( $attributes );
		?>
	</form>
	<div class="wp-block-jetpack-revue__message">
		<p>
			<strong><?php esc_html_e( 'Subscription received!', 'jetpack' ); ?></strong>
		</p>
		<p>
			<?php esc_html_e( 'Please check your email to confirm your newsletter subscription.', 'jetpack' ); ?>
		</p>
	</div>
</div>

	<?php
	return ob_get_clean();
}

/**
 * Create the Revue subscribe button.
 *
 * @see https://github.com/WordPress/gutenberg/blob/015555fcdf648b13af57e08cee60bf3f3501ff63/packages/block-library/src/navigation/index.php
 *
 * @param array $attributes Array containing the Revue block attributes.
 *
 * @return string
 */
function jetpack_get_revue_button( $attributes ) {
	$classes = array( 'wp-block-button__link' );
	$styles  = array();

	$has_text                    = array_key_exists( 'text', $attributes );
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
