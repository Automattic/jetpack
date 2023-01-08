<?php
/**
 * Categories REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Class Category
 */
class Category extends \WP_REST_Terms_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'category' );
	}
}
