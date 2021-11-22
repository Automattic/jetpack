<?php
/**
 * Critical CSS content manager.
 *
 * @link       https://automattic.com
 * @since      1.3.2
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Provider;

/**
 * Class Critical_CSS_Manager.
 */
class Critical_CSS_Manager {

	/**
	 * List of all the Critical CSS Types.
	 *
	 * The order is important because searching for critical CSS will stop as soon as a value is found.
	 * So finding Critical CSS by post ID is attempted before searching for a common Singular Post critical CSS.
	 *
	 * @var Provider[]
	 */
	protected $providers;

	/**
	 * Critical CSS storage class instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	protected $storage;

	/**
	 * Variable used to cache the CSS string during the page request.
	 * This is here because `get_critical_css` is called multiple
	 * times in `style_loader_tag` hook (on each CSS file).
	 *
	 * @var null|false|string
	 */
	protected $request_cached_css;

	/**
	 * Constructor.
	 *
	 * @param Provider[] $providers List of Critical CSS Types.
	 */
	public function __construct( $providers ) {
		$this->providers = $providers;
		$this->storage   = new Critical_CSS_Storage();

		// Update ready flag used to indicate Boost optimizations are warmed up in metatag.
		add_filter( 'jetpack_boost_url_ready', array( $this, 'is_ready_filter' ), 10, 1 );
	}

	/**
	 * Get all critical CSS storage keys that are available for the current request.
	 * Caches the result.
	 *
	 * @return array
	 */
	public function get_current_request_css_keys() {
		static $keys = null;
		if ( null !== $keys ) {
			return $keys;
		}

		$keys = array();

		foreach ( $this->providers as $provider ) {
			$provider_keys = $provider::get_current_storage_keys();
			if ( empty( $provider_keys ) ) {
				continue;
			}
			$keys = array_merge( $keys, $provider_keys );
		}

		return $keys;
	}

	/**
	 * Get critical CSS for the current request.
	 *
	 * @return string|false
	 */
	public function get_critical_css() {
		if ( null !== $this->request_cached_css ) {
			return $this->request_cached_css;
		}

		$data = $this->storage->get_css( $this->get_current_request_css_keys() );
		if ( false === $data ) {
			return false;
		}

		$this->request_cached_css = $data['css'];
		return $this->request_cached_css;
	}

	/**
	 * Check if the current URL is warmed up. For this module, "warmed up" means that
	 * either Critical CSS has been generated for this page, or this page is not
	 * eligible to have Critical CSS generated for it.
	 *
	 * @param bool $ready Injected filter value.
	 *
	 * @return bool
	 */
	public function is_ready_filter( $ready ) {
		if ( ! $ready ) {
			return $ready;
		}

		// If this page has no provider keys, it is ineligible for Critical CSS.
		$keys = $this->get_current_request_css_keys();
		if ( count( $keys ) === 0 ) {
			return true;
		}

		// Return "ready" if Critical CSS has been generated.
		return ! empty( $this->get_critical_css() );
	}
}
