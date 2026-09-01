<?php
/**
 * Model class for threat data.
 *
 * @package automattic/jetpack-protect-models
 */

namespace Automattic\Jetpack\Protect_Models;

/**
 * Model class for threat data.
 */
class Threat_Model {

	/**
	 * Threat ID.
	 *
	 * @var null|string
	 */
	public $id;

	/**
	 * Threat Signature.
	 *
	 * @var null|string
	 */
	public $signature;

	/**
	 * Threat Title.
	 *
	 * @var null|string
	 */
	public $title;

	/**
	 * Threat Description.
	 *
	 * @var null|string
	 */
	public $description;

	/**
	 * The data the threat was first detected.
	 *
	 * @var null|string
	 */
	public $first_detected;

	/**
	 * The version the threat is fixed in.
	 *
	 * @var null|string
	 */
	public $fixed_in;

	/**
	 * The date the threat is fixed on.
	 *
	 * @var null|string
	 */
	public $fixed_on;

	/**
	 * The severity of the threat between 1-5.
	 *
	 * @var null|int
	 */
	public $severity;

	/**
	 * Information about the auto-fix available for this threat. False when not auto-fixable.
	 *
	 * @var null|bool|object
	 */
	public $fixable;

	/**
	 * The current status of the threat.
	 *
	 * @var null|string
	 */
	public $status;

	/**
	 * The filename of the threat.
	 *
	 * @var null|string
	 */
	public $filename;

	/**
	 * The context of the threat.
	 *
	 * @var null|object
	 */
	public $context;

	/**
	 * The database table of the threat.
	 *
	 * @var null|string
	 */
	public $table;

	/**
	 * Additional details about the database threat.
	 *
	 * @var null|object
	 */
	public $details;

	/**
	 * The source URL of the threat.
	 *
	 * @var null|string
	 */
	public $source;

	/**
	 * The threat's extension information.
	 *
	 * @since 0.4.0
	 *
	 * @var null|Extension_Model
	 */
	public $extension;

	/**
	 * The threat's related vulnerabilities.
	 *
	 * @since 0.5.0
	 *
	 * @var null|Vulnerability_Model[]
	 */
	public $vulnerabilities;

	/**
	 * Threat Constructor
	 *
	 * @param array|object $threat Threat data to load into the class instance.
	 */
	public function __construct( $threat ) {
		if ( is_object( $threat ) ) {
			$threat = (array) $threat;
		}

		foreach ( $threat as $property => $value ) {
			if ( 'extension' === $property && ! empty( $value ) ) {
				$this->extension = new Extension_Model( $value );
				continue;
			}
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}
	}

	/**
	 * Get the ID value of the threat based on its related extension and vulnerabilities.
	 *
	 * @since 0.5.0
	 *
	 * @param Extension_Model $extension       The extension to get the ID from.
	 *
	 * @return string
	 */
	private static function get_id_from_vulnerable_extension( Extension_Model $extension ) {
		return "$extension->type-$extension->slug-$extension->version";
	}

	/**
	 * Get the title from a vulnerable extension.
	 *
	 * @since 0.5.0
	 *
	 * @param Extension_Model $extension The extension to get the title from.
	 *
	 * @return string|null
	 */
	private static function get_title_from_vulnerable_extension( Extension_Model $extension ) {
		$titles = array(
			'plugins' => sprintf(
				/* translators: placeholders are the theme name and version number. Example: "Vulnerable theme: Jetpack (version 1.2.3)" */
				__( 'Vulnerable plugin: %1$s (version %2$s)', 'jetpack-protect-models' ),
				$extension->name,
				$extension->version
			),
			'themes'  => sprintf(
				/* translators: placeholders are the theme name and version number. Example: "Vulnerable theme: Jetpack (version 1.2.3)" */
				__( 'Vulnerable theme: %1$s (version %2$s)', 'jetpack-protect-models' ),
				$extension->name,
				$extension->version
			),
			'core'    => sprintf(
				/* translators: placeholder is the version number. Example: "Vulnerable WordPress (version 1.2.3)" */
				__( 'Vulnerable WordPress (version %s)', 'jetpack-protect-models' ),
				$extension->version
			),
		);

		return $titles[ $extension->type ] ?? null;
	}

	/**
	 * Get the description from a vulnerable extension.
	 *
	 * @since 0.5.0
	 *
	 * @param Extension_Model $extension The extension to get the description from.
	 * @param array           $vulnerabilities The vulnerabilities to get the description from.
	 *
	 * @return string
	 */
	private static function get_description_from_vulnerable_extension( Extension_Model $extension, array $vulnerabilities ) {
		return sprintf(
				/* translators: placeholders are the theme name and version number. Example: "The installed version of Jetpack (1.2.3) has a known security vulnerability." */
			_n( 'The installed version of %1$s (%2$s) has a known security vulnerability.', 'The installed version of %1$s (%2$s) has known security vulnerabilities.', count( $vulnerabilities ), 'jetpack-protect-models' ),
			$extension->name,
			$extension->version
		);
	}

	/**
	 * Get the latest fixed_in version from a list of vulnerabilities.
	 *
	 * @since 0.5.0
	 *
	 * @param array $vulnerabilities The vulnerabilities to get the fixed_in version from.
	 *
	 * @return string|bool|null The latest fixed_in version, or false if any of the vulnerabilities are not fixed.
	 */
	private static function get_fixed_in_from_vulnerabilities( array $vulnerabilities ) {
		$fixed_in = null;

		foreach ( $vulnerabilities as $vulnerability ) {
			// If any of the vulnerabilities are not fixed, the threat is not fixed.
			if ( ! $vulnerability->fixed_in ) {
				break;
			}

			// Use the latest available fixed_in version.
			if ( ! $fixed_in || ( $fixed_in && version_compare( $vulnerability->fixed_in, $fixed_in, '>' ) ) ) {
				$fixed_in = $vulnerability->fixed_in;
			}
		}

		return $fixed_in;
	}

	/**
	 * Generate a threat from extension vulnerabilities.
	 *
	 * @since 0.5.0
	 *
	 * @param Extension_Model       $extension       The extension to generate the threat for.
	 * @param Vulnerability_Model[] $vulnerabilities The vulnerabilities to generate the threat from.
	 *
	 * @return Threat_Model
	 */
	public static function generate_from_extension_vulnerabilities( Extension_Model $extension, array $vulnerabilities ) {
		return new Threat_Model(
			array(
				'id'              => self::get_id_from_vulnerable_extension( $extension ),
				'title'           => self::get_title_from_vulnerable_extension( $extension ),
				'description'     => self::get_description_from_vulnerable_extension( $extension, $vulnerabilities ),
				'fixed_in'        => self::get_fixed_in_from_vulnerabilities( $vulnerabilities ),
				'vulnerabilities' => $vulnerabilities,
			)
		);
	}
}
