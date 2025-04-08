<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis_Fixer;

class Image_Size_Analysis_Summary implements Lazy_Entry, Entry_Can_Get {

	public function get( $_fallback = false ) {
		$report_id = defined( 'JETPACK_BOOST_FORCE_REPORT_ID' ) ? JETPACK_BOOST_FORCE_REPORT_ID : 'latest';
		$report    = Boost_API::get( 'image-guide/reports/' . $report_id );

		if ( is_wp_error( $report ) ) {
			// If no report is found, return it as a status.
			if ( $report->get_error_code() === 'report-not-found' ) {
				return array(
					'status'  => 'not-found',
					'message' => __( 'Report not found.', 'jetpack-boost' ),
				);
			}

			// Other kinds of errors are a problem.
			return array(
				'status'  => 'error',
				'message' => $report->get_error_message(),
			);
		}

		if ( isset( $report['status'] ) && $report['status'] === 'completed' && empty( $report['groups'] ) ) {
			return array(
				'status'  => 'error',
				'message' => __( 'Report is incomplete. Missing groups.', 'jetpack-boost' ),
			);
		}

		$fixes = Image_Size_Analysis_Fixer::get_all_fixes();
		if ( ! empty( $fixes ) ) {
			// $fixes is an array of post_ids. which is an array of image fixes. count the number of image fixes.
			$fixed_count = 0;
			foreach ( $fixes as $image_fixes ) {
				$fixed_count += count( $image_fixes );
			}

			// add fixed group object to $report->groups
			$report['groups']['fixed']                  = array();
			$report['groups']['fixed']['issue_count']   = $fixed_count;
			$report['groups']['fixed']['scanned_pages'] = count( $fixes );
			$report['groups']['fixed']['total_pages']   = 1;
		}
		// disable the fixed group for now.
		unset( $report['groups']['fixed'] );
		return $report;
	}
}
