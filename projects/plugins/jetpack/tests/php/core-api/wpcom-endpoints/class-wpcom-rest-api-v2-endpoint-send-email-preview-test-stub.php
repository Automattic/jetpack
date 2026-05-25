<?php
/**
 * Test-only subclass that exposes protected methods and stubs outbound HTTP
 * for the Send_Email_Preview endpoint.
 *
 * @package automattic/jetpack
 */

/**
 * Test-only subclass that exposes protected methods and stubs outbound HTTP.
 */
class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub extends WPCOM_REST_API_V2_Endpoint_Send_Email_Preview {

	/**
	 * Fake Akismet response to return from akismet_http_post(), shape [ headers, body ].
	 *
	 * @var array|null
	 */
	public $mock_akismet_response = null;

	/**
	 * Whether to pretend Akismet is available.
	 *
	 * @var bool
	 */
	public $mock_akismet_available = true;

	/**
	 * Last query_string passed to the stubbed akismet_http_post(), for test inspection.
	 *
	 * @var string|null
	 */
	public $last_query_string = null;

	/**
	 * Expose the protected payload builder for direct test access.
	 *
	 * @param WP_Post $post Post being previewed.
	 * @return array
	 */
	public function prepare_post_for_akismet_public( WP_Post $post ): array {
		return $this->prepare_post_for_akismet( $post );
	}

	/**
	 * Expose the protected spam check for direct test access.
	 *
	 * @param WP_Post $post Post being previewed.
	 * @return bool
	 */
	public function check_post_for_spam_public( WP_Post $post ): bool {
		return $this->check_post_for_spam( $post );
	}

	/**
	 * Override availability so tests control the fail-open path.
	 *
	 * @return bool
	 */
	protected function is_akismet_available(): bool {
		return $this->mock_akismet_available;
	}

	/**
	 * Override the outbound call and return the test-supplied response.
	 *
	 * @param string $query_string URL-encoded payload.
	 * @return array
	 */
	protected function akismet_http_post( string $query_string ): array {
		$this->last_query_string = $query_string;
		return $this->mock_akismet_response ?? array( array(), '' );
	}
}
