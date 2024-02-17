<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis_Fixer;

class Image_Size_Analysis_Entry implements Lazy_Entry, Entry_Can_Get {

	public function get( $page = 1, $group = 'all' ) {
		$report_id = defined( 'JETPACK_BOOST_FORCE_REPORT_ID' ) ? JETPACK_BOOST_FORCE_REPORT_ID : 'latest';
		$data      = Boost_API::get(
			'image-guide/reports/' . $report_id . '/issues',
			array(
				'page'     => $page,
				'group'    => sanitize_title( wp_unslash( $group ) ),
				'per_page' => 20,
			)
		);

		$issues = array();
		foreach ( $data['issues'] as $issue ) {
			$page_provider = $this->get_page( $issue );
			$image         = $this->get_image_info( $issue );
			if ( empty( $page_provider['edit_url'] ) ) { // archive or front page
				$image['fixed'] = false;
			} else {
				$post_id        = Image_Size_Analysis_Fixer::get_post_id( $page_provider['edit_url'] );
				$image['fixed'] = Image_Size_Analysis_Fixer::is_fixed( $post_id, $image['url'] );
			}

			$issues[] = array(
				'id'           => $issue['id'],
				'thumbnail'    => $issue['url'],
				'device_type'  => $issue['device'],
				'type'         => $issue['type'],
				'status'       => $issue['status'],
				'instructions' => $this->get_instructions( $issue ),
				'page'         => $page_provider,
				'image'        => $image,
			);
		}

		return array(
			'last_updated' => strtotime( $data['last_updated'] ) * 1000,
			'total_pages'  => $data['pagination']['total_pages'],
			'images'       => $issues,
		);
	}

	/**
	 * Get the page info for a given key
	 *
	 * @todo: Implement
	 */
	private function get_page( $issue ) {
		$key      = $issue['page_provider'];
		$provider = $this->get_provider( $key );
		$title    = empty( $provider ) ? $key : $provider::describe_key( $key );
		$edit_url = empty( $provider ) ? null : $provider::get_edit_url( $key );

		if ( empty( $title ) ) {
			$title = $issue['page_provider'];
		}

		return array(
			'id'       => $issue['page_id'],
			'url'      => $issue['page_url'],
			'edit_url' => $edit_url ? $edit_url : null,
			'title'    => $title,
		);
	}

	/**
	 * Generate instructions for an issue.
	 */
	private function get_instructions( $_issue ) {
		return __( 'Resize the image to the expected dimensions and compress it.', 'jetpack-boost' );
	}

	/**
	 * Get the image info for a given issue
	 *
	 * @todo: Implement
	 */
	private function get_image_info( $issue ) {
		return array(
			'url'        => $issue['url'],
			'dimensions' => array(
				'file'           => array(
					'width'  => $issue['meta']['fileSize_width'],
					'height' => $issue['meta']['fileSize_height'],
				),
				'expected'       => array(
					'width'  => $issue['meta']['expectedSize_width'],
					'height' => $issue['meta']['expectedSize_height'],
				),
				'size_on_screen' => array(
					'width'  => $issue['meta']['sizeOnPage_width'],
					'height' => $issue['meta']['sizeOnPage_height'],
				),
			),
			'weight'     => array(
				'current'   => $issue['meta']['fileSize_weight'],
				'potential' => (int) $issue['meta']['potentialSavings'],
			),
		);
	}

	/**
	 * Get a provider for a given key.
	 */
	private function get_provider( $key ) {
		static $providers = null;
		if ( null === $providers ) {
			$providers = new Source_Providers();
		}

		return $providers->get_provider_for_key( $key );
	}
}
