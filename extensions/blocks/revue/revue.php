<?php
/**
 * Revue Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Revue;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'revue';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Revue block render callback.
 *
 * @param array  $attributes Array containing the Revue block attributes.
 * @param string $content    The Revue block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if ( ! array_key_exists( 'revueUsername', $attributes ) ) {
		return '';
	}

	$email_label            = get_revue_attribute( 'emailLabel', $attributes );
	$email_placeholder      = get_revue_attribute( 'emailPlaceholder', $attributes );
	$first_name_label       = get_revue_attribute( 'firstNameLabel', $attributes );
	$first_name_placeholder = get_revue_attribute( 'firstNamePlaceholder', $attributes );
	$first_name_show        = get_revue_attribute( 'firstNameShow', $attributes );
	$last_name_label        = get_revue_attribute( 'lastNameLabel', $attributes );
	$last_name_placeholder  = get_revue_attribute( 'lastNamePlaceholder', $attributes );
	$last_name_show         = get_revue_attribute( 'lastNameShow', $attributes );
	$url                    = sprintf( 'https://www.getrevue.co/profile/%s/add_subscriber', $attributes['revueUsername'] );
	$base_class             = Blocks::classes( FEATURE_NAME, array() ) . '__';
	$classes                = Blocks::classes( FEATURE_NAME, $attributes );

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	ob_start();
	?>

<div class="<?php echo esc_attr( $classes ); ?>">
	<form
		action="<?php echo esc_url( $url ); ?>"
		class="<?php echo esc_attr( $base_class . 'form is-visible' ); ?>"
		method="post"
		name="revue-form"
		target="_blank"
	>
		<div>
			<label>
				<?php echo esc_html( $email_label ); ?>
				<span class="required"><?php esc_html_e( '(required)', 'jetpack' ); ?></span>
				<input
					class="<?php echo esc_attr( $base_class . 'email' ); ?>"
					name="member[email]"
					placeholder="<?php echo esc_attr( $email_placeholder ); ?>"
					required
					type="email"
				/>
			</label>
		</div>
		<?php if ( $first_name_show ) : ?>
			<div>
				<label>
					<?php echo esc_html( $first_name_label ); ?>
					<input
						class="<?php echo esc_attr( $base_class . 'first-name' ); ?>"
						name="member[first_name]"
						placeholder="<?php echo esc_attr( $first_name_placeholder ); ?>"
						type="text"
					/>
				</label>
			</div>
			<?php
			endif;
		if ( $last_name_show ) :
			?>
			<div>
				<label>
					<?php echo esc_html( $last_name_label ); ?>
					<input
						class="<?php echo esc_attr( $base_class . 'last-name' ); ?>"
						name="member[last_name]"
						placeholder="<?php echo esc_attr( $last_name_placeholder ); ?>"
						type="text"
					/>
				</label>
			</div>
			<?php
		endif;

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		if ( false !== strpos( $content, 'wp-block-jetpack-revue__fallback' ) ) {
			echo $content;
		} else {
			echo get_deprecated_v1_revue_button( $attributes );
		}
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
		?>
	</form>
	<div class="<?php echo esc_attr( $base_class . 'message' ); ?>">
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
 * Get Revue block attribute.
 *
 * @param string $attribute  String containing the attribute name to get.
 * @param array  $attributes Array containing the Revue block attributes.
 *
 * @return mixed
 */
function get_revue_attribute( $attribute, $attributes ) {
	if ( array_key_exists( $attribute, $attributes ) ) {
		return $attributes[ $attribute ];
	}

	$default_attributes = array(
		'text'                 => __( 'Subscribe', 'jetpack' ),
		'emailLabel'           => __( 'Email address', 'jetpack' ),
		'emailPlaceholder'     => __( 'Enter your email address', 'jetpack' ),
		'firstNameLabel'       => __( 'First name', 'jetpack' ),
		'firstNamePlaceholder' => __( 'Enter your first name', 'jetpack' ),
		'firstNameShow'        => true,
		'lastNameLabel'        => __( 'Last name', 'jetpack' ),
		'lastNamePlaceholder'  => __( 'Enter your last name', 'jetpack' ),
		'lastNameShow'         => true,
	);

	if ( array_key_exists( $attribute, $default_attributes ) ) {
		return $default_attributes[ $attribute ];
	}
}

/**
 * DEPRECATED V1
 */

/**
 * Create the Revue subscribe button.
 *
 * @param array $attributes Array containing the Revue block attributes.
 *
 * @return string
 */
function get_deprecated_v1_revue_button( $attributes ) {
	$classes = array( 'wp-block-button__link' );
	$styles  = array();

	$text                        = get_revue_attribute( 'text', $attributes );
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
		<?php echo wp_kses_post( $text ); ?>
	</button>
</div>

	<?php
	return ob_get_clean();
}
