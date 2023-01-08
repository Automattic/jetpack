<?php
/**
 * Posts REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Class Post
 */
class Post extends \WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'post' );
	}
}
