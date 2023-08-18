<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Themes API: add is_block_theme field to the themes endpoint.
 *
 * @package automattic/jetpack
 */

/**
 * Field controller for adding the is_block_theme field to the themes endpoint.
 */
class WPCOM_REST_API_V2_Theme_Fields_Is_Block_Theme extends WPCOM_REST_API_V2_Field_Controller {
	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- extended methods must have the same signatures, even if paramaters are unused.

	/**
	 * Array of post types that can handle Publicize.
	 *
	 * @var array
	 */
	protected $object_type = array( 'theme' );

	/**
	 * Field name
	 *
	 * @var string
	 */
	protected $field_name = 'is_block_theme';

	/**
	 * Permission check when getting the field.
	 *
	 * @param array           $object_data The theme data.
	 * @param WP_REST_Request $request     WP API request.
	 *
	 * @return bool
	 */
	public function get_permission_check( $object_data, $request ) {
		// Allow access to the field if user already has permission to view the theme,
		// as checked by the WP_REST_Themes_Controller.
		return true;
	}

	/**
	 * Get the value of the field.
	 *
	 * @param array           $object_data The theme data.
	 * @param WP_REST_Request $request     WP API request.
	 *
	 * @return bool Whether the theme is a block-based theme.
	 */
	public function get( $object_data, $request ) {
		$theme = wp_get_theme( $object_data['stylesheet'] );
		return $theme->exists() ? $theme->is_block_theme() : false;
	}

	/**
	 * Permission check when updating the field.
	 *
	 * This is not used because themes can't be updated using the API.
	 *
	 * @param bool            $value       The new value of the field.
	 * @param array           $object_data The theme data.
	 * @param WP_REST_Request $request     WP API request.
	 *
	 * @return bool
	 */
	public function update_permission_check( $value, $object_data, $request ) {
		return false;
	}

	/**
	 * Update the field.
	 *
	 * This is not used because themes can't be updated using the API.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param mixed           $object_data The theme data.
	 * @param WP_REST_Request $request     WP API request.
	 *
	 * @return WP_Error
	 */
	public function update( $value, $object_data, $request ) {
		return new WP_Error( 'not_implemeted', __( 'Themes cannot be updated using the REST API.', 'jetpack' ), array( 'status' => 501 ) );
	}

	/**
	 * Schema for the field.
	 *
	 * @return array
	 */
	public function get_schema() {
		return array(
			'description' => __( 'Whether the theme is a block-based theme.', 'jetpack' ),
			'type'        => 'boolean',
			'readonly'    => true,
		);
	}
}

// `is_block_theme` was added to the v2/themes endpoint in WordPress 6.3.
// See https://core.trac.wordpress.org/ticket/58123
global $wp_version;
if ( version_compare( $wp_version, '6.3', '<' ) ) { // @todo Remove when WordPress 6.3 is the minimum.
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Theme_Fields_Is_Block_Theme' );
}
