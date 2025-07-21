<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis;

/**
 * Data sync entry for Image Size Analysis UI display state.
 */
class Image_Size_Analysis_UI_State implements Entry_Can_Get {

	/**
	 * Get the UI display state.
	 *
	 * @param mixed $_fallback Unused fallback parameter.
	 * @return array The UI display state.
	 */
	public function get( $_fallback = false ) {
		return array(
			'should_display_ui' => Image_Size_Analysis::should_display_ui(),
		);
	}
}
