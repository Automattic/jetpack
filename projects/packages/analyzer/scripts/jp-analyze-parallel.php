<?php

ini_set( 'memory_limit', '512M' );

require dirname( __DIR__ ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Locker;

$slurper_path = dirname( __DIR__ ) . '/slurper/plugins';

$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
// $jetpack_new_path = '/Users/brbrr/Developer/a8c/jetpack/projects/plugins/jetpack';
$jetpack_new_path = '/var/www/html/wp-content/plugins/jetpack';
$jetpack_old_path = $slurper_path . '/jetpack-production';

class ProcManager {
	private $count          = 0;
	private $procs          = array();
	private $pipez          = array();
	private $descriptorspec = array(
		0 => array( 'pipe', 'r' ),
		1 => array( 'pipe', 'w' ),
		2 => array( 'file', '/tmp/error-output.txt', 'a' ),
	);

	public function start_proc( $cmd ) {
			$this->wait_for_procs();
			$this->count++;
			$process       = proc_open( $cmd, $this->descriptorspec, $pipes );
			$this->procs[] = $process;
			$this->pipez[] = $pipes;
	}

	public function check_procs() {
		foreach ( $this->procs as $id => $proc ) {
			if ( proc_get_status( $proc )['pid'] > 0 ) {
				// print_r( proc_get_status( $proc ) );
				echo stream_get_contents( $this->pipez[ $id ][1] );
				proc_close( $proc );
				unset( $this->procs[ $id ] );
				unset( $this->pipez[ $id ] );
				$this->count--;
			}
		}
	}

	public function wait_for_procs( $count = 5 ) {
		while ( $this->count > $count ) {
			$this->check_procs();
		}
	}

	public function get_count() {
		return $this->count;}
}

Automattic\Jetpack\Analyzer\Scripts::get_differences( $jetpack_new_path, $jetpack_old_path );
$mngr = new ProcManager();

// $arr = glob( $slurper_path . '/*' );
$arr = array( $slurper_path . '/facebook-for-woocommerce', $slurper_path . '/google-listings-and-ads' );
foreach ( $arr as $folder_name ) {
	$cmd = 'php ' . dirname( __DIR__ ) . '/scripts/jp-warnings-job.php ' . $folder_name;
	$mngr->start_proc( $cmd );
	echo 'Starting ' . basename( $folder_name ) . "\n";
}

$mngr->wait_for_procs( 0 );

echo 'Analysis finished' . "\n";

Locker::unlock();
