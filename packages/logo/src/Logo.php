<?php
namespace Jetpack\Assets;

class Logo {
	public function get_image_url() {
		return plugins_url( 'assets/logo.svg', __DIR__ );
	}

	public function get_image() {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			esc_url( $this->get_image_url() ),
			esc_attr__(
				'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
				'jetpack'
			)
		);
	}

	public static function render() {
		$logo = new self();
		return $logo->get_image();
	}
}
