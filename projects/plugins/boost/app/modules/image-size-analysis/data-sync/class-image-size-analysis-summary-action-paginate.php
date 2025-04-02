<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync\Image_Size_Analysis_Entry;

/**
 * Image Size Analysis: Action to fix an image
 */
class Image_Size_Analysis_Summary_Action_Paginate implements Data_Sync_Action {

	public function handle( $data, $_request ) {
		$entry = new Image_Size_Analysis_Entry();
		return $entry->get( $data['page'], $data['group'] );
	}
}
