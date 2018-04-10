<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';

class Jetpack_Sync_Packager {
	private $actions;
	private $packages;
	protected $listener;
	// singleton functions
	private static $instance;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->set_defaults();
	}

	private function set_defaults() {
		$this->actions = array();
		$this->listener = Jetpack_Sync_Listener::get_instance();
		$this->packages = array(
			'jetpack_published_post' => array(),
			'jetpack_sync_save_post' => array(),
		);
	}

	function add( $action, $args ) {
		$this->actions[] = array(
			'trigger' => $action,
			'args' => $args,
		);
	}

	function did_action( $action ) {
		return in_array( $action, wp_list_pluck( $this->actions, 'trigger' ) );
	}

	function create_post_saved_packages( $action ) {
		if ( 'jetpack_sync_save_post' === $action['trigger'] ) {
			$post_id = $action['args'][0];
			$post = $action['args'][1];
			$state = $action['args'][3];
			$this->packages['jetpack_sync_save_post'][ $post_id ] = new Jetpack_Sync_Package();
			$this->packages['jetpack_sync_save_post'][ $post_id ]->set_state( $state );
			$this->packages['jetpack_sync_save_post'][ $post_id ]->set_object( $post );
		}
		return true;
	}

	function add_related_actions_to_post_saved_packages( $action ) {
		return true;
	}

	function create_post_published_packages( $action ) {
		if ( 'jetpack_published_post' === $action['trigger'] ) {
			$post_id = $action['args'][0];
			$state = $action['args'][1];
			$this->packages['jetpack_published_post'][ $post_id ] = new Jetpack_Sync_Package();
			$this->packages['jetpack_published_post'][ $post_id ]->set_state( $state );
		}
		return true;
	}

	function add_related_actions_to_post_published_packages( $action ) {
		if ( 'jetpack_sync_save_post' === $action['trigger'] ) {
			$post_id = $action['args'][0];
			$post = $action['args'][1];
			$state = $action['args'][3];
			if ( isset( $this->packages['jetpack_published_post'][ $post_id ] ) ) {
				$this->packages['jetpack_published_post'][ $post_id ]->set_object( $post );
				$this->packages['jetpack_published_post'][ $post_id ]->set_state( array_merge( $state, $this->packages['jetpack_published_post'][ $post_id ]->get_state() ) );
			}
		}
		return true;
	}

	function package_post_saved() {
		// Filter out `jetpack_sync_save_post` actions, and create packages.
		$this->actions = array_filter( $this->actions, array( $this, 'create_post_saved_packages' ) );
		// Filter out actions related to `jetpack_sync_save_post`, and add them to packages.
		$this->actions = array_filter( $this->actions, array( $this, 'add_related_actions_to_post_saved_packages' ) );
//		print_r( "\n" );
//		print_r( "\n" );
//		print_r( 'packageing post saved' );
//		print_r( "\n" );
//		print_r( "\n" );
//		print_r( $this->packages );
	}

	function package_post_published() {
		// Filter out `jetpack_published_post` actions, and create packages.
		$this->actions = array_filter( $this->actions, array( $this, 'create_post_published_packages' ) );
		// Filter out actions related to `jetpack_published_post`, and add them to packages.
		$this->actions = array_filter( $this->actions, array( $this, 'add_related_actions_to_post_published_packages' ) );
//		print_r( "\n" );
//		print_r( "\n" );
//		print_r( 'packageing post published' );
//		print_r( "\n" );
//		print_r( "\n" );
//		print_r( $this->packages );
	}

	function send_items_to_queue() {
		if ( empty( $this->actions ) ) {
			return;
		}

		if ( $this->did_action( 'jetpack_published_post' ) ) {
			$this->package_post_published();
		}

		if ( $this->did_action( 'jetpack_sync_save_post' ) ) {
			$this->package_post_saved();
		}

		foreach ( $this->actions as $action ) {
			$this->listener->enqueue_action( $action['trigger'], $action['args'], $this->listener->get_sync_queue() );
		}
//		print_r( "\n" );
//		print_r( "\n" );
//		print_r( $this->actions );
		// Reset Items
		$this->actions = array();
	}
}

class Jetpack_Sync_Package {
	private $object;
	private $state;
	private $related_actions;

	function __construct() {
		$this->related_actions = array();
	}

	function set_state( $state ) {
		$this->state = $state;
	}

	function get_state() {
		return $this->state;
	}

	function set_object( $object ) {
		$this->object = $object;
	}

	function add_related_action( $trigger, $args ) {
		$this->related_actions[] = array(
			'trigger' => $trigger,
			'args' => $args,
		);
	}
}
