<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

class LCP_Optimize_Bg_Image {
	/**
	 * The LCP data for optimizing the current page.
	 *
	 * @var array
	 */
	private $lcp_data;

	public static function init() {
		if ( LCP_Optimizer::should_skip_optimization() ) {
			return;
		}

		$storage  = new LCP_Storage();
		$lcp_data = $storage->get_current_request_lcp();

		if ( empty( $lcp_data ) ) {
			return;
		}

		$instance = new self( $lcp_data );

		// Preload the background image as early as possible.
		add_action( 'wp_head', array( $instance, 'preload_background_images' ), 1 );

		// Add the background image styling as late as possible.
		add_action( 'wp_print_styles', array( $instance, 'add_bg_style_override' ), 999999 );
	}

	public function __construct( $lcp_data ) {
		$this->lcp_data = $lcp_data;
	}

	public function preload_background_images() {
		$selectors = array();

		foreach ( $this->lcp_data as $lcp_data ) {
			if ( in_array( $lcp_data['element'], $selectors, true ) ) {
				// If we already printed the styling for this element, skip it.
				continue;
			}
			$selectors[] = $lcp_data['element'];

			$lcp_optimizer = new LCP_Optimizer( $lcp_data );
			$image_url     = $lcp_optimizer->get_image_to_preload();
			if ( empty( $image_url ) ) {
				continue;
			}

			printf(
				'<link rel="preload" href="%s" as="image" fetchpriority="high" imagesrcset="%s" imagesizes="%s" />' . "\n",
				esc_url( Image_CDN_Core::cdn_url( $image_url ) ),
				esc_attr( $lcp_optimizer->get_srcsets( $image_url ) ),
				esc_attr( $lcp_optimizer->get_sizes() )
			);
		}
	}

	public function add_bg_style_override() {
		$selectors = array();

		foreach ( $this->lcp_data as $lcp_data ) {
			if ( in_array( $lcp_data['element'], $selectors, true ) ) {
				// If we already printed the styling for this element, skip it.
				continue;
			}
			$selectors[] = $lcp_data['element'];

			$lcp_optimizer = new LCP_Optimizer( $lcp_data );
			$image_url     = $lcp_optimizer->get_image_to_preload();
			if ( empty( $image_url ) ) {
				continue;
			}

			$image_css = sprintf(
				'%s { background-image: url(%s) !important; }',
				$lcp_data['element'],
				esc_url( Image_CDN_Core::cdn_url( $image_url ) )
			);

			$bg_styling = PHP_EOL . '<style id="jetpack-boost-lcp-background-image">' . PHP_EOL;
			// Ensure no </style> tag (or any HTML tags) in output.
			$bg_styling .= wp_strip_all_tags( $image_css ) . PHP_EOL;
			$bg_styling .= wp_strip_all_tags( implode( PHP_EOL, $lcp_optimizer->get_bg_styling( $lcp_data['element'], $image_url ) ) ) . PHP_EOL;
			$bg_styling .= '</style>' . PHP_EOL;

			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $bg_styling;
		}
	}
}
