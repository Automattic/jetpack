<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 *
 * @package Jetpack
 */

/**
 * Generic class for managing Jetpack Items
 */
class Jetpack_Registry {

	private $registry = array();

	private $type_of = null;

	function __construct( $type_of ) {
		$this->type_of = $type_of;
	}

	/**
	 * Registers the Jetpack Item
	 *
	 * @param $slug
	 * @param $args
	 */
	public function register( $name, $args ) {
		if ( ! in_array( 'iJetpack_Item', class_implements( $this->type_of ) ) ) {
			$message = sprintf( __( 'type of  "%s" does not implement iJetpack_Item interface.' ), $this->type_of );
			_doing_it_wrong( __METHOD__, $message, '5.0.0' );
			return false;
		}
		$this->registry[ $name ] = new $this->type_of( $name, $args );
		return $this->registry[ $name ];

	}

	/*
	 * Return the list of available keys
	 */
	public function get_available() {
		return array_keys( $this->registry );
	}

	/**
	 * Return a single Jetpack Item
	 *
	 * @param $slug
	 *
	 * @return mixed
	 */
	public function get( $name ) {
		return $this->registry[ $name ]->get();
	}

}

/**
 * Help register modules and tells jetpack about them.
 *
 * @param $slug
 * @param $args
 */
function jetpack_register_module( $name, $args ) {
	$module_regestry = Jetpack::init()->get_module_registry();
	$module_regestry->register( $name, $args );
}
