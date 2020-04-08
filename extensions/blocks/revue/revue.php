<?php
/**
 * Revue Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Revue;

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
	$base_class             = Jetpack_Gutenberg::block_classes( FEATURE_NAME, array() ) . '__';
	$classes                = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );

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
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $content;
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
