<?php
/**
 * WPCOM Global Navbar Class
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Provides custom admin bar instead of the default WordPress admin bar.
 */
class WPcom_Global_Nav {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_bar_init', array( $this, 'init' ) );
	}

	/**
	 * Initialize our masterbar.
	 */
	public function init() {
		add_action( 'wp_before_admin_bar_render', array( $this, 'update_core_masterbar' ), 99999 );
	}

	/**
	 * Update and add items on the core masterbar.
	 */
	public function update_core_masterbar() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return false;
		}

		$nodes = array();

		// First, lets gather all nodes and remove them.
		foreach ( $wp_admin_bar->get_nodes() as $node ) {
			$nodes[ $node->id ] = $node;
			$wp_admin_bar->remove_node( $node->id );
		}

		// Add custom groups and menus here

		// Re-add original nodes
		foreach ( $nodes as $id => $node ) {
			$wp_admin_bar->add_node( $node );
		}
	}
}
