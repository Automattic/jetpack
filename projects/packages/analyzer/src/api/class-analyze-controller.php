<?php
namespace Automattic\Jetpack\Analyzer;

class Analyze_Controller extends Controller {
	public function get() {
		try {
			Locker::lock();
		} catch ( \Throwable $th ) {
			// TODO: extend default Exception class, and use instance_of instead.
			if ( 'Locked already' === $th->getMessage() ) {
				return $this->model->get_status();
			}
			throw $th;
		}

		$cmd = 'nohup php ' . escapeshellarg( dirname( __DIR__ ) . '/../scripts/jp-analyze-parallel.php' ) . ' &';

		$descriptor_spec = array(
			0 => array( 'file', '/dev/null', 'r' ),
			1 => array( 'file', 'output.txt', 'a' ),
			2 => array( 'file', 'output.txt', 'a' ),
		);


		$this->model->reset();
		$this->model->toggle_status();

		proc_open( $cmd, $descriptor_spec, $pipes );

		return $this->model->get_status();

	}

	public function post() {
		return array();
	}
}
