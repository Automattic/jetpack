<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;

class Image_Size_Analysis_Summary implements Lazy_Entry, Entry_Can_Get {

	public function get() {
		$report = Boost_API::get( 'image-guide/reports/latest' );

		if ( is_wp_error( $report ) ) {
			// If no report is found, return it as a status.
			if ( $report->get_error_code() === 'report-not-found' ) {
				return array(
					'status' => 'not-found',
				);
			}

			// Other kinds of errors are a problem.
			return array(
				'status' => 'error',
				'error'  => $report->get_error_message(),
			);
		}

		return $report;
	}
}

