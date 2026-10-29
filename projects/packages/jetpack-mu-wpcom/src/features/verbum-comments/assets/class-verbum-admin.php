<?php
/**
 * Verbum Admin
 *
 * @package automattic/jetpack-mu-plugins
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

/**
 * Verbum_Admin is responsible for additional admin settings for comments.
 *
 * @phan-constructor-used-for-side-effects
 */
class Verbum_Admin {

	/**
	 * The default commenting experience
	 *
	 * @var boolean
	 */
	public $default_verbum_commenting;

	/**
	 * The default value for allowing blocks in comments
	 *
	 * @var boolean
	 */
	public $default_allow_blocks;

	/**
	 * The default comment form greeting - blank to start with
	 *
	 * @var string
	 */
	public $default_greeting = '';

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->setup_globals();

		add_action( 'admin_init', array( $this, 'add_settings' ) );
	}

	/**
	 * Set any global variables or class variables
	 */
	protected function setup_globals() {
		// Default commenting experience
		$this->default_verbum_commenting = true;

		// Default allow blocks in comments
		$this->default_allow_blocks = true;

		// Default option values.
		$this->default_greeting = __( 'Leave a Reply', 'jetpack-mu-wpcom' );
	}

	/** Settings ************************************************************* */

	/**
	 * Add the Jetpack settings to WordPress's discussions page
	 */
	public function add_settings() {

		// Create the section.
		add_settings_section(
			'jetpack_comment_form',
			__( 'Comments', 'jetpack-mu-wpcom' ),
			array( $this, 'comment_form_settings_section' ),
			'discussion'
		);

		add_settings_field(
			'enable_verbum_commenting',
			__( 'Jetpack Comments', 'jetpack-mu-wpcom' ),
			array( $this, 'verbum_field' ),
			'discussion'
		);

		register_setting(
			'discussion',
			'enable_verbum_commenting',
			array( $this, 'enable_verbum_commenting_sanitize' )
		);

		add_settings_field(
			'enable_blocks_comments',
			__( 'Allow Blocks', 'jetpack-mu-wpcom' ),
			array( $this, 'allow_blocks_field' ),
			'discussion'
		);

		register_setting(
			'discussion',
			'enable_blocks_comments',
			array( $this, 'allow_blocks_sanitize' )
		);

		/**
		 * Clever Greeting
		 */
		add_settings_field(
			'highlander_comment_form_prompt',
			__( 'Greeting Text', 'jetpack-mu-wpcom' ),
			array( $this, 'comment_form_greeting_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'highlander_comment_form_prompt',
			array( $this, 'comment_form_greeting_sanitize' )
		);
	}

	/**
	 * Discussions setting section blurb
	 *
	 * @since 1.4
	 */
	public function comment_form_settings_section() {
		?>

		<p id="jetpack-comments-settings"><?php esc_html_e( 'Adjust your Comments form with a clever greeting.', 'jetpack-mu-wpcom' ); ?></p>

		<?php
	}

	/**
	 * Prints HTML for the verbum commenting setting
	 */
	public function verbum_field() {
		?>
			<label><input name="enable_verbum_commenting" type="checkbox" <?php checked( $this->is_verbum_enabled(), true, true ); ?> value="1" />
				<?php esc_html_e( 'Replace the default comment form with Jetpack Comments, where visitors can also log in with WordPress.com', 'jetpack-mu-wpcom' ); ?>
			</label>
		<?php
	}

	/**
	 * Prints HTML for the verbum commenting setting
	 */
	public function allow_blocks_field() {
		?>
			<label><input name="enable_blocks_comments" type="checkbox" <?php checked( $this->are_blocks_enabled(), true, true ); ?> value="1" />
				<?php esc_html_e( 'Enable blocks in comments', 'jetpack-mu-wpcom' ); ?>
			</label>
		<?php
	}

	/**
	 * Is verbum commenting enabled?
	 *
	 * @return boolean
	 */
	public function is_verbum_enabled() {
		return (bool) get_option( 'enable_verbum_commenting', $this->default_verbum_commenting );
	}

	/**
	 * Is verbum commenting enabled?
	 *
	 * @return boolean
	 */
	public function are_blocks_enabled() {
		return (bool) get_option( 'enable_blocks_comments', $this->default_allow_blocks );
	}

	/**
	 * Custom Comment Greeting Text
	 */
	public function comment_form_greeting_setting() {

		// The greeting.
		$greeting = get_option( 'highlander_comment_form_prompt', $this->default_greeting );

		if ( empty( $greeting ) ) {
			$greeting = $this->default_greeting;
		}

		?>

		<input type="text" name="highlander_comment_form_prompt" id="jetpack-comment-form-greeting" value="<?php echo esc_attr( $greeting ); ?>" class="regular-text">
		<p class="description"><?php esc_html_e( 'A few catchy words to motivate your readers to comment', 'jetpack-mu-wpcom' ); ?></p>

		<?php
	}

	/**
	 * Sanitize the clever comment greeting
	 *
	 * @param string $val The contact form greeting string.
	 * @return string|boolean
	 */
	public function comment_form_greeting_sanitize( $val ) {

		// Delete if empty or the default.
		if ( empty( $val ) || ( $this->default_greeting === $val ) ) {
			delete_option( 'highlander_comment_form_prompt' );
			return false;
		}

		return wp_kses( $val, array() );
	}

	/**
	 * Sanitize the allow blocks in comments setting
	 *
	 * @param string $val The allow blocks in comments string.
	 * @return string
	 */
	public function allow_blocks_sanitize( $val ) {
		return $val ? '1' : '0';
	}

	/**
	 * Sanitize the verbum commenting setting
	 *
	 * @param string $val The verbum commenting string.
	 * @return string
	 */
	public function enable_verbum_commenting_sanitize( $val ) {
		return $val ? '1' : '0';
	}
}
