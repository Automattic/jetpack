<?php
/**
 * Subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status;
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Subscriptions_Widget;

const FEATURE_NAME = 'subscriptions';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * These block defaults should match ./constants.js
 */
const DEFAULT_BORDER_RADIUS_VALUE = 0;
const DEFAULT_BORDER_WEIGHT_VALUE = 1;
const DEFAULT_FONTSIZE_VALUE      = '16px';
const DEFAULT_PADDING_VALUE       = 15;
const DEFAULT_SPACING_VALUE       = 10;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( defined( 'IS_WPCOM' ) && IS_WPCOM )
		|| ( Jetpack::is_connection_ready() && Jetpack::is_module_active( 'subscriptions' ) && ! ( new Status() )->is_offline_mode() )
	) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
				'supports'        => array(
					'spacing' => array(
						'margin'  => true,
						'padding' => true,
					),
					'align'   => array( 'wide', 'full' ),
				),
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block', 9 );

/**
 * Returns true when in a WP.com environment.
 *
 * @return boolean
 */
function is_wpcom() {
	return defined( 'IS_WPCOM' ) && IS_WPCOM;
}

/**
 * Determine the amount of folks currently subscribed to the blog, splitted out in email_subscribers & social_followers
 *
 * @return array containing ['value' => ['email_subscribers' => 0, 'social_followers' => 0]]
 */
function fetch_subscriber_counts() {
	$subs_count = 0;
	if ( is_wpcom() ) {
		$subs_count = array(
			'value' => array(
				'email_subscribers' => \wpcom_subs_total_for_blog(),
				'social_followers'  => \wpcom_social_followers_total_for_blog(),
			),
		);
	} else {
		$cache_key  = 'wpcom_subscribers_totals';
		$subs_count = get_transient( $cache_key );
		if ( false === $subs_count || 'failed' === $subs_count['status'] ) {
			$xml = new \Jetpack_IXR_Client();
			$xml->query( 'jetpack.fetchSubscriberCounts' );

			if ( $xml->isError() ) { // If we get an error from .com, set the status to failed so that we will try again next time the data is requested.
				$subs_count = array(
					'status'  => 'failed',
					'code'    => $xml->getErrorCode(),
					'message' => $xml->getErrorMessage(),
					'value'   => ( isset( $subs_count['value'] ) ) ? $subs_count['value'] : array(
						'email_subscribers' => 0,
						'social_followers'  => 0,
					),
				);
			} else {
				$subs_count = array(
					'status' => 'success',
					'value'  => $xml->getResponse(),
				);
			}
			set_transient( $cache_key, $subs_count, 3600 ); // Try to cache the result for at least 1 hour.
		}
	}
	return $subs_count;
}

/**
 * Returns subscriber count based on include_social_followers attribute
 *
 * @param bool $include_social_followers Whether to include social followers in the count.
 * @return int
 */
function get_subscriber_count( $include_social_followers ) {
	$counts = fetch_subscriber_counts();

	if ( $include_social_followers ) {
		$subscriber_count = $counts['value']['email_subscribers'] + $counts['value']['social_followers'];
	} else {
		$subscriber_count = $counts['value']['email_subscribers'];
	}
	return $subscriber_count;
}

/**
 * Returns true if the block attributes contain a value for the given key.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $key        Block attribute key.
 *
 * @return boolean
 */
function has_attribute( $attributes, $key ) {
	return isset( $attributes[ $key ] ) && $attributes[ $key ] !== 'undefined';
}

/**
 * Returns the value for the given attribute key, with the option of providing a default fallback value.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $key        Block attribute key.
 * @param mixed  $default    Optional fallback value in case the key doesn't exist.
 *
 * @return mixed
 */
function get_attribute( $attributes, $key, $default = null ) {
	return has_attribute( $attributes, $key ) ? $attributes[ $key ] : $default;
}

/**
 * Mimics getColorClassName, getFontSizeClass and getGradientClass from @wordpress/block-editor js package.
 *
 * @param string $setting Setting name.
 * @param string $value   Setting value.
 *
 * @return string
 */
function get_setting_class_name( $setting, $value ) {
	if ( ! $setting || ! $value ) {
		return '';
	}

	return sprintf( 'has-%s-%s', $value, $setting );
}

/**
 * Uses block attributes to generate an array containing the classes for various block elements.
 * Based on Jetpack_Subscriptions_Widget::do_subscription_form() which the block was originally using.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return array
 */
function get_element_class_names_from_attributes( $attributes ) {
	$text_color_class = get_setting_class_name( 'color', get_attribute( $attributes, 'textColor' ) );
	$font_size_class  = get_setting_class_name( 'font-size', get_attribute( $attributes, 'fontSize' ) );
	$border_class     = get_setting_class_name( 'border-color', get_attribute( $attributes, 'borderColor' ) );

	$button_background_class = get_setting_class_name( 'background-color', get_attribute( $attributes, 'buttonBackgroundColor' ) );
	$button_gradient_class   = get_setting_class_name( 'gradient-background', get_attribute( $attributes, 'buttonGradient' ) );

	$email_field_background_class = get_setting_class_name( 'background-color', get_attribute( $attributes, 'emailFieldBackgroundColor' ) );
	$email_field_gradient_class   = get_setting_class_name( 'gradient-background', get_attribute( $attributes, 'emailFieldGradient' ) );

	$submit_button_classes = array_filter(
		array(
			'wp-block-button__link'  => true,
			'no-border-radius'       => 0 === get_attribute( $attributes, 'borderRadius', 0 ),
			$font_size_class         => true,
			$border_class            => true,
			'has-text-color'         => ! empty( $text_color_class ),
			$text_color_class        => true,
			'has-background'         => ! empty( $button_background_class ) || ! empty( $button_gradient_class ),
			$button_background_class => ! empty( $button_background_class ),
			$button_gradient_class   => ! empty( $button_gradient_class ),
		)
	);

	$email_field_classes = array_filter(
		array(
			'no-border-radius'            => 0 === get_attribute( $attributes, 'borderRadius', 0 ),
			$font_size_class              => true,
			$border_class                 => true,
			$email_field_background_class => true,
			$email_field_gradient_class   => true,
		)
	);

	$block_wrapper_classes = array_filter(
		array(
			'wp-block-jetpack-subscriptions__supports-newline' => true,
			'wp-block-jetpack-subscriptions__use-newline' => (bool) get_attribute( $attributes, 'buttonOnNewLine' ),
			'wp-block-jetpack-subscriptions__show-subs'   => (bool) get_attribute( $attributes, 'showSubscribersTotal' ),
		)
	);

	return array(
		'block_wrapper' => join( ' ', array_keys( $block_wrapper_classes ) ),
		'email_field'   => join( ' ', array_keys( $email_field_classes ) ),
		'submit_button' => join( ' ', array_keys( $submit_button_classes ) ),
	);
}

/**
 * Uses block attributes to generate an array containing the styles for various block elements.
 * Based on Jetpack_Subscriptions_Widget::do_subscription_form() which the block was originally using.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return array
 */
function get_element_styles_from_attributes( $attributes ) {
	$button_background_style = ! has_attribute( $attributes, 'buttonBackgroundColor' ) && has_attribute( $attributes, 'customButtonGradient' )
		? get_attribute( $attributes, 'customButtonGradient' )
		: get_attribute( $attributes, 'customButtonBackgroundColor' );

	$email_field_styles           = '';
	$submit_button_wrapper_styles = '';
	$submit_button_styles         = '';

	if ( ! empty( $button_background_style ) ) {
		$submit_button_styles .= sprintf( 'background: %s;', $button_background_style );
	}

	if ( has_attribute( $attributes, 'customTextColor' ) ) {
		$submit_button_styles .= sprintf( 'color: %s;', get_attribute( $attributes, 'customTextColor' ) );
	}

	if ( has_attribute( $attributes, 'buttonWidth' ) ) {
		$submit_button_wrapper_styles .= sprintf( 'width: %s;', get_attribute( $attributes, 'buttonWidth' ) );
		$submit_button_wrapper_styles .= 'max-width: 100%;';

		// Account for custom margins on inline forms.
		$submit_button_styles .= true === get_attribute( $attributes, 'buttonOnNewLine' )
			? sprintf( 'width: calc(100% - %spx;', get_attribute( $attributes, 'spacing', DEFAULT_SPACING_VALUE ) )
			: 'width: 100%;';
	}

	$font_size = get_attribute( $attributes, 'customFontSize', DEFAULT_FONTSIZE_VALUE );
	$style     = sprintf( 'font-size: %s%s;', $font_size, is_numeric( $font_size ) ? 'px' : '' );

	$submit_button_styles .= $style;
	$email_field_styles   .= $style;

	$padding = get_attribute( $attributes, 'padding', DEFAULT_PADDING_VALUE );
	$style   = sprintf( 'padding: %1$dpx %2$dpx %1$dpx %2$dpx;', $padding, round( $padding * 1.5 ) );

	$submit_button_styles .= $style;
	$email_field_styles   .= $style;

	$button_spacing = get_attribute( $attributes, 'spacing', DEFAULT_SPACING_VALUE );
	if ( true === get_attribute( $attributes, 'buttonOnNewLine' ) ) {
		$submit_button_styles .= sprintf( 'margin-top: %dpx;', $button_spacing );
	} else {
		$submit_button_styles .= 'margin: 0px; '; // Reset Safari's 2px default margin for buttons affecting input and button union
		$submit_button_styles .= sprintf( 'margin-left: %dpx;', $button_spacing );
	}

	if ( has_attribute( $attributes, 'borderColor' ) ) {
		$style                 = sprintf( 'border-color: %s;', get_attribute( $attributes, 'borderColor', '' ) );
		$submit_button_styles .= $style;
		$email_field_styles   .= $style;
	}

	$style                 = sprintf( 'border-radius: %dpx;', get_attribute( $attributes, 'borderRadius', DEFAULT_BORDER_RADIUS_VALUE ) );
	$submit_button_styles .= $style;
	$email_field_styles   .= $style;

	$style                 = sprintf( 'border-width: %dpx;', get_attribute( $attributes, 'borderWeight', DEFAULT_BORDER_WEIGHT_VALUE ) );
	$submit_button_styles .= $style;
	$email_field_styles   .= $style;

	if ( has_attribute( $attributes, 'customBorderColor' ) ) {
		$style = sprintf( 'border-color: %s; border-style: solid;', get_attribute( $attributes, 'customBorderColor' ) );

		$submit_button_styles .= $style;
		$email_field_styles   .= $style;
	}

	return array(
		'email_field'           => $email_field_styles,
		'submit_button'         => $submit_button_styles,
		'submit_button_wrapper' => $submit_button_wrapper_styles,
	);
}

/**
 * Subscriptions block render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );

	$subscribe_email = '';

	/** This filter is documented in modules/contact-form/grunion-contact-form.php */
	if ( is_wpcom() || false !== apply_filters( 'jetpack_auto_fill_logged_in_user', false ) ) {
		$current_user    = wp_get_current_user();
		$subscribe_email = ! empty( $current_user->user_email ) ? $current_user->user_email : '';
	}

	// The block is using the Jetpack_Subscriptions_Widget backend, hence the need to increase the instance count.
	Jetpack_Subscriptions_Widget::$instance_count++;

	$classes                  = get_element_class_names_from_attributes( $attributes );
	$styles                   = get_element_styles_from_attributes( $attributes );
	$include_social_followers = isset( $attributes['includeSocialFollowers'] ) ? (bool) get_attribute( $attributes, 'includeSocialFollowers' ) : true;

	$data = array(
		'widget_id'              => Jetpack_Subscriptions_Widget::$instance_count,
		'subscribe_email'        => $subscribe_email,

		'wrapper_attributes'     => get_block_wrapper_attributes(
			array(
				'class' => $classes['block_wrapper'],
			)
		),
		'subscribe_placeholder'  => get_attribute( $attributes, 'subscribePlaceholder', esc_html__( 'Type your email…', 'jetpack' ) ),
		'submit_button_text'     => get_attribute( $attributes, 'submitButtonText', esc_html__( 'Subscribe', 'jetpack' ) ),
		'success_message'        => get_attribute(
			$attributes,
			'successMessage',
			esc_html__( "Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing.", 'jetpack' )
		),
		'show_subscribers_total' => (bool) get_attribute( $attributes, 'showSubscribersTotal' ),
		'subscribers_total'      => get_subscriber_count( $include_social_followers ),
		'referer'                => esc_url_raw(
			( is_ssl() ? 'https' : 'http' ) . '://' . ( isset( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : '' ) .
			( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '' )
		),
		'source'                 => 'subscribe-block',
	);

	if ( is_wpcom() ) {
		return render_wpcom_subscribe_form( $data, $classes, $styles );
	}

	return render_jetpack_subscribe_form( $data, $classes, $styles );
}

/**
 * Renders the WP.com version of the subscriptions block.
 *
 * @param array $data    Array containing block view data.
 * @param array $classes Array containing the classes for different block elements.
 * @param array $styles  Array containing the styles for different block elements.
 *
 * @return string
 */
function render_wpcom_subscribe_form( $data, $classes, $styles ) {
	global $current_blog;

	$form_id = 'subscribe-blog' . ( Jetpack_Subscriptions_Widget::$instance_count > 1 ? '-' . Jetpack_Subscriptions_Widget::$instance_count : '' );
	$url     = defined( 'SUBSCRIBE_BLOG_URL' ) ? SUBSCRIBE_BLOG_URL : '';

	ob_start();

	Jetpack_Subscriptions_Widget::render_widget_status_messages(
		array(
			'success_message' => $data['success_message'],
		)
	);

	?>
	<div <?php echo wp_kses_data( $data['wrapper_attributes'] ); ?>>
		<div class="wp-block-jetpack-subscriptions__container">
			<form
				action="<?php echo esc_url( $url ); ?>"
				method="post"
				accept-charset="utf-8"
				id="<?php echo esc_attr( $form_id ); ?>"
			>
				<?php
				$email_field_id  = 'subscribe-field';
				$email_field_id .= Jetpack_Subscriptions_Widget::$instance_count > 1
					? '-' . Jetpack_Subscriptions_Widget::$instance_count
					: '';
				$label_field_id  = $email_field_id . '-label';
				?>
				<p id="subscribe-email">
					<label
						id="<?php echo esc_attr( $label_field_id ); ?>"
						for="<?php echo esc_attr( $email_field_id ); ?>"
						class="screen-reader-text"
					>
						<?php echo esc_html( $data['subscribe_placeholder'] ); ?>
					</label>

					<?php
					printf(
						'<input
							type="email"
							name="email"
							%1$s
							style="%2$s"
							placeholder="%3$s"
							value=""
							id="%4$s"
						/>',
						( ! empty( $classes['email_field'] )
							? 'class="' . esc_attr( $classes['email_field'] ) . '"'
							: ''
						),
						( ! empty( $styles['email_field'] )
							? esc_attr( $styles['email_field'] )
							: 'width: 95%; padding: 1px 10px'
						),
						esc_attr( $data['subscribe_placeholder'] ),
						esc_attr( $email_field_id )
					);
					?>
				</p>

				<p id="subscribe-submit"
					<?php if ( ! empty( $styles['submit_button_wrapper'] ) ) : ?>
						style="<?php echo esc_attr( $styles['submit_button_wrapper'] ); ?>"
					<?php endif; ?>
				>
					<input type="hidden" name="action" value="subscribe"/>
					<input type="hidden" name="blog_id" value="<?php echo (int) $current_blog->blog_id; ?>"/>
					<input type="hidden" name="source" value="<?php echo esc_url( $data['referer'] ); ?>"/>
					<input type="hidden" name="sub-type" value="<?php echo esc_attr( $data['source'] ); ?>"/>
					<input type="hidden" name="redirect_fragment" value="<?php echo esc_attr( $form_id ); ?>"/>
					<?php wp_nonce_field( 'blogsub_subscribe_' . $current_blog->blog_id, '_wpnonce', false ); ?>
					<button type="submit"
						<?php if ( ! empty( $classes['submit_button'] ) ) : ?>
							class="<?php echo esc_attr( $classes['submit_button'] ); ?>"
						<?php endif; ?>
						<?php if ( ! empty( $styles['submit_button'] ) ) : ?>
							style="<?php echo esc_attr( $styles['submit_button'] ); ?>"
						<?php endif; ?>
					>
						<?php
						echo wp_kses(
							html_entity_decode( $data['submit_button_text'] ),
							Jetpack_Subscriptions_Widget::$allowed_html_tags_for_submit_button
						);
						?>
					</button>
				</p>
			</form>
			<?php if ( $data['show_subscribers_total'] && $data['subscribers_total'] ) : ?>
				<div class="wp-block-jetpack-subscriptions__subscount">
					<?php
					/* translators: %s: number of folks following the blog */
					echo esc_html( sprintf( _n( 'Join %s other follower', 'Join %s other followers', $data['subscribers_total'], 'jetpack' ), number_format_i18n( $data['subscribers_total'] ) ) );
					?>
				</div>
			<?php endif; ?>
		</div>
	</div>
	<?php

	return ob_get_clean();
}

/**
 * Renders the Jetpack version of the subscriptions block.
 *
 * @param array $data    Array containing block view data.
 * @param array $classes Array containing the classes for different block elements.
 * @param array $styles  Array containing the styles for different block elements.
 *
 * @return string
 */
function render_jetpack_subscribe_form( $data, $classes, $styles ) {
	$form_id            = sprintf( 'subscribe-blog-%s', $data['widget_id'] );
	$subscribe_field_id = apply_filters( 'subscribe_field_id', 'subscribe-field', $data['widget_id'] );
	ob_start();

	Jetpack_Subscriptions_Widget::render_widget_status_messages(
		array(
			'success_message' => $data['success_message'],
		)
	);

	?>
	<div <?php echo wp_kses_data( $data['wrapper_attributes'] ); ?>>
		<div class="jetpack_subscription_widget">
			<div class="wp-block-jetpack-subscriptions__container">
				<form action="#" method="post" accept-charset="utf-8" id="<?php echo esc_attr( $form_id ); ?>">
					<p id="subscribe-email">
						<label id="jetpack-subscribe-label"
							class="screen-reader-text"
							for="<?php echo esc_attr( $subscribe_field_id . '-' . $data['widget_id'] ); ?>">
							<?php echo esc_html( $data['subscribe_placeholder'] ); ?>
						</label>
						<input type="email" name="email" required="required"
							<?php if ( ! empty( $classes['email_field'] ) ) : ?>
								class="<?php echo esc_attr( $classes['email_field'] ); ?> required"
							<?php endif; ?>
							<?php if ( ! empty( $styles['email_field'] ) ) : ?>
								style="<?php echo esc_attr( $styles['email_field'] ); ?>"
							<?php endif; ?>
							value="<?php echo esc_attr( $data['subscribe_email'] ); ?>"
							id="<?php echo esc_attr( $subscribe_field_id . '-' . $data['widget_id'] ); ?>"
							placeholder="<?php echo esc_attr( $data['subscribe_placeholder'] ); ?>"
						/>
					</p>

					<p id="subscribe-submit"
						<?php if ( ! empty( $styles['submit_button_wrapper'] ) ) : ?>
							style="<?php echo esc_attr( $styles['submit_button_wrapper'] ); ?>"
						<?php endif; ?>
					>
						<input type="hidden" name="action" value="subscribe"/>
						<input type="hidden" name="source" value="<?php echo esc_url( $data['referer'] ); ?>"/>
						<input type="hidden" name="sub-type" value="<?php echo esc_attr( $data['source'] ); ?>"/>
						<input type="hidden" name="redirect_fragment" value="<?php echo esc_attr( $form_id ); ?>"/>
						<?php
						if ( is_user_logged_in() ) {
							wp_nonce_field( 'blogsub_subscribe_' . get_current_blog_id(), '_wpnonce', false );
						}
						?>
						<button type="submit"
							<?php if ( ! empty( $classes['submit_button'] ) ) : ?>
								class="<?php echo esc_attr( $classes['submit_button'] ); ?>"
							<?php endif; ?>
							<?php if ( ! empty( $styles['submit_button'] ) ) : ?>
								style="<?php echo esc_attr( $styles['submit_button'] ); ?>"
							<?php endif; ?>
							name="jetpack_subscriptions_widget"
						>
							<?php
							echo wp_kses(
								html_entity_decode( $data['submit_button_text'] ),
								Jetpack_Subscriptions_Widget::$allowed_html_tags_for_submit_button
							);
							?>
						</button>
					</p>
				</form>

				<?php if ( $data['show_subscribers_total'] && $data['subscribers_total'] ) : ?>
					<div class="wp-block-jetpack-subscriptions__subscount">
						<?php
						/* translators: %s: number of folks following the blog */
						echo esc_html( sprintf( _n( 'Join %s other subscriber', 'Join %s other subscribers', $data['subscribers_total'], 'jetpack' ), number_format_i18n( $data['subscribers_total'] ) ) );
						?>
					</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
	<?php

	return ob_get_clean();
}
