<?php
/**
 * The class file responsible for the copy page url button.
 *
 * @package automattic/jetpack
 * @file
 */

/**
 * List of all custom HTTP routes implemented as a part of the pistachio plugin.
 */
require_once __DIR__ . '/../sharing-sources.php';

/**
 * The class responsible for the copy page url button.
 */
class Share_Copy_Page_Url extends Sharing_Source {
	/**
	 * The shortname of the service.
	 *
	 * @var string
	 */
	public $shortname = 'copy-post-url';

	/**
	 * The icon to be used with the service.
	 *
	 * @var string
	 */
	public $icon = '\f469';

	/**
	 * The constructor.
	 *
	 * @param string $id The identifier of the sharing source.
	 * @param array  $settings The user settings pertaining to sharing.
	 */
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' === $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
		$this->open_link_in_new = false;
	}

	/**
	 * Function to get the name of the button
	 */
	public function get_name() {
		return __( 'Copy Link', 'jetpack' );
	}

	/**
	 * Function to get the HTML div for the Share_Copy_Page_Url button
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_display( $post ) {
		$value = $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Copy Link', 'share to', 'jetpack' ), __( 'Click to copy page url to the clipboard', 'jetpack' ) );
		return $value;
	}

	/**
	 * AMP display for Print.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		return get_display( $post );
	}

	/**
	 * Function to display footer message when the Share_Copy_Page_Url is clicked
	 */
	public function display_footer() {
		echo '<div id="share-copy-post-url-confirmation-toast">Copied post link to the clipboard</div>';
	}
}
