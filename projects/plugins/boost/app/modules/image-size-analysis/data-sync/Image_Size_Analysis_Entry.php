<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;

require_once dirname( __DIR__ ) . '/jetpack-boost-mock-api.php';

class Image_Size_Analysis_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {

	private $page         = 1;
	private $group        = 'all';
	private $search_query = '';

	public function get() {
		$data = Boost_API::get(
			'image-guide/reports/latest/issues',
			array(
				'page'     => $this->page,
				'per_page' => 20,
			)
		);

		$issues = array();
		foreach ( $data->issues as $issue ) {
			$issues[] = array(
				'id'           => $issue->id,
				'thumbnail'    => $issue->url,
				'device_type'  => $issue->device,
				'status'       => $issue->status,
				'instructions' => $this->get_instructions( $issue ),
				'edit_url'     => $this->get_edit_url( $issue->page_provider ),
				'page'         => $this->get_page( $issue->page_provider ),
				'image'        => $this->get_image_info( $issue ),
			);
		}

		$results = array(
			'query' => array(
				'page'   => $this->page,
				'group'  => $this->group,
				'search' => $this->search_query,
			),
			'data'  => array(
				'last_updated' => 1682419855474, // @todo: Update
				'total_pages'  => $data->pagination->total_pages,
				'images'       => $issues,
			),
		);

		// Visual indication that groups are working
		if ( $this->group !== 'all' ) {
			shuffle( $results['data']['images'] );
		}
		return $results;
	}

	/**
	 * Get the edit url for a given key
	 *
	 * @todo: Implement
	 */
	private function get_edit_url( $key ) {
		return 'https://boost.in.ngrok.io/wp-admin/post.php?post=' . $key . '&action=edit';
	}

	/**
	 * Get the page info for a given key
	 *
	 * @todo: Implement
	 */
	private function get_page( $key ) {
		return array(
			'id'    => 134,
			'url'   => 'https://boost.in.ngrok.io?p=134',
			'title' => 'Et atque molestias quisquam.',
		);
	}

	/**
	 * Generate instructions for an issue.
	 */
	private function get_instructions( $issue ) {
		return __( 'Resize the image to the expected dimensions and compress it.', 'jetpack-boost' );
	}

	/**
	 * Get the image info for a given issue
	 *
	 * @todo: Implement
	 */
	private function get_image_info( $issue ) {
		return array(
			'url'        => $issue->url,
			'dimensions' => array(
				'file'           => array(
					'width'  => $issue->meta->fileSize_width,
					'height' => $issue->meta->fileSize_height,
				),
				'expected'       => array(
					'width'  => $issue->meta->expectedSize_width,
					'height' => $issue->meta->expectedSize_height,
				),
				'size_on_screen' => array(
					'width'  => $issue->meta->sizeOnPage_width,
					'height' => $issue->meta->sizeOnPage_height,
				),
			),
			'weight'     => array(
				'current'   => $issue->meta->fileSize_weight,
				'potential' => $issue->meta->fileSize_weight,
			),
		);
	}

	public function set( $value ) {
		$this->page         = $value['query']['page'];
		$this->group        = $value['query']['group'];
		$this->search_query = $value['query']['search'];
	}
}


