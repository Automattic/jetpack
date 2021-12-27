<?php

ini_set( 'memory_limit', '512M' );

require dirname( __DIR__ ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Locker;
use Automattic\Jetpack\Analyzer\Model;

$slurper_path = dirname( __DIR__ ) . '/slurper/plugins';

$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
// $jetpack_new_path = '/Users/brbrr/Developer/a8c/jetpack/projects/plugins/jetpack';
$jetpack_new_path = '/var/www/html/wp-content/plugins/jetpack';
$jetpack_old_path = $slurper_path . '/jetpack-production';

class ScanManager {
	private $count          = 0;
	private $procs          = array();
	private $pipez          = array();
	private $descriptorspec = array(
		0 => array( 'pipe', 'r' ),
		1 => array( 'pipe', 'w' ),
		2 => array( 'file', '/tmp/error-output.txt', 'a' ),
	);

	private $model;

	public function __construct() {
		$this->model = new Model();
	}

	public function start_proc( $folder_name ) {
		echo 'Starting ' . basename( $folder_name ) . "\n";
		$cmd = 'php ' . escapeshellarg( dirname( __DIR__ ) . '/scripts/jp-warnings-job.php' ) . ' ' . escapeshellarg( $folder_name );
		$this->count++;
		$process       = proc_open( $cmd, $this->descriptorspec, $pipes );
		$this->procs[] = $process;
		$this->pipez[] = $pipes;
		$this->model->update_process( 0, basename( $folder_name ) );
	}

	public function check_procs() {
		foreach ( $this->procs as $id => $proc ) {
			$status = proc_get_status( $proc );
			if ( ! $status['running'] ) {
				echo stream_get_contents( $this->pipez[ $id ][1] );
				$folder_name = explode( ' ', $status['command'] )[2];
				$this->model->update_process( -1, null, basename( $folder_name ) );

				$this->count--;

				proc_close( $proc );
				unset( $this->procs[ $id ] );
				unset( $this->pipez[ $id ] );

				echo 'Done with ' . basename( $folder_name ) . "\n";
			}
		}
	}

	public function wait_for_procs( $count = 5 ) {
		while ( $this->count > $count ) {
			$this->check_procs();
		}
	}

	public function get_count() {
		return $this->count;
	}
	public function scan( $arr ) {
		$this->wait_for_procs();
		$this->model->update_process( count( $arr ) );
		foreach ( $arr as $folder_name ) {
			$this->start_proc( $folder_name );
		}

		$this->wait_for_procs( 0 );

		echo 'Analysis finished' . "\n";

		$this->model->load_result();
		Locker::unlock();
	}
}

Automattic\Jetpack\Analyzer\Scripts::get_differences( $jetpack_new_path, $jetpack_old_path );

// $arr = glob( $slurper_path . '/*' );
$arr  = array( $slurper_path . '/connect-for-woocommerce', $slurper_path . '/easyreservations' );
$mngr = new ScanManager();
$mngr->scan( $arr );
