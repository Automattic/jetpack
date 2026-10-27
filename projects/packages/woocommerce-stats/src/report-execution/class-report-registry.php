<?php
/**
 * Report definitions with the providers that can serve them.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Resolves a route to its report definition and each provider's capability for it.
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
	 * @param Report_Provider[] $providers The providers to ask for capabilities.
	 */
	public function __construct( array $providers ) {
		foreach ( $providers as $provider ) {
			$this->providers[ $provider->get_name() ] = $provider;
		}
	}

	/**
	 * The definition a route resolves to, with the capability of each provider that serves it.
	 *
	 * @param string $route Report route.
	 * @return array|null The definition plus `capabilities` (by provider name), or null for an unknown route.
	 */
	public function get_definition( $route ) {
		$definition = Report_Definitions::for_route( $route );
		if ( null === $definition ) {
			return null;
		}

		$definition['capabilities'] = array();
		foreach ( $this->providers as $name => $provider ) {
			$capability = $provider->get_capability( $definition['id'] );
			if ( null !== $capability ) {
				$definition['capabilities'][ $name ] = $capability;
			}
		}

		return $definition;
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
