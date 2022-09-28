<?php

namespace Automattic\Jetpack\Analyzer;

use Automattic\Jetpack\Analyzer\Scripts;

class PluginDownloader {
	private $type;

	public function __construct($type) {
		$this->type = $type;
		$this->output_dir = realpath( dirname( __DIR__ ) . '/../output' ) . '/';
	}

	public function get_version($version) {
		echo 'Getting plugin ' . $this->type . '::' . $version . "\n";

		$target_path = $this->get_target_path($version);
		if (file_exists($target_path)) {
			if( $version !== 'trunk' ) {
				return $target_path;
			}

			echo "Removing " . $target_path . "\n";
			Scripts::rm($target_path);
		}

		$url = $this->build_url($version);
		$file_path = $this->download_raw($url);
		$target_path = $this->unzip($file_path, $version);
		echo 'Done with plugin ' . $this->type . '::' . $version . "\n";
		return $target_path;
	}

	private function get_target_path($version) {
		$target_folder = $this->type . '__' . $version;
		return $this->output_dir . $target_folder;
	}

	private function download_raw($url) {
		$url_filename = basename( parse_url( $url, PHP_URL_PATH ) );

		$file_path = $this->output_dir . $url_filename;
		if (false === strpos($url_filename, '.zip')) {
			$file_path = $file_path  . '.zip';
		}
		$context = stream_context_create(array('http' => array(
			'header' => 'User-Agent: jp-analyzer',
		)));
		$out = file_get_contents( $url, false, $context );
		file_put_contents($file_path, $out);

		return $file_path;
	}

	private function unzip($file_path, $version) {
		$target_path = $this->get_target_path($version);
		$zip = new \ZipArchive;

		if ($zip->open($file_path) !== true) {
			throw new \Exception("Failed to open plugin's zip file " . $file_path);
		}
		for($i = 0; $i < $zip->numFiles; $i++) {
			$filename = $target_path . '/' . substr_replace($zip->getNameIndex($i), '', 0, strlen($zip->getNameIndex(0)));

			if (substr( $filename, -1 ) === '/' && !file_exists($filename)) {
					mkdir($filename);
			} else {
				copy("zip://" . $file_path . "#" . $zip->getNameIndex($i), $filename);
			}
		}
		$zip->close();
		return $target_path;
	}

	private function build_url($version) {
		if ($this->type === 'jetpack') {
		// https://api.github.com/repos/Automattic/jetpack-production/tags
		// https://betadownload.jetpack.me/data/jetpack/trunk/jetpack-dev.zip
			if ($version === 'trunk') {
				return 'https://betadownload.jetpack.me/data/jetpack/trunk/jetpack-dev.zip';
			}

			$context = stream_context_create(array('http' => array( 'header' => 'User-Agent: jp-analyzer')));
			$out = file_get_contents( 'https://api.github.com/repos/Automattic/jetpack-production/tags', false, $context );
			$json = json_decode($out);
			$version_obj = null;
			foreach ($json as $key => $obj) {
				if ($obj->name === $version) {
					$version_obj = $obj;
					break;
				}
			}

			if ($version_obj === null) {
				throw new \Exception($version . ' not found for ' . $this->type);
			}

			return $version_obj->zipball_url;
		} else {
			throw new \Exception( $this->type . ' is unsupported.');
		}
	}
}
