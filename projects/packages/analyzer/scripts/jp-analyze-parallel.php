<?php

ini_set( 'memory_limit', '512M' );

require dirname( __DIR__ ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Locker;
use Automattic\Jetpack\Analyzer\Model;
use Automattic\Jetpack\Analyzer\PluginDownloader;
use Automattic\Jetpack\Analyzer\Scripts;

$slurper_path = dirname( __DIR__ ) . '/slurper/plugins';

$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

class ScanManager {
	private $count          = 0;
	private $procs          = array();
	private $model;

	public function __construct() {
		$this->model = new Model();
	}

	public function start_proc( $folder_name ) {
		echo 'Starting ' . basename( $folder_name ) . "\n";
		$cmd = array( 'php', dirname( __DIR__ ) . '/scripts/jp-warnings-job.php', $folder_name );
		$this->count++;

		$descriptorspec = array(
			0 => array( 'file', '/dev/null', 'r' ),
			1 => array( 'file', dirname( __DIR__ ) . '/output.txt', 'a' ),
			2 => array( 'file', dirname( __DIR__ ) . '/output.txt', 'a' ),
		);
		$process       = proc_open( $cmd, $descriptorspec, $pipes );
		$this->procs[] = $process;
		$this->model->update_process( 0, basename( $folder_name ) );
	}

	public function check_procs() {
		foreach ( $this->procs as $id => $proc ) {
			$status = proc_get_status( $proc );
			if ( ! $status['running'] ) {
				$folder_name = str_replace("'", '', explode( ' ', $status['command'] ))[2];
				$this->model->update_process( -1, null, basename( $folder_name ) );

				$this->count--;

				proc_close( $proc );
				unset( $this->procs[ $id ] );

				echo 'Done with ' . basename( $folder_name ) . "\n";
			}
		}
	}

	public function wait_for_procs( $count = 10 ) {
		$this->check_procs();
		while ( $this->count > $count ) {
			sleep( 1 );
			$this->check_procs();
		}
	}

	public function get_count() {
		return $this->count;
	}
	public function scan( $arr ) {
		$this->model->update_process( count( $arr ) );
		foreach ( $arr as $folder_name ) {
			$this->wait_for_procs();
			$this->start_proc( $folder_name );
		}

		$this->wait_for_procs( 0 );

		echo 'Analysis finished' . "\n";

		$this->model->toggle_status();
		$this->model->load_result();
		Locker::unlock();
	}
}

$type = $argv[1];
$old = $argv[2];
$new = $argv[3];

$pd = new PluginDownloader($type);
$old_path = $pd->get_version($old);
$new_path = $pd->get_version($new);

Scripts::cleanup();
Scripts::get_differences( $new_path, $old_path );

// $arr = glob( $slurper_path . '/*' );
$arr  = array( $slurper_path . '/connect-for-woocommerce', $slurper_path . '/easyreservations' );
$mngr = new ScanManager();
$mngr->scan( $arr );
