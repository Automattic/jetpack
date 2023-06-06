<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;

class Image_Size_Analysis_Summary implements Entry_Can_Get {

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

		/**
		 * @TODO: this needs to be replaced with actual report data :)
		 */
		return array(
			'home'    => array(
				'name'     => 'Homepage',
				'progress' => 100,
				'issues'   => 28,
				'done'     => true,
			),
			'pages'   => array(
				'name'     => 'Pages',
				'progress' => 100,
				'issues'   => 7,
				'done'     => true,
			),
			'posts'   => array(
				'name'     => 'Posts',
				'progress' => 37,
				'issues'   => 0,
				'done'     => false,
			),
			'other'   => array(
				'name'     => 'Other Content',
				'progress' => 0,
				'issues'   => 13,
				'done'     => false,
			),
			'ignored' => array(
				'name'     => 'Ignored',
				'progress' => 0,
				'issues'   => 789,
				'done'     => false,
			),
		);
	}
}

