<?php
namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Collection;

class Recommendations {

	protected $dismissed_recommendations;

	public function __construct() {
		$this->dismissed_recommendations = new Collection( 'jetpack_boost_dismissed_recommendations' );
	}
	
	/**
	 * @return array of strings with provider keys that have recommendations dismissed.
	 */
	public function get_dismissed() {
		return $this->dismissed_recommendations->get();
	}
	public function dismiss( $recommendation_for_provider ) {
		$this->dismissed_recommendations->append( $recommendation_for_provider );
	}

	public function reset() {
		$this->dismissed_recommendations->delete();
	}

}
