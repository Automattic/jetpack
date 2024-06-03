<?php
/**
 * Blocks API: WP_Block_Patterns_Registry class
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 5.5.0
 */

/**
 * Class used for interacting with block patterns.
 *
 * @since 5.5.0
 */
#[AllowDynamicProperties]
final class WP_Block_Patterns_Registry {
	/**
	 * Registered block patterns array.
	 *
	 * @since 5.5.0
	 * @var array[]
	 */
	private $registered_patterns = array();

	/**
	 * Patterns registered outside the `init` action.
	 *
	 * @since 6.0.0
	 * @var array[]
	 */
	private $registered_patterns_outside_init = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @since 5.5.0
	 * @var WP_Block_Patterns_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers a block pattern.
	 *
	 * @since 5.5.0
	 * @since 5.8.0 Added support for the `blockTypes` property.
	 * @since 6.1.0 Added support for the `postTypes` property.
	 * @since 6.2.0 Added support for the `templateTypes` property.
	 *
	 * @param string $pattern_name       Block pattern name including namespace.
	 * @param array  $pattern_properties {
	 *     List of properties for the block pattern.
	 *
	 *     @type string $title         Required. A human-readable title for the pattern.
	 *     @type string $content       Required. Block HTML markup for the pattern.
	 *     @type string $description   Optional. Visually hidden text used to describe the pattern
	 *                                 in the inserter. A description is optional, but is strongly
	 *                                 encouraged when the title does not fully describe what the
	 *                                 pattern does. The description will help users discover the
	 *                                 pattern while searching.
	 *     @type int    $viewportWidth Optional. The intended width of the pattern to allow for a scaled
	 *                                 preview within the pattern inserter.
	 *     @type bool   $inserter      Optional. Determines whether the pattern is visible in inserter.
	 *                                 To hide a pattern so that it can only be inserted programmatically,
	 *                                 set this to false. Default true.
	 *     @type array  $categories    Optional. A list of registered pattern categories used to group
	 *                                 block patterns. Block patterns can be shown on multiple categories.
	 *                                 A category must be registered separately in order to be used here.
	 *     @type array  $keywords      Optional. A list of aliases or keywords that help users discover
	 *                                 the pattern while searching.
	 *     @type array  $blockTypes    Optional. A list of block names including namespace that could use
	 *                                 the block pattern in certain contexts (placeholder, transforms).
	 *                                 The block pattern is available in the block editor inserter
	 *                                 regardless of this list of block names.
	 *                                 Certain blocks support further specificity besides the block name
	 *                                 (e.g. for `core/template-part` you can specify areas
	 *                                 like `core/template-part/header` or `core/template-part/footer`).
	 *     @type array  $postTypes     Optional. An array of post types that the pattern is restricted
	 *                                 to be used with. The pattern will only be available when editing one
	 *                                 of the post types passed on the array. For all the other post types
	 *                                 not part of the array the pattern is not available at all.
	 *     @type array  $templateTypes Optional. An array of template types where the pattern fits.
	 * }
	 * @return bool True if the pattern was registered with success and false otherwise.
	 */
	public function register( $pattern_name, $pattern_properties ) {
		if ( ! isset( $pattern_name ) || ! is_string( $pattern_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Pattern name must be a string.' ),
				'5.5.0'
			);
			return false;
		}

		if ( ! isset( $pattern_properties['title'] ) || ! is_string( $pattern_properties['title'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Pattern title must be a string.' ),
				'5.5.0'
			);
			return false;
		}

		if ( ! isset( $pattern_properties['content'] ) || ! is_string( $pattern_properties['content'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Pattern content must be a string.' ),
				'5.5.0'
			);
			return false;
		}

		$pattern = array_merge(
			$pattern_properties,
			array( 'name' => $pattern_name )
		);

		$this->registered_patterns[ $pattern_name ] = $pattern;

		// If the pattern is registered inside an action other than `init`, store it
		// also to a dedicated array. Used to detect deprecated registrations inside
		// `admin_init` or `current_screen`.
		if ( current_action() && 'init' !== current_action() ) {
			$this->registered_patterns_outside_init[ $pattern_name ] = $pattern;
		}

		return true;
	}

	/**
	 * Unregisters a block pattern.
	 *
	 * @since 5.5.0
	 *
	 * @param string $pattern_name Block pattern name including namespace.
	 * @return bool True if the pattern was unregistered with success and false otherwise.
	 */
	public function unregister( $pattern_name ) {
		if ( ! $this->is_registered( $pattern_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s: Pattern name. */
				sprintf( __( 'Pattern "%s" not found.' ), $pattern_name ),
				'5.5.0'
			);
			return false;
		}

		unset( $this->registered_patterns[ $pattern_name ] );
		unset( $this->registered_patterns_outside_init[ $pattern_name ] );

		return true;
	}

	/**
	 * Retrieves an array containing the properties of a registered block pattern.
	 *
	 * @since 5.5.0
	 *
	 * @param string $pattern_name Block pattern name including namespace.
	 * @return array Registered pattern properties.
	 */
	public function get_registered( $pattern_name ) {
		if ( ! $this->is_registered( $pattern_name ) ) {
			return null;
		}

		return $this->registered_patterns[ $pattern_name ];
	}

	/**
	 * Retrieves all registered block patterns.
	 *
	 * @since 5.5.0
	 *
	 * @param bool $outside_init_only Return only patterns registered outside the `init` action.
	 * @return array[] Array of arrays containing the registered block patterns properties,
	 *                 and per style.
	 */
	public function get_all_registered( $outside_init_only = false ) {
		return array_values(
			$outside_init_only
				? $this->registered_patterns_outside_init
				: $this->registered_patterns
		);
	}

	/**
	 * Checks if a block pattern is registered.
	 *
	 * @since 5.5.0
	 *
	 * @param string $pattern_name Block pattern name including namespace.
	 * @return bool True if the pattern is registered, false otherwise.
	 */
	public function is_registered( $pattern_name ) {
		return isset( $this->registered_patterns[ $pattern_name ] );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @since 5.5.0
	 *
	 * @return WP_Block_Patterns_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

/**
 * Registers a new block pattern.
 *
 * @since 5.5.0
 *
 * @param string $pattern_name       Block pattern name including namespace.
 * @param array  $pattern_properties List of properties for the block pattern.
 *                                   See WP_Block_Patterns_Registry::register() for accepted arguments.
 * @return bool True if the pattern was registered with success and false otherwise.
 */
function register_block_pattern( $pattern_name, $pattern_properties ) {
	return WP_Block_Patterns_Registry::get_instance()->register( $pattern_name, $pattern_properties );
}

/**
 * Unregisters a block pattern.
 *
 * @since 5.5.0
 *
 * @param string $pattern_name Block pattern name including namespace.
 * @return bool True if the pattern was unregistered with success and false otherwise.
 */
function unregister_block_pattern( $pattern_name ) {
	return WP_Block_Patterns_Registry::get_instance()->unregister( $pattern_name );
}
