<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;

class Image_Size_Analysis_Groups implements Entry_Can_Get {

	public function get() {
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

