<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Stand in for the sharedaddy service classes the REST endpoints read.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound, Generic.Classes.OpeningBraceSameLine.ContentAfterBrace

/**
 * A built-in service.
 */
class Sharing_Source {

	/**
	 * Service ID.
	 *
	 * @var string
	 */
	protected $id;

	/**
	 * Service name.
	 *
	 * @var string
	 */
	protected $name;

	/**
	 * Button style.
	 *
	 * @var string
	 */
	public $button_style = 'icon-text';

	/**
	 * Whether to show the network's official button.
	 *
	 * @var bool
	 */
	public $smart = false;

	/**
	 * Build a service.
	 *
	 * @param string $id     Service ID.
	 * @param array  $config Service configuration.
	 */
	public function __construct( $id, array $config ) {
		$this->id   = $id;
		$this->name = $config['name'] ?? ucfirst( $id );
	}

	/**
	 * Service ID.
	 *
	 * @return string
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Whether the network shut down its sharing button.
	 *
	 * @return bool
	 */
	public function is_deprecated() {
		return 'deprecated' === $this->id;
	}

	/**
	 * Whether the service is only kept for the sites that use it.
	 *
	 * @return bool
	 */
	public function is_legacy() {
		return 'legacy' === $this->id;
	}

	/**
	 * Class name the services list styles the service with.
	 *
	 * @return string
	 */
	public function get_class() {
		return $this->id;
	}

	/**
	 * Whether the services list offers to remove the service.
	 *
	 * @return bool
	 */
	public function has_advanced_options() {
		return false;
	}

	/**
	 * Whether the button style is the service's own.
	 *
	 * @return bool
	 */
	public function has_custom_button_style() {
		return false;
	}

	/**
	 * Print the button the services list previews.
	 */
	public function display_preview() {
		echo '<a>' . esc_html( $this->name ) . '</a>';
	}
}

/**
 * A service with options of its own.
 */
abstract class Sharing_Advanced_Source extends Sharing_Source {

	/**
	 * Apply options.
	 *
	 * @param array $data Options.
	 */
	abstract public function update_options( array $data );

	/**
	 * Current options.
	 *
	 * @return array
	 */
	abstract public function get_options();
}

/**
 * A custom service, which keeps its options as the real one does.
 */
class Share_Custom extends Sharing_Advanced_Source {

	/**
	 * Sharing URL.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Icon URL.
	 *
	 * @var string
	 */
	private $icon;

	/**
	 * Build a custom service.
	 *
	 * @param string $id     Service ID.
	 * @param array  $config Name, URL and icon.
	 */
	public function __construct( $id, array $config ) {
		parent::__construct( $id, $config );

		$this->url  = $config['url'] ?? '';
		$this->icon = $config['icon'] ?? '';
	}

	/**
	 * Apply options, skipping empty ones as the real class does. Expects slashed input.
	 *
	 * @param array $data Name, URL and icon.
	 */
	public function update_options( array $data ) {
		$name = trim( wp_html_excerpt( wp_kses( stripslashes( $data['name'] ), array() ), 30 ) );
		$url  = trim( esc_url_raw( $data['url'] ) );
		$icon = trim( esc_url_raw( $data['icon'] ) );

		if ( $name ) {
			$this->name = $name;
		}

		if ( $url ) {
			$this->url = $url;
		}

		if ( $icon ) {
			$this->icon = $icon;
		}
	}

	/**
	 * Current options.
	 *
	 * @return array
	 */
	public function get_options() {
		return array(
			'name' => $this->name,
			'icon' => $this->icon,
			'url'  => $this->url,
		);
	}
}
