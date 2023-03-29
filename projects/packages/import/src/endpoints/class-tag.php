<?php
/**
 * Tags REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Tag
 */
class Tag extends \WP_REST_Terms_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Whether the controller supports batching. Default true.
	 *
	 * @var array
	 */
	protected $allow_batch = array( 'v1' => true );

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'post_tag' );

		// @see add_term_meta
		$this->import_id_meta_type = 'term';
	}
}
