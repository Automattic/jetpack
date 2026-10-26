<?php
/**
 * Report definitions, collected from what each provider declares.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Maps a report route to the providers that declare it.
 *
 * @since $$next-version$$
 */
class Report_Registry {

	/**
	 * Providers, by name.
	 *
	 * @var Report_Provider[]
	 */
	private $providers = array();

	/**
	 * Constructor.
	 *
	 * @param Report_Provider[] $providers The providers to collect declarations from.
	 */
	public function __construct( array $providers ) {
		foreach ( $providers as $provider ) {
			$this->providers[ $provider->get_name() ] = $provider;
		}
	}

	/**
	 * The definition of a route.
	 *
	 * @param string $route Report route.
	 * @return array|null `route` and `providers` (names), or null when no provider declares it.
	 */
	public function get_definition( $route ) {
		$names = array();
		foreach ( $this->providers as $name => $provider ) {
			if ( $provider->supports( $route ) ) {
				$names[] = $name;
			}
		}

		return $names ? array(
			'route'     => $route,
			'providers' => $names,
		) : null;
	}

	/**
	 * A provider by name.
	 *
	 * @param string $name Provider name.
	 * @return Report_Provider|null
	 */
	public function get_provider( $name ) {
		return $this->providers[ $name ] ?? null;
	}
}
