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
		add_action( 'wp_body_open', array( $instance, 'add_bg_style_override' ), 999999 );
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
					'@media %s { %s { background-image: url(%s) !important; background-image: -webkit-image-set(%s) !important; background-image: image-set(%s) !important; } }',
					$breakpoint['media_query'],
					$lcp_data['element'],
					$breakpoint['base_image'],
					$image_set_string,
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
		if ( empty( $lcp_data['breakpoints'] ) ) {
			return array();
		}

		$lcp_optimizer = new LCP_Optimizer( $lcp_data );
		$image_url     = $lcp_optimizer->get_image_to_preload();

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

			// If it's a fixed pixel width for this breakpoint, easy peasy.
			if ( 'px' === substr( $breakpoint['widthValue'], -2 ) ) {
				if ( ! isset( $breakpoint['imageWidths'][0] ) ) {
					continue;
				}

				$image_width = $breakpoint['imageWidths'][0];

				$media_query = array();
				if ( isset( $breakpoint['minWidth'] ) ) {
					$media_query[] = sprintf( '(min-width: %spx)', $breakpoint['minWidth'] );
				}
				if ( isset( $breakpoint['maxWidth'] ) ) {
					$media_query[] = sprintf( '(max-width: %spx)', $breakpoint['maxWidth'] );
				}

				$styles[] = array(
					'media_query' => implode( ' and ', $media_query ),
					'image_set'   => $this->get_image_set( $image_url, $image_width ),
					'base_image'  => Image_CDN_Core::cdn_url( $image_url, array( 'w' => $image_width ) ),
				);
			} else {
				// If it's relative to the vw, i.e. widthValue is 100vw, then we need to sub-divide the breakpoint into smaller chunks for background-image.
				$min_width = $breakpoint['minWidth'] ?? null;
				foreach ( $breakpoint['imageWidths'] as $image_width ) {

					$media_query = array();
					if ( $min_width ) {
						$media_query[] = sprintf( '(min-width: %spx)', $min_width );
					}
					if ( $image_width ) {
						$media_query[] = sprintf( '(max-width: %spx)', $image_width );
					}

					$styles[] = array(
						'media_query' => implode( ' and ', $media_query ),
						'image_set'   => $this->get_image_set( $image_url, $image_width ),
						'base_image'  => Image_CDN_Core::cdn_url( $image_url, array( 'w' => $image_width ) ),
					);

					$min_width = $image_width + 1;
				}
			}
		}
		return $styles;
	}

	private function get_image_set( $image_url, $image_width ) {
		$dprs = array( 1, 2 );

		// Mobile devices usually have a DPR of 3 which is not common for desktop.
		if ( $image_width <= 480 ) {
			$dprs[] = 3;
		}

		// Accurately reflect the performance improvement in lighthouse by including a 1.75x DPR image for the Moto G Power.
		if ( $image_width === 412 ) {
			$dprs[] = 1.75;
		}

		$image_set = array();
		foreach ( $dprs as $dpr ) {
			$image_set[] = array(
				'url' => Image_CDN_Core::cdn_url( $image_url, array( 'w' => $image_width * $dpr ) ),
				'dpr' => $dpr,
			);
		}
		return $image_set;
	}
}
