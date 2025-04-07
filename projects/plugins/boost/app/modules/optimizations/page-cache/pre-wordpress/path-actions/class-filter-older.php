<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use SplFileInfo;

class Filter_Older implements Path_Action {
	private $timestamp;
	private $sub_action;

	public function __construct( $timestamp, Path_Action $action ) {
		$this->timestamp  = $timestamp;
		$this->sub_action = $action;
	}

	public function apply_to_path( SplFileInfo $file ) {
		$file_path = $file->getPathname();
		$filemtime = filemtime( $file_path );

		if ( $filemtime <= $this->timestamp ) {
			return $this->sub_action->apply_to_path( $file );
		}

		return 0;
	}
}
