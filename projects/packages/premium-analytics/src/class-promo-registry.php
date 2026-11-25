<?php
/**
 * Promos: Promo_Registry class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Stores Promo instances keyed by slug.
 *
 * @since $$next-version$$
 */
final class Promo_Registry {

	/**
	 * Placements a promo may render in.
	 *
	 * @since $$next-version$$
	 * @var string[]
	 */
	const PLACEMENTS = array( 'options-menu', 'settings' );

	/**
	 * Registered promos, as `$slug => $promo` pairs.
	 *
	 * @var array<string, Promo>
	 */
	private $registered_promos = array();

	/**
	 * The gated promos for this request, or null before anything has asked for them.
	 *
	 * @var Promo[]|null
	 */
	private $available_promos = null;

	/**
	 * Container for the main instance of the class.
	 *
	 * @var Promo_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers a promo.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier, namespaced like `acme/offer`.
	 * @param array  $args Optional. Promo arguments.
	 * @return Promo|false The registered promo on success, or false on failure.
	 */
	public function register( $slug, $args = array() ) {
		if ( $this->is_registered( $slug ) ) {
			/* translators: %s: Promo slug. */
			return $this->refuse( sprintf( __( 'Promo "%s" is already registered.', 'jetpack-premium-analytics-pkg' ), $slug ) );
		}

		$promo    = new Promo( $slug, is_array( $args ) ? $args : array() );
		$required = self::required_fields()[ $promo->placement ] ?? null;

		if ( null === $required ) {
			/* translators: %s: Comma-separated list of placements. */
			return $this->refuse( sprintf( __( 'A promo placement must be one of: %s.', 'jetpack-premium-analytics-pkg' ), implode( ', ', self::PLACEMENTS ) ) );
		}

		foreach ( $required as $field => $message ) {
			if ( '' === $promo->$field ) {
				return $this->refuse( $message );
			}
		}

		// The client links through `safeHttpUrl`, which allows http(s) only. A menu promo it rejects
		// renders as nothing while still taking the one item the menu offers, hiding any other.
		if ( '' !== $promo->cta_label && ! $this->is_linkable( $promo->cta_url ) ) {
			return $this->refuse( __( 'A promo cta_url must be an http or https URL.', 'jetpack-premium-analytics-pkg' ) );
		}

		$this->registered_promos[ $slug ] = $promo;

		return $promo;
	}

	/**
	 * Runs the gates once and answers from that result for the rest of the request. A promo's
	 * `is_available` rule may be expensive, and both the script data and the menu ask.
	 *
	 * @internal
	 *
	 * @since $$next-version$$
	 *
	 * @param callable $compute Applies the gates to the registered promos.
	 * @return Promo[] The gated promos.
	 */
	public function remember_available( callable $compute ) {
		if ( null === $this->available_promos ) {
			$this->available_promos = $compute();
		}

		return $this->available_promos;
	}

	/**
	 * Retrieves all registered promos.
	 *
	 * @since $$next-version$$
	 *
	 * @return Promo[] Map of `$slug => $promo` pairs.
	 */
	public function get_all_registered() {
		return $this->registered_promos;
	}

	/**
	 * Checks if a promo is registered.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier.
	 * @return bool True if registered.
	 */
	public function is_registered( $slug ) {
		return isset( $this->registered_promos[ $slug ] );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * @since $$next-version$$
	 *
	 * @return Promo_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * The copy each placement cannot render without, with the reason. Keyed by `PLACEMENTS`.
	 *
	 * @return array<string, array<string, string>> Required fields per placement.
	 */
	private static function required_fields() {
		return array(
			'options-menu' => array(
				'cta_label' => __( 'An options-menu promo needs a cta_label. The label is the menu item.', 'jetpack-premium-analytics-pkg' ),
			),
			'settings'     => array(
				'title' => __( 'A promo card needs a title. The card is labelled by it.', 'jetpack-premium-analytics-pkg' ),
			),
		);
	}

	/**
	 * Whether a CTA URL is one the dashboard will link to.
	 *
	 * @param string $url The CTA URL.
	 * @return bool
	 */
	private function is_linkable( $url ) {
		$scheme = wp_parse_url( $url, PHP_URL_SCHEME );

		return is_string( $scheme ) && in_array( strtolower( $scheme ), array( 'http', 'https' ), true );
	}

	/**
	 * Reports a refused registration.
	 *
	 * @param string $message Reason, unescaped.
	 * @return false
	 */
	private function refuse( $message ) {
		// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
		_doing_it_wrong( __CLASS__ . '::register', esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
		return false;
	}
}
