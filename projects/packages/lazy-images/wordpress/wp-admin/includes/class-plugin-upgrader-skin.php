<?php
/**
 * Upgrader API: Plugin_Upgrader_Skin class
 *
 * @package WordPress
 * @subpackage Upgrader
 * @since 4.6.0
 */

/**
 * Plugin Upgrader Skin for WordPress Plugin Upgrades.
 *
 * @since 2.8.0
 * @since 4.6.0 Moved to its own file from wp-admin/includes/class-wp-upgrader-skins.php.
 *
 * @see WP_Upgrader_Skin
 */
class Plugin_Upgrader_Skin extends WP_Upgrader_Skin {

	/**
	 * Holds the plugin slug in the Plugin Directory.
	 *
	 * @since 2.8.0
	 *
	 * @var string
	 */
	public $plugin = '';

	/**
	 * Whether the plugin is active.
	 *
	 * @since 2.8.0
	 *
	 * @var bool
	 */
	public $plugin_active = false;

	/**
	 * Whether the plugin is active for the entire network.
	 *
	 * @since 2.8.0
	 *
	 * @var bool
	 */
	public $plugin_network_active = false;

	/**
	 * Constructor.
	 *
	 * Sets up the plugin upgrader skin.
	 *
	 * @since 2.8.0
	 *
	 * @param array $args Optional. The plugin upgrader skin arguments to
	 *                    override default options. Default empty array.
	 */
	public function __construct( $args = array() ) {
		$defaults = array(
			'url'    => '',
			'plugin' => '',
			'nonce'  => '',
			'title'  => __( 'Update Plugin' ),
		);
		$args     = wp_parse_args( $args, $defaults );

		$this->plugin = $args['plugin'];

		$this->plugin_active         = is_plugin_active( $this->plugin );
		$this->plugin_network_active = is_plugin_active_for_network( $this->plugin );

		parent::__construct( $args );
	}

	/**
	 * Performs an action following a single plugin update.
	 *
	 * @since 2.8.0
	 */
	public function after() {
		$this->plugin = $this->upgrader->plugin_info();
		if ( ! empty( $this->plugin ) && ! is_wp_error( $this->result ) && $this->plugin_active ) {
			// Currently used only when JS is off for a single plugin update?
			printf(
				'<iframe title="%s" style="border:0;overflow:hidden" width="100%%" height="170" src="%s"></iframe>',
				esc_attr__( 'Update progress' ),
				wp_nonce_url( 'update.php?action=activate-plugin&networkwide=' . $this->plugin_network_active . '&plugin=' . urlencode( $this->plugin ), 'activate-plugin_' . $this->plugin )
			);
		}

		$this->decrement_update_count( 'plugin' );

		$update_actions = array(
			'activate_plugin' => sprintf(
				'<a href="%s" target="_parent">%s</a>',
				wp_nonce_url( 'plugins.php?action=activate&amp;plugin=' . urlencode( $this->plugin ), 'activate-plugin_' . $this->plugin ),
				__( 'Activate Plugin' )
			),
			'plugins_page'    => sprintf(
				'<a href="%s" target="_parent">%s</a>',
				self_admin_url( 'plugins.php' ),
				__( 'Go to Plugins page' )
			),
		);

		if ( $this->plugin_active || ! $this->result || is_wp_error( $this->result ) || ! current_user_can( 'activate_plugin', $this->plugin ) ) {
			unset( $update_actions['activate_plugin'] );
		}

		/**
		 * Filters the list of action links available following a single plugin update.
		 *
		 * @since 2.7.0
		 *
		 * @param string[] $update_actions Array of plugin action links.
		 * @param string   $plugin         Path to the plugin file relative to the plugins directory.
		 */
		$update_actions = apply_filters( 'update_plugin_complete_actions', $update_actions, $this->plugin );

		if ( ! empty( $update_actions ) ) {
			$this->feedback( implode( ' | ', (array) $update_actions ) );
		}
	}
}
