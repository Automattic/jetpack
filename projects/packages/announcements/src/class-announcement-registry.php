<?php
/**
 * Announcement registry.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * Stores the registered announcements, keyed by id.
 *
 * Hydrates on its first read after `init`: the registration action fires once, and every
 * registrant registers from there.
 */
final class Announcement_Registry {

	/**
	 * Action through which announcements are registered, fired once on the first read.
	 */
	const REGISTER_ACTION = 'jetpack_register_announcements';

	/**
	 * Pattern of an announcement id, `vendor/slug`. The REST item route matches it.
	 */
	const ID_PATTERN = '[a-z0-9-]+/[a-z0-9-]+';

	/**
	 * Media types an announcement may carry.
	 */
	const MEDIA_TYPES = array( 'image', 'video' );

	/**
	 * Protocols the URLs of an announcement may use.
	 */
	private const URL_PROTOCOLS = array( 'http', 'https' );

	/**
	 * Elements the body of an announcement may carry, with their attributes.
	 *
	 * No `style`, `class`, `id` or `data-*`: the body is shown inside wp-admin and must not restyle it.
	 */
	private const CONTENT_TAGS = array(
		'p'      => array(),
		'br'     => array(),
		'strong' => array(),
		'em'     => array(),
		'code'   => array(),
		'a'      => array( 'href' => true ),
		'ul'     => array(),
		'ol'     => array(),
		'li'     => array(),
		'h2'     => array(),
		'h3'     => array(),
		'h4'     => array(),
		'img'    => array(
			'src'    => true,
			'alt'    => true,
			'width'  => true,
			'height' => true,
		),
		'video'  => array(
			'src'      => true,
			'poster'   => true,
			'controls' => true,
			'width'    => true,
			'height'   => true,
		),
	);

	/**
	 * Registered announcements, as `$id => $announcement` pairs.
	 *
	 * @var array[]
	 */
	private $announcements = array();

	/**
	 * Whether the registration action has fired.
	 *
	 * @var bool
	 */
	private $hydrated = false;

	/**
	 * The main instance.
	 *
	 * @var Announcement_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers an announcement. There is no unregister: the contract is additive.
	 *
	 * @param string $id   Namespaced id, `vendor/slug`.
	 * @param array  $args The announcement, as `register_announcement()` documents it.
	 * @return array|false The registered announcement, or false when it is refused.
	 */
	public function register( $id, $args ) {
		// `D`: without it `$` also matches before a line break that ends the id.
		if ( ! is_string( $id ) || ! preg_match( '#^' . self::ID_PATTERN . '$#D', $id ) ) {
			return self::refuse( __( 'Announcement ids are lowercase and carry a namespace prefix. Example: my-plugin/my-announcement', 'jetpack-announcements' ) );
		}

		if ( $this->is_registered( $id ) ) {
			/* translators: %s: Announcement id. */
			return self::refuse( sprintf( __( 'Announcement "%s" is already registered.', 'jetpack-announcements' ), $id ) );
		}

		$announcement = self::sanitize( $id, is_array( $args ) ? $args : array() );
		if ( null === $announcement ) {
			/* translators: %s: Announcement id. */
			return self::refuse( sprintf( __( 'Announcement "%s" needs a date, a title and at least one channel.', 'jetpack-announcements' ), $id ) );
		}

		$this->announcements[ $id ] = $announcement;

		return $announcement;
	}

	/**
	 * Retrieves a registered announcement.
	 *
	 * @param string $id Announcement id.
	 * @return array|null The announcement, or null when it is not registered.
	 */
	public function get_registered( $id ) {
		$this->ensure_hydrated();

		return $this->announcements[ $id ] ?? null;
	}

	/**
	 * Retrieves all registered announcements.
	 *
	 * @return array[] `$id => $announcement` pairs.
	 */
	public function get_all_registered() {
		$this->ensure_hydrated();

		return $this->announcements;
	}

	/**
	 * Checks if an announcement is registered. Does not hydrate: register() relies on it.
	 *
	 * @param string $id Announcement id.
	 * @return bool
	 */
	public function is_registered( $id ) {
		return isset( $this->announcements[ $id ] );
	}

	/**
	 * Retrieves the main instance, creating it on the first call.
	 *
	 * @return Announcement_Registry
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Fires the registration action once, on the first read after `init`.
	 *
	 * @return void
	 */
	private function ensure_hydrated() {
		if ( $this->hydrated ) {
			return;
		}

		// Latching before init ends would drop every registrant hooked later, so the read skips the action.
		if ( ! did_action( 'init' ) || doing_action( 'init' ) ) {
			$message = __( 'Announcements are read after init. An earlier read answers only what was registered directly.', 'jetpack-announcements' );
			_doing_it_wrong( __CLASS__, esc_html( $message ), 'jetpack-announcements-$$next-version$$' );
			return;
		}

		// Latched before the action so a registrant that reads the registry cannot re-enter.
		$this->hydrated = true;

		/**
		 * Fires when the announcement registry hydrates, on its first read after `init`.
		 *
		 * Register announcements here with `register_announcement()`. Do no I/O: the read
		 * that triggers it may be a REST request.
		 *
		 * @since $$next-version$$
		 *
		 * @param Announcement_Registry $registry The registry being hydrated.
		 */
		do_action( self::REGISTER_ACTION, $this );
	}

	/**
	 * Builds the stored record from what a registrant passed.
	 *
	 * @param string $id   Announcement id.
	 * @param array  $args The announcement, as `register_announcement()` documents it.
	 * @return array|null The record, or null when a required field is missing or unusable.
	 */
	private static function sanitize( $id, array $args ) {
		$date     = self::sanitize_date( $args['date'] ?? null );
		$title    = self::sanitize_text( $args['title'] ?? '' );
		$channels = array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) ( $args['channels'] ?? array() ) ) ) ) );

		if ( '' === $date || '' === $title || ! $channels ) {
			return null;
		}

		return array(
			'id'         => $id,
			'date'       => $date,
			'title'      => $title,
			'excerpt'    => self::sanitize_text( $args['excerpt'] ?? '' ),
			'content'    => is_string( $args['content'] ?? null ) ? wp_kses( $args['content'], self::CONTENT_TAGS, self::URL_PROTOCOLS ) : '',
			'media'      => self::sanitize_media( $args['media'] ?? null ),
			'link'       => is_string( $args['link'] ?? null ) ? esc_url_raw( $args['link'], self::URL_PROTOCOLS ) : '',
			'channels'   => $channels,
			'capability' => is_string( $args['capability'] ?? null ) ? $args['capability'] : '',
		);
	}

	/**
	 * Sanitizes the date of an announcement.
	 *
	 * @param mixed $value The value a registrant passed.
	 * @return string The date in UTC, or an empty string unless it starts with a calendar date that exists.
	 */
	private static function sanitize_date( $value ) {
		if ( ! is_string( $value ) || ! preg_match( '/^\d{4}-\d{2}-\d{2}/', $value ) ) {
			return '';
		}

		$utc    = new \DateTimeZone( 'UTC' );
		$date   = date_create( $value, $utc );
		$errors = \DateTime::getLastErrors();

		// An impossible date parses with a warning and rolls over: 2026-02-30 would become March 2.
		if ( ! $date || ( $errors && $errors['warning_count'] ) ) {
			return '';
		}

		return $date->setTimezone( $utc )->format( DATE_ATOM );
	}

	/**
	 * Sanitizes a plain text field.
	 *
	 * @param mixed $value The value a registrant passed.
	 * @return string The text, or an empty string for anything but a string.
	 */
	private static function sanitize_text( $value ) {
		return is_string( $value ) ? sanitize_text_field( $value ) : '';
	}

	/**
	 * Sanitizes the media of an announcement.
	 *
	 * @param mixed $media The value a registrant passed.
	 * @return array|null `type`, `url` and `alt`, or null without a known type and a URL.
	 */
	private static function sanitize_media( $media ) {
		if ( ! is_array( $media ) || ! in_array( $media['type'] ?? null, self::MEDIA_TYPES, true ) ) {
			return null;
		}

		$url = is_string( $media['url'] ?? null ) ? esc_url_raw( $media['url'], self::URL_PROTOCOLS ) : '';
		if ( '' === $url ) {
			return null;
		}

		return array(
			'type' => $media['type'],
			'url'  => $url,
			'alt'  => self::sanitize_text( $media['alt'] ?? '' ),
		);
	}

	/**
	 * Reports a registration the registry refuses.
	 *
	 * @param string $message What was wrong.
	 * @return false
	 */
	private static function refuse( $message ) {
		_doing_it_wrong( __NAMESPACE__ . '\register_announcement', esc_html( $message ), 'jetpack-announcements-$$next-version$$' );

		return false;
	}
}
