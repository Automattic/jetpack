<?php
/**
 * Represents a request to generate a pair of WooAds campaigns.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/wooads
 */

namespace Automattic\WooAds;

use Automattic\WooAds\Lib\Utils;

/**
 * Class WooAds_Campaigns
 */
class WooAds_Campaigns {

	/**
	 * Active Jetpack Boost modules.
	 *
	 * @var array Active modules.
	 */
	private $campaigns;

	/**
	 * Constructor.
	 *
	 * @param array $campaigns WooAds Campaigns.
	 */
	public function __construct( $campaigns = array() ) {
		$this->campaigns = $campaigns;
	}

	/**
	 * Send a Campaigns request to the API.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function handle_get_campaigns() {
		$blog_id  = (int) \Jetpack_Options::get_option( 'id' );
		$response = Utils::send_wpcom_request(
			'GET',
			sprintf( '/sites/%d/wordads-dsp/campaigns', $blog_id )
		);

		if ( is_wp_error( $response ) ) {
			$this->status = 'error';
			$this->error  = $response->get_error_message();
		}

		return $response;
	}

	/**
	 * Returns a Campaign stub
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function handle_get_campaigns_stub() {
		$stub_campaigns = array(
			array(
				'startDate'         => 1644507492000,
				'endDate'           => 1654875492000,
				'impressions'       => 243,
				'targetImpressions' => 700,
				'autoRenew'         => true,
				'earned'            => 18.73,
				'status'            => 'active',
			),
			array(
				'startDate'         => 1662824292000,
				'endDate'           => 1670686692000,
				'impressions'       => 0,
				'targetImpressions' => 0,
				'autoRenew'         => false,
				'earned'            => 0,
				'status'            => 'scheduled',
			),
			array(
				'startDate'         => 1644507492000,
				'endDate'           => 1655875492000,
				'impressions'       => 6752,
				'targetImpressions' => 7000,
				'autoRenew'         => false,
				'earned'            => 252.23,
				'status'            => 'expired',
			),

		);
		return $stub_campaigns;
	}

	/**
	 * Check if the blog is opted in WooAds
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function handle_blog_opted_in() {
		$blog_id  = (int) \Jetpack_Options::get_option( 'id' );
		$response = Utils::send_wpcom_request(
			'GET',
			sprintf( '/sites/%d/wordads-dsp/opted', $blog_id )
		);

		if ( is_wp_error( $response ) ) {
			$this->status = 'error';
			$this->error  = $response->get_error_message();
		}

		return $response;
	}

	/**
	 * Check if the blog is opted in WooAds // Stub function
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function handle_blog_opted_in_stub() {
		return true;
	}

	/**
	 * Did the request fail?
	 */
	public function is_error() {
		return 'error' === $this->status;
	}

	/**
	 * Did the request succeed?
	 */
	public function is_success() {
		return 'success' === $this->status;
	}

	/**
	 * Sets the WooCommerce campaigns
	 *
	 * @param \WP_Error $response the response obtained when fetching  the campaigns.
	 * @return void
	 */
	private function set_campaigns( $response ) {
		$campaigns = $response;
	}

}
