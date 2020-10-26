<?php
/* HEADER */ // phpcs:ignore

/**
 * This class manages the files and dependencies of the autoloader.
 */
class Autoloader_Container {

	/**
	 * Since each autoloader's class files exist within their own namespace we need a map to
	 * convert between the local class and a shared key. Note that no version checking is
	 * performed on these dependencies and the first autoloader to register will be the
	 * one that is utilized.
	 */
	const SHARED_DEPENDENCY_KEYS = array(
		Hook_Manager::class => 'Hook_Manager',
	);

	/**
	 * A map of all the dependencies we've registered with the container and created.
	 *
	 * @var array
	 */
	private $dependencies;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->dependencies = array();

		$this->register_dependencies();
		$this->register_shared_dependencies();
	}

	/**
	 * Gets a dependency out of the container.
	 *
	 * @param string $class The class to fetch.
	 *
	 * @return mixed
	 * @throws \InvalidArgumentException When a class that isn't registered with the container is fetched.
	 */
	public function get( $class ) {
		if ( ! isset( $this->dependencies[ $class ] ) ) {
			throw new \InvalidArgumentException( "Class '$class' is not registered with the container." );
		}

		return $this->dependencies[ $class ];
	}

	/**
	 * Registers all of the dependencies with the container.
	 */
	private function register_dependencies() {
		require_once __DIR__ . '/class-cache-handler.php';
		$this->dependencies[ Cache_Handler::class ] = new Cache_Handler();

		require_once __DIR__ . '/class-plugin-locator.php';
		$this->dependencies[ Plugin_Locator::class ] = new Plugin_Locator();

		require_once __DIR__ . '/class-version-selector.php';
		$this->dependencies[ Version_Selector::class ] = new Version_Selector();

		require_once __DIR__ . '/class-autoloader-locator.php';
		$this->dependencies[ Autoloader_Locator::class ] = new Autoloader_Locator(
			$this->get( Version_Selector::class )
		);

		require_once __DIR__ . '/class-plugins-handler.php';
		$this->dependencies[ Plugins_Handler::class ] = new Plugins_Handler(
			$this->get( Plugin_Locator::class ),
			$this->get( Cache_Handler::class )
		);

		require_once __DIR__ . '/class-autoloader-handler.php';
		$this->dependencies[ Autoloader_Handler::class ] = new Autoloader_Handler(
			$this->get( Plugins_Handler::class ),
			$this->get( Autoloader_Locator::class ),
			$this->get( Version_Selector::class )
		);
	}

	/**
	 * Registers all of the dependencies that are shared between all instances of the autoloader.
	 */
	private function register_shared_dependencies() {
		global $jetpack_autoloader_container_shared;
		if ( ! isset( $jetpack_autoloader_container_shared ) ) {
			$jetpack_autoloader_container_shared = array();
		}

		$key = self::SHARED_DEPENDENCY_KEYS[ Hook_Manager::class ];
		if ( ! isset( $jetpack_autoloader_container_shared[ $key ] ) ) {
			require_once __DIR__ . '/class-hook-manager.php';
			$jetpack_autoloader_container_shared[ $key ] = new Hook_Manager();
		}
		$this->dependencies[ Hook_Manager::class ] = &$jetpack_autoloader_container_shared[ $key ];
	}
}
