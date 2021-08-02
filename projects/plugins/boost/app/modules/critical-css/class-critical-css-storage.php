<?php //phpcs:ignoreFile Generic.Commenting.DocComment.MissingShort,Squiz.Commenting.FunctionComment.Missing
/**
 * Critical CSS storage.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;

/**
 * Critical CSS Storage class
 */
class Critical_CSS_Storage {

	/**
	 * @var Storage_Post_Type
	 */
	protected $storage;

	/**
	 * Critical_CSS_Storage constructor.
	 */
	public function __construct() {
		$this->storage = new Storage_Post_Type( 'css' );
	}

	public function store_css( $key, $value ) {
		$this->storage->set(
			$key,
			array(
				'css' => $value,
			)
		);
	}

	public function clear() {
		$this->storage->clear();
	}

	public function get_css( $possible_keys ) {
		foreach ( $possible_keys as $key ) {
			$data = $this->storage->get( $key, false );
			if ( $data && $data['css'] ) {
				return array(
					'key' => $key,
					'css' => $data['css'],
				);
			}
		}

		return false;
	}
}
