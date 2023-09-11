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

		$this->model->reset();
		$this->model->toggle_status();

		$this->start_scan();

		return $this->model->get_status();
	}

	private function start_scan() {
		// TODO: maybe sanitize params?
		$params = $this->params->get_params();
		$args = $params['type'] . ' ' . $params['old'] . ' ' . $params['new'] . ' ';
		$analyzer_folder = realpath( dirname( __DIR__ ) . '/../' );
		// $cmd = 'nohup php ' . escapeshellarg( $analyzer_folder  . '/scripts/jp-analyze-parallel.php' ) . ' ' . $args . ' &';
		$cmd = array(
			'nohup',
			'php',
			$analyzer_folder  . '/scripts/jp-analyze-parallel.php',
			$params['type'],
			$params['old'],
			$params['new'],
			'&'
		);
		$descriptor_spec = array(
			0 => array( 'file', '/dev/null', 'r' ),
			1 => array( 'file', $analyzer_folder . '/output.txt', 'a' ),
			2 => array( 'file', $analyzer_folder . '/output.txt', 'a' ),
		);

		proc_open( $cmd, $descriptor_spec, $pipes );
	}

	public function post() {
		return array();
	}
}
