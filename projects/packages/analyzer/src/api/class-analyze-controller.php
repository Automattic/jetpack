<?php
namespace Automattic\Jetpack\Analyzer;

class Analyze_Controller extends Controller {
	public function get() {
		try {
			Locker::lock();
		} catch ( \Throwable $th ) {
			// TODO: extend default Exception class, and use instance_of instead.
			if ( 'Locked already' === $th->getMessage() ) {
				return array(
					'status' => 'locked',
				);
			}
		}

		$cmd = 'php ' . dirname( __DIR__ ) . '/../scripts/jp-analyze-parallel.php';

		$descriptor_spec = array(
			0 => array( 'pipe', 'r' ),
			1 => array( 'file', 'output.txt', 'a' ),
			2 => array( 'file', 'output.txt', 'a' ),
		);

		proc_open( $cmd, $descriptor_spec, $pipes );

		$this->model->reset();

		return array(
			'status' => 'started',
		);
	}

	public function post() {
		return array();
	}
}
