<?php
/**
 * Immutable value object describing a single feature.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

use InvalidArgumentException;

/**
 * A declared feature. Pure data — no side effects, no platform logic.
 */
class Feature {

	const CONNECTION_LEVELS = array( 'none', 'site', 'user' );

	/**
	 * Unique feature slug.
	 *
	 * @var string
	 */
	private $slug;

	/**
	 * Feature metadata.
	 *
	 * @var array
	 */
	private $args;

	/**
	 * Create a new Feature instance.
	 *
	 * @param string $slug Unique feature slug.
	 * @param array  $args Feature metadata.
	 *
	 * @throws InvalidArgumentException If slug is empty or connection level is invalid.
	 */
	public function __construct( $slug, array $args = array() ) {
		if ( ! is_string( $slug ) || '' === $slug ) {
			throw new InvalidArgumentException( 'Feature slug must be a non-empty string.' );
		}
		$defaults = array(
			'title'           => '',
			'description'     => '',
			'category'        => '',
			'docs'            => array(),
			'entitlement'     => null,
			'connection'      => 'none',
			'module'          => null,
			'available_since' => array(),
			'recommend'       => array(),
			'is_active'       => null,
			'is_applicable'   => null,
		);
		$args     = array_merge( $defaults, $args );

		if ( ! in_array( $args['connection'], self::CONNECTION_LEVELS, true ) ) {
			throw new InvalidArgumentException(
				sprintf( 'Invalid connection level "%s" for feature "%s".', $args['connection'], $slug )
			);
		}

		$this->slug = $slug;
		$this->args = $args;
	}

	/**
	 * Get the feature slug.
	 *
	 * @return string
	 */
	public function slug() {
		return $this->slug;
	}

	/**
	 * Get the feature title.
	 *
	 * @return string
	 */
	public function title() {
		return (string) $this->args['title'];
	}

	/**
	 * Get the feature description.
	 *
	 * @return string
	 */
	public function description() {
		return (string) $this->args['description'];
	}

	/**
	 * Get the feature category.
	 *
	 * @return string
	 */
	public function category() {
		return (string) $this->args['category'];
	}

	/**
	 * Get the feature documentation links.
	 *
	 * @return array
	 */
	public function docs() {
		return (array) $this->args['docs'];
	}

	/**
	 * Get the feature entitlement.
	 *
	 * @return ?string
	 */
	public function entitlement() {
		return $this->args['entitlement'];
	}

	/**
	 * Get the feature connection level.
	 *
	 * @return string
	 */
	public function connection() {
		return (string) $this->args['connection'];
	}

	/**
	 * Get the feature module name.
	 *
	 * @return ?string
	 */
	public function module() {
		return $this->args['module'];
	}

	/**
	 * Get the available_since information.
	 *
	 * @return array
	 */
	public function available_since() {
		return (array) $this->args['available_since'];
	}

	/**
	 * Get the feature recommendations.
	 *
	 * @return array
	 */
	public function recommend() {
		return (array) $this->args['recommend'];
	}

	/**
	 * Get the is_active callback if available.
	 *
	 * @return ?callable
	 */
	public function is_active_callback() {
		return is_callable( $this->args['is_active'] ) ? $this->args['is_active'] : null;
	}

	/**
	 * Get the is_applicable callback if available.
	 *
	 * @return ?callable
	 */
	public function is_applicable_callback() {
		return is_callable( $this->args['is_applicable'] ) ? $this->args['is_applicable'] : null;
	}

	/**
	 * Serialize the manifest fields (excludes callables).
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'slug'            => $this->slug,
			'title'           => $this->title(),
			'description'     => $this->description(),
			'category'        => $this->category(),
			'docs'            => $this->docs(),
			'entitlement'     => $this->entitlement(),
			'connection'      => $this->connection(),
			'module'          => $this->module(),
			'available_since' => $this->available_since(),
			'recommend'       => $this->recommend(),
		);
	}
}
