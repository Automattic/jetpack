<?php
/**
 * Plugin Name: Feedback CPT Permissions over-ride
 *
 * @deprecated 13.3 Use automattic/jetpack-forms
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;

if ( class_exists( 'WP_REST_Posts_Controller' ) ) {

	/**
	 * Class Grunion_Contact_Form_Endpoint
	 * Used as 'rest_controller_class' parameter when 'feedback' post type is registered in modules/contact-form/grunion-contact-form.php.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint
	 */
	class Grunion_Contact_Form_Endpoint extends WP_REST_Posts_Controller {
		/**
		 * Check whether a given request has proper authorization to view feedback items.
		 *
		 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint->get_items_permissions_check
		 * @param  WP_REST_Request $request Full details about the request.
		 * @return WP_Error|boolean
		 */
		public function get_items_permissions_check( $request ) {
			_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint->get_items_permissions_check' );

			return ( new Contact_Form_Endpoint( $this->post_type ) )->get_items_permissions_check( $request );
		}

		/**
		 * Check whether a given request has proper authorization to view feedback item.
		 *
		 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint->get_item_permissions_check
		 * @param  WP_REST_Request $request Full details about the request.
		 * @return WP_Error|boolean
		 */
		public function get_item_permissions_check( $request ) {
			_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint->get_item_permissions_check' );

			return ( new Contact_Form_Endpoint( $this->post_type ) )->get_item_permissions_check( $request );
		}
	}

}
