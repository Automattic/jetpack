<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileNames

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Modules list endpoint.
 *
 * GET /sites/%s/jetpack/modules
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Modules_List_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {

	/**
	 * Needed capabilities.
	 *
	 * @var string
	 */
	protected $needed_capabilities = 'jetpack_manage_modules';

	/**
	 * Validate the input.
	 *
	 * @param string $module - the module.
	 *
	 * @return bool
	 */
	public function validate_input( $module ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->modules = Jetpack::get_available_modules();
		return true;
	}
}
