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

	public static function init( $lcp_data ) {
		if ( LCP_Optimization_Util::should_skip_optimization() ) {
			return;
		}

		if ( empty( $lcp_data ) ) {
			return;
		}

		$instance = new self( $lcp_data );

		// Preload the background image as early as possible.
		add_action( 'wp_head', array( $instance, 'preload_background_images' ), 1 );

		// Add the background image styling as late as possible.
		add_action( 'wp_body_open', array( $instance, 'add_bg_style_override' ), 999999 );
	}

	public function __construct( $lcp_data ) {
		$this->lcp_data = $lcp_data;
	}

	public function preload_background_images() {
		$selectors = array();

		foreach ( $this->lcp_data as $lcp_data ) {
			$lcp_optimizer = new LCP_Optimization_Util( $lcp_data );
			if ( ! $lcp_optimizer->can_optimize() ) {
				continue;
			}

			if ( in_array( $lcp_data['selector'], $selectors, true ) ) {
				// If we already printed the styling for this element, skip it.
				continue;
			}
			$selectors[] = $lcp_data['selector'];

			$responsive_image_rules = $this->get_responsive_image_rules( $lcp_data );
			$this->print_preload_links( $responsive_image_rules );
		}
	}

	private function print_preload_links( $responsive_image_rules ) {
		foreach ( $responsive_image_rules as $breakpoint ) {
			$image_set = array();
			foreach ( $breakpoint['image_set'] as $image ) {
				$image_set[] = sprintf( '%s %sx', $image['url'], $image['dpr'] );
			}

			$image_set_string = implode( ', ', $image_set );

			printf(
				'<link rel="preload" href="%s" as="image" fetchpriority="high" media="%s" imagesrcset="%s" />' . PHP_EOL,
				esc_url( Image_CDN_Core::cdn_url( $breakpoint['base_image'] ) ),
				esc_attr( $breakpoint['media_query'] ),
				esc_attr( $image_set_string )
			);
		}
	}

	public function add_bg_style_override() {
		$selectors = array();

		foreach ( $this->lcp_data as $lcp_data ) {
			$lcp_optimizer = new LCP_Optimization_Util( $lcp_data );
			if ( ! $lcp_optimizer->can_optimize() ) {
				continue;
			}

			if ( in_array( $lcp_data['selector'], $selectors, true ) ) {
				// If we already printed the styling for this element, skip it.
				continue;
			}
			$selectors[] = $lcp_data['selector'];

			$image_url = $lcp_optimizer->get_lcp_image_url();
			if ( empty( $image_url ) ) {
				continue;
			}

			$styles                 = array();
			$responsive_image_rules = $this->get_responsive_image_rules( $lcp_data );

			// Add responsive image styling.
			foreach ( $responsive_image_rules as $breakpoint ) {
				$image_set = array();
				foreach ( $breakpoint['image_set'] as $image ) {
					$image_set[] = sprintf( 'url(%s) %sx', $image['url'], $image['dpr'] );
				}

				$image_set_string = implode( ', ', $image_set );

				$styles[] = sprintf(
					'@media %1$s { %2$s { background-image: url(%3$s) !important; background-image: -webkit-image-set(%4$s) !important; background-image: image-set(%4$s) !important; } }',
					$breakpoint['media_query'],
					$lcp_data['selector'],
					$breakpoint['base_image'],
					$image_set_string
				);
			}

			$bg_styling = PHP_EOL . '<style id="jetpack-boost-lcp-background-image">' . PHP_EOL;
			// Ensure no </style> tag (or any HTML tags) in output.
			$bg_styling .= wp_strip_all_tags( implode( PHP_EOL, $styles ) ) . PHP_EOL;
			$bg_styling .= '</style>' . PHP_EOL;

			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $bg_styling;
		}
	}

	private function get_responsive_image_rules( $lcp_data ) {
		if ( $lcp_data['type'] !== LCP::TYPE_BACKGROUND_IMAGE || empty( $lcp_data['breakpoints'] ) ) {
			return array();
		}

		$lcp_optimizer = new LCP_Optimization_Util( $lcp_data );
		$image_url     = $lcp_optimizer->get_lcp_image_url();

		if ( empty( $image_url ) ) {
			return array();
		}

		$styles = array();
		// Reverse the array to go from smallest to largest.
		foreach ( array_reverse( $lcp_data['breakpoints'] ) as $breakpoint ) {
			if ( empty( $breakpoint ) ) {
				continue;
			}
			if ( ! isset( $breakpoint['widthValue'] ) ) {
				continue;
			}

			// The Cloud should always return a fixed pixel width for background images, so catering for that is easy peasy.
			if ( empty( $breakpoint['imageDimensions'] ) || ! is_array( $breakpoint['imageDimensions'] ) ) {
				continue;
			}

			$image_dimensions = $breakpoint['imageDimensions'][0];

			if ( ! isset( $image_dimensions['width'] ) || ! is_numeric( $image_dimensions['width'] ) ) {
				continue;
			}

			if ( ! isset( $image_dimensions['height'] ) || ! is_numeric( $image_dimensions['height'] ) ) {
				continue;
			}

			// The width and height should already be an integer, but just in case.
			$image_width  = (int) $image_dimensions['width'];
			$image_height = (int) $image_dimensions['height'];

			$media_query = array();
			if ( isset( $breakpoint['minWidth'] ) ) {
				$media_query[] = sprintf( '(min-width: %spx)', $breakpoint['minWidth'] );
			}
			if ( isset( $breakpoint['maxWidth'] ) ) {
				$media_query[] = sprintf( '(max-width: %spx)', $breakpoint['maxWidth'] );
			}

			$styles[] = array(
				'media_query' => empty( $media_query ) ? 'all' : implode( ' and ', $media_query ),
				'image_set'   => $this->get_image_set( $image_url, $image_width, $image_height ),
				'base_image'  => Image_CDN_Core::cdn_url(
					$image_url,
					array(
						'resize' => array( $image_width, $image_height ),
					)
				),
			);
		}
		return $styles;
	}

	private function get_image_set( $url, $width, $height ) {
		$dprs = array( 1, 2 );

		// Mobile devices usually have a DPR of 3 which is not common for desktop.
		if ( $width <= 480 ) {
			$dprs[] = 3;
		}

		// Accurately reflect the performance improvement in lighthouse by including a 1.75x DPR image for the Moto G Power.
		if ( $width === 412 ) {
			$dprs[] = 1.75;
		}

		$image_set = array();
		foreach ( $dprs as $dpr ) {
			$image_set[] = array(
				'url' => Image_CDN_Core::cdn_url(
					$url,
					array(
						'resize' => array( $width * $dpr, $height * $dpr ),
					)
				),
				'dpr' => $dpr,
			);
		}
		return $image_set;
	}
}
