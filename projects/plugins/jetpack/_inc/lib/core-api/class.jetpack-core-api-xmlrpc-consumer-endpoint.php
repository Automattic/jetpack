<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This is the base class for every Core API endpoint that needs an XMLRPC client.
 *
 * @package automattic/jetpack
 */

/**
 * Base class for every Core API endpoint that needs an XMLRPC client.
 */
abstract class Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * An instance of the Jetpack XMLRPC client to make WordPress.com requests
	 *
	 * @private
	 * @var Jetpack_IXR_Client
	 */
	protected $xmlrpc;

	/**
	 * Constructor.
	 *
	 * @since 4.3.0
	 *
	 * @param Jetpack_IXR_Client $xmlrpc Jetpack_IXR_Client instance.
	 */
	public function __construct( $xmlrpc = null ) {
		$this->xmlrpc = $xmlrpc;
	}

	/**
	 * Checks if the site is public and returns the result.
	 *
	 * @since 4.3.0
	 *
	 * @return Boolean $is_public
	 */
	protected function is_site_public() {
		if ( $this->xmlrpc->query( 'jetpack.isSitePubliclyAccessible', home_url() ) ) {
			return $this->xmlrpc->getResponse();
		}
		return false;
	}
}
