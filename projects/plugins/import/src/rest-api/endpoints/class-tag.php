<?php
/**
 * Tags REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Class Tag
 */
class Tag extends \WP_REST_Terms_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'tag' );
	}
}
