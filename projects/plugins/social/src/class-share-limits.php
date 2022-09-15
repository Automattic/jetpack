<?php
/**
 * Enforce sharing limits for Jetpack Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Redirect;

/**
 * Enforce sharing limits for Jetpack Social.
 */
class Share_Limits {
	/**
	 * List of all connections.
	 *
	 * @var array
	 */
	public $connections;

	/**
	 * Number of shares remaining.
	 *
	 * @var int
	 */
	public $shares_remaining;

	/**
	 * If the blog has a Jetpack Social paid plan.
	 *
	 * @var boolean
	 */
	public $has_paid_plan;

	/**
	 * Constructor.
	 *
	 * @param array   $connections List of Publicize connections.
	 * @param int     $shares_remaining Number of shares remaining for this period.
	 * @param boolean $has_paid_plan If the blog has a Jetpack Social paid plan.
	 */
	public function __construct( $connections, $shares_remaining, $has_paid_plan ) {
		$this->connections      = $connections;
		$this->shares_remaining = $shares_remaining;
		$this->has_paid_plan    = $has_paid_plan;
	}

	/**
	 * Run functionality required to enforce sharing limits.
	 */
	public function enforce_share_limits() {

		if ( $this->has_paid_plan ) {
			return;
		}
		add_action( 'publicize_classic_editor_form_after', array( $this, 'render_classic_editor_notice' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_classic_editor_scripts' ) );

		if ( ! $this->has_more_shares_than_connections() ) {
			/**
			 * If the number of connections is greater than the share limit, we set all
			 * connections to disabled by default. This allows the user to pick and
			 * choose which services they want to share to, without going over the limit.
			 */
			add_filter( 'publicize_checkbox_default', '__return_false' );
		}
	}

	/**
	 * Check if a site has more shares than connections.
	 *
	 * @return bool True if there's more shares than connections left, false otherwise.
	 */
	public function has_more_shares_than_connections() {
		return $this->shares_remaining >= count( $this->connections );
	}

	/**
	 * Render a notice with the share count in the classic editor.
	 */
	public function render_classic_editor_notice() {
		$current_page_url = null;
		if ( isset( $_SERVER['REQUEST_SCHEME'] ) && isset( $_SERVER['HTTP_HOST'] ) && isset( $_SERVER['REQUEST_URI'] ) ) {
			// phpcs:ignore -- WordPress.Security.ValidatedSanitizedInput.InputNotSanitized If we use esc_raw_url, it adds http to the beginning.
			$current_page_url =  wp_unslash( $_SERVER['REQUEST_SCHEME'] ) . '://' . wp_unslash( $_SERVER['HTTP_HOST'] ) . wp_unslash( $_SERVER['REQUEST_URI'] );
		}
		$redirect_url = $current_page_url ? Redirect::get_url(
			'jetpack-social-basic-plan-classic-editor',
			array(
				'query' => 'redirect_to=' . $current_page_url,
			)
		) :
		Redirect::get_url( 'jetpack-social-basic-plan-classic-editor' );

		$notice = sprintf(
			/* translators: %1$d: number of shares remaining, %2$s: link to upgrade the plan. */
			_n(
				'You currently have %1$d share remaining. <a href="%2$s" target="_blank">Upgrade</a> to get more.',
				'You currently have %1$d shares remaining. <a href="%2$s" target="_blank">Upgrade</a> to get more.',
				$this->shares_remaining,
				'jetpack-social'
			),
			$this->shares_remaining,
			$redirect_url
		);

		$kses_allowed_tags = array(
			'a' => array(
				'href'   => array(),
				'target' => array(),
			),
		);

		echo '<p><em>' . wp_kses( $notice, $kses_allowed_tags ) . '</em></p>';
	}

	/**
	 * Enqueue scripts for the Classic Editor on the post edit screen.
	 */
	public function enqueue_classic_editor_scripts() {
		$current_screen = get_current_screen();

		if ( empty( $current_screen ) || $current_screen->base !== 'post' || $current_screen->is_block_editor() ) {
			return;
		}

		if ( get_post_status() === 'publish' ) {
			return;
		}

		Assets::register_script(
			'jetpack-social-classic-editor-share-limits',
			'build/classic-editor.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social-classic-editor-share-limits' );
		wp_add_inline_script( 'jetpack-social-classic-editor-share-limits', $this->render_initial_state(), 'before' );
	}

	/**
	 * Get the initial state for the Classic Editor.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		$state = array(
			'sharesRemaining'     => $this->shares_remaining,
			'numberOfConnections' => count( $this->connections ),
		);

		return 'var jetpackSocialClassicEditorInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $state ) ) . '"));';
	}
}
