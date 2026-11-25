<?php
/**
 * Promos: Promo class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Represents a promotional card the dashboard offers.
 *
 * @since $$next-version$$
 */
final class Promo {

	/**
	 * Promo identifier, namespaced like `acme/offer`.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $slug;

	/**
	 * Where the promo renders.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $placement = '';

	/**
	 * Sort order.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	public $order = 10;

	/**
	 * Card title.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $title = '';

	/**
	 * Card description.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $description = '';

	/**
	 * Call-to-action label.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $cta_label = '';

	/**
	 * Call-to-action URL.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $cta_url = '';

	/**
	 * Whether the user may dismiss the promo.
	 *
	 * @since $$next-version$$
	 * @var bool
	 */
	public $dismissible = true;

	/**
	 * Days a dismissal lasts before the promo returns.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	public $snooze_days = 90;

	/**
	 * Capability a user needs to be offered the promo. The Stats roles setting can let an editor or
	 * an author open the dashboard, and an upgrade is not theirs to buy.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $capability = 'manage_options';

	/**
	 * Availability flag or callback; null when the registration declared none.
	 *
	 * @var bool|callable|null
	 */
	private $is_available = null;

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier.
	 * @param array  $args Optional. Promo arguments.
	 */
	public function __construct( $slug, $args = array() ) {
		$this->slug = $slug;

		$this->set_props( $args );
	}

	/**
	 * Returns whether this promo should be shown. A promo with no rule is not.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public function is_available() {
		if ( null === $this->is_available ) {
			return false;
		}

		if ( is_bool( $this->is_available ) ) {
			return $this->is_available;
		}

		return is_callable( $this->is_available )
			? (bool) call_user_func( $this->is_available, $this )
			: false;
	}

	/**
	 * Returns the representation sent to the browser.
	 *
	 * @since $$next-version$$
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'slug'        => $this->slug,
			'placement'   => $this->placement,
			'order'       => (int) $this->order,
			'title'       => $this->title,
			'description' => $this->description,
			'cta_label'   => $this->cta_label,
			'cta_url'     => $this->cta_url,
			'dismissible' => $this->dismissible,
			'snooze_days' => $this->snooze_days,
		);
	}

	/**
	 * Hydrates promo properties from the args array.
	 *
	 * @param array $args Promo arguments.
	 * @return void
	 */
	private function set_props( $args ) {
		if ( ! is_array( $args ) ) {
			return;
		}

		if ( isset( $args['placement'] ) ) {
			$this->placement = (string) $args['placement'];
		}

		if ( isset( $args['order'] ) ) {
			$this->order = (int) $args['order'];
		}

		// Trimmed: whitespace alone would satisfy the required-field checks and render as an empty card.
		if ( isset( $args['title'] ) ) {
			$this->title = trim( (string) $args['title'] );
		}

		if ( isset( $args['description'] ) ) {
			$this->description = trim( (string) $args['description'] );
		}

		if ( isset( $args['cta_label'] ) ) {
			$this->cta_label = trim( (string) $args['cta_label'] );
		}

		if ( isset( $args['cta_url'] ) ) {
			$this->cta_url = trim( (string) $args['cta_url'] );
		}

		if ( isset( $args['dismissible'] ) ) {
			$this->dismissible = (bool) $args['dismissible'];
		}

		if ( isset( $args['snooze_days'] ) ) {
			$this->snooze_days = (int) $args['snooze_days'];
		}

		if ( isset( $args['capability'] ) ) {
			$this->capability = trim( (string) $args['capability'] );
		}

		if ( array_key_exists( 'is_available', $args ) ) {
			$this->is_available = $args['is_available'];
		}
	}
}
