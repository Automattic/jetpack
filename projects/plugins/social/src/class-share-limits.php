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
	 * Constructor.
	 *
	 * @param array $connections List of Publicize connections.
	 * @param int   $shares_remaining Number of shares remaining for this period.
	 */
	public function __construct( $connections, $shares_remaining ) {
		$this->connections      = $connections;
		$this->shares_remaining = $shares_remaining;
	}

	/**
	 * Connections are stored in a two-dimensional array, with the first dimension being the service name and the second an array of connections. We need to
	 * flatten this array so that we can get the number of connections.
	 *
	 * @return int Number of connections.
	 */
	public function get_number_of_connections() {
		return count( array_merge( ...array_values( $this->connections ) ) );
	}

	/**
	 * Run functionality required to enforce sharing limits.
	 */
	public function enforce_share_limits() {
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
		return $this->shares_remaining >= $this->get_number_of_connections();
	}

	/**
	 * Enqueue scripts for the Classic Editor on the post edit screen.
	 */
	public function enqueue_classic_editor_scripts() {
		$current_screen = get_current_screen();

		if ( $current_screen->base !== 'post' ) {
			return;
		}

		if ( method_exists( $current_screen, 'is_block_editor' ) && $current_screen->is_block_editor() ) {
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
		$notice = sprintf(
			/* translators: %1$d: number of shares remaining, %2$s: link to upgrade the plan. */
			_n(
				'You currently have %1$d share remaining. <a href="%2$s" target="_blank">Upgrade</a> to get more.',
				'You currently have %1$d shares remaining. <a href="%2$s" target="_blank">Upgrade</a> to get more.',
				$this->shares_remaining,
				'jetpack-social'
			),
			$this->shares_remaining,
			Redirect::get_url( 'jetpack-social-basic-plan-classic-editor' )
		);

		$state = array(
			'sharesRemaining'     => $this->shares_remaining,
			'numberOfConnections' => $this->get_number_of_connections(),
			'notice'              => $notice,
		);

		return 'var jetpackSocialClassicEditorInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $state ) ) . '"));';
	}
}
