<?php
/**
 * Contact_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * REST_Jetpack_Form_Controller class.
 *
 * Responsible for handling REST API requests for Jetpack forms custom post type.
 */
class REST_Jetpack_Form_Controller extends WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'jetpack-form' );
	}
}
