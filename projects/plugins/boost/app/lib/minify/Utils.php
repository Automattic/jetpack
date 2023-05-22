<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

class Utils {

	private $use_wp;
	private $fs;

	public function __construct( $use_wp = true ) {
		$this->use_wp = $use_wp;

		$this->init_fs();
	}

	public function init_fs() {
		if ( ! $this->use_wp ) {
			return;
		}

		// Todo: check if falsy?
		$this->fs = jetpack_boost_init_filesystem();
	}

	public function json_encode( $value ) {
		if ( $this->use_wp ) {
			return wp_json_encode( $value );
		}

		return json_encode( $value );
	}

	public function unslash( $value ) {
		if ( $this->use_wp ) {
			return wp_unslash( $value );
		}

		return is_string( $value ) ? stripslashes( $value ) : $value;
	}

	public function parse_url( $url, $component = -1 ) {
		if ( $this->use_wp ) {
			return wp_parse_url( $url, $component );
		}

		return parse_url( $url, $component );
	}

	public function mkdir( $path, $mode, $recursive ) {
		if ( $this->use_wp ) {
			return $this->fs->mkdir( $path, $mode, $recursive );
		}

		return mkdir( $path, $mode, $recursive );
	}

	public function is_writable( $path ) {
		if ( $this->use_wp ) {
			return $this->fs->is_writable( $path );
		}

		return is_writable( $path );
	}

	public function get_contents( $path ) {
		if ( $this->use_wp ) {
			return $this->fs->get_contents( $path );
		}

		return file_get_contents( $path );
	}

	public function put_contents( $path, $content ) {
		if ( $this->use_wp ) {
			return $this->fs->put_contents( $path, $content );
		}

		return file_put_contents( $path, $content );
	}
}
