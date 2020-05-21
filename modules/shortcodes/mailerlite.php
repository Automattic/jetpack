<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;
/**
 * Mailerlite Subscriber Popup Form shortcode
 *
 * Example:
 * [mailerlite_subscriber_popup account="234532432" uuid="rat43ttatrs"]
 */

/**
 * Register [mailerlite_subscriber_popup] shortcode.
 */
function jetpack_mailerlite_subscriber_popup() {
	add_shortcode(
		'mailerlite_subscriber_popup',
		array(
			'Mailerlite_Subscriber_Popup',
			'shortcode',
		)
	);
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'init', 'jetpack_mailerlite_subscriber_popup' );
} else {
	jetpack_mailerlite_subscriber_popup();
}

/**
 * Class Mailerlite_Subscriber_Popup
 *
 * @since 4.5.0
 */
class Mailerlite_Subscriber_Popup {
	/**
	 * Parses the shortcode back out to embedded information.
	 *
	 * @param array $attrs shortcode attributes.
	 *
	 * @return string
	 */
	public static function shortcode( $attrs ) {
		if ( wp_script_is( 'mailerlite-subscriber-popup', 'enqueued' ) ) {
			return '';
		}

		$attrs = shortcode_atts(
			array(
				'account' => '',
				'uuid'    => '',
			),
			$attrs,
			'mailerlite_subscriber_popup'
		);
		wp_register_script( 'mailerlite-universal', 'https://static.mailerlite.com/js/universal.js', array(), '20200521', true );
		wp_enqueue_script(
			'mailerlite-subscriber-popup',
			Assets::get_file_url_for_environment( '_inc/build/shortcodes/js/mailerlite-subscriber-popup.min.js', 'modules/shortcodes/js/mailerlite-subscriber-popup.js' ),
			array( 'mailerlite-universal' ),
			'20200521',
			true
		);
		wp_localize_script( 'mailerlite-subscriber-popup', 'jetpackMailerliteSettings', $attrs );
		return '';
	}
}
