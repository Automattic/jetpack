<?php
namespace Automattic\Jetpack\Analyzer;

class Model {
	private $db_file;
	private $content;

	public function __construct() {
		$this->db_file = dirname( __DIR__ ) . '/data-store.json';
	}

	public function get_status() {
		$this->load();
		return $this->content;
	}

	public function toggle_status() {
		$this->load();
		if ($this->content['status'] === 'finished') {
			$this->content['status'] = 'in_progress';
		} else {
			$this->content['status'] = 'finished';
		}
		$this->persist();
	}

	public function get() {
		return $this->content;
	}

	public function update_process( $increment, $started_plugin = null, $finished_plugin = null ) {
		$this->load();
		if ( ! isset( $this->content['progress'] ) ) {
			$this->content['progress'] = array(
				'plugins_left' => 0,
				'in_progress'  => array(),
			);
		}

		$current_list = $this->content['progress']['in_progress'];

		if ( null !== $finished_plugin && false !== ( $key = array_search( $finished_plugin, $current_list ) ) ) {
			array_splice( $current_list, $key, 1 );
		}

		if ( null !== $started_plugin ) {
			array_push( $current_list, $started_plugin );
		}

		$this->content['progress']['in_progress']   = $current_list;
		$this->content['progress']['plugins_left'] += $increment;
		$this->persist();
	}

	public function load_result() {
		$this->load();
		$warn_folder = dirname( dirname( __DIR__ ) ) . '/output/warnings';
		$warnings    = array_values ( array_diff( scandir( $warn_folder ), array( '.', '..' ) ) );

		$this->content['result'] = array_reduce(
			$warnings,
			function ( $acc, $file ) use ( $warn_folder ) {
				$file_data = json_decode( file_get_contents( $warn_folder . '/' . $file ) );
				$key = pathinfo($file)['filename'];
				$acc[$key] = $file_data;
				return $acc;
			},
			array()
		);
		$this->persist();
	}

	public function load() {
		if ( ! file_exists( $this->db_file ) ) {
			$this->reset();
		}
		$json          = file_get_contents( $this->db_file );
		$this->content = json_decode( $json, true );
		echo 'DEBUG OUTPUT: ';
		print_r( $json );
		echo '<br><br><br>';

		return $this->content;
	}

	public function persist( $arr = null ) {
		if ( $arr === null ) {
			$arr = $this->content;
		}
		file_put_contents( $this->db_file, json_encode( $arr ) );
	}

	public function reset() {
		$this->persist( array( 'status' => 'finished' ) );
	}
}
