<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack comments admin menu file.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Comments\Comments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_Comments_Settings
 * This class represents the comments settings functionality.
 */
class Jetpack_Comments_Settings {

	/** Variables *************************************************************/

	/**
	 * The Jetpack Comments singleton
	 *
	 * @var Highlander_Comments_Base
	 */
	public $jetpack_comments;

	/**
	 * The default comment form greeting - blank to start with
	 *
	 * @var string
	 */
	public $default_greeting = ''; // Set in constructor.

	/**
	 * Initialize class
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_Comments_Settings( Jetpack_Comments::init() );
		}

		return $instance;
	}

	/**
	 * Constructor
	 *
	 * @param Highlander_Comments_Base $jetpack_comments The Jetpack Comments singleton.
	 */
	public function __construct( Highlander_Comments_Base $jetpack_comments ) {
		$this->jetpack_comments = $jetpack_comments;

		// Setup settings.
		add_action( 'admin_init', array( $this, 'add_settings' ) );
		$this->setup_globals();
	}

	/** Private Methods ****************************************************** */

	/**
	 * Set any global variables or class variables
	 *
	 * @since 1.4
	 */
	protected function setup_globals() {
		// Default option values.
		$this->default_greeting = __( 'Leave a Reply', 'jetpack' );
	}

	/** Settings ************************************************************* */

	/**
	 * Add the Jetpack settings to WordPress's discussions page
	 *
	 * @since 1.4
	 */
	public function add_settings() {

		// Create the section.
		add_settings_section(
			'jetpack_comment_form',
			__( 'Comments', 'jetpack' ),
			array( $this, 'comment_form_settings_section' ),
			'discussion'
		);

		/**
		 * Clever Greeting
		 */
		add_settings_field(
			'highlander_comment_form_prompt',
			__( 'Greeting Text', 'jetpack' ),
			array( $this, 'comment_form_greeting_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'highlander_comment_form_prompt',
			array( $this, 'comment_form_greeting_sanitize' )
		);

		if ( ! Comments::is_enabled() ) {
			return;
		}

		add_settings_field(
			'enable_blocks_comments',
			__( 'Allow Blocks', 'jetpack' ),
			array( $this, 'allow_blocks_field' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'enable_blocks_comments',
			array( $this, 'allow_blocks_sanitize' )
		);
	}

	/**
	 * Blocks in comments setting.
	 */
	public function allow_blocks_field() {
		?>

		<label>
			<input name="enable_blocks_comments" type="checkbox" value="1" <?php checked( (bool) get_option( 'enable_blocks_comments', true ) ); ?>>
			<?php esc_html_e( 'Enable blocks in comments', 'jetpack' ); ?>
		</label>

		<?php
	}

	/**
	 * Sanitize the blocks in comments setting.
	 *
	 * @param mixed $val The submitted value.
	 * @return string
	 */
	public function allow_blocks_sanitize( $val ) {
		return $val ? '1' : '0';
	}

	/**
	 * Discussions setting section blurb
	 *
	 * @since 1.4
	 */
	public function comment_form_settings_section() {
		?>

		<p id="jetpack-comments-settings"><?php esc_html_e( 'Adjust your Comments form with a clever greeting.', 'jetpack' ); ?></p>

		<?php
	}

	/**
	 * Custom Comment Greeting Text
	 *
	 * @since 1.4
	 */
	public function comment_form_greeting_setting() {

		// The greeting.
		$greeting = get_option( 'highlander_comment_form_prompt', $this->default_greeting );
		?>

		<input type="text" name="highlander_comment_form_prompt" id="jetpack-comment-form-greeting" value="<?php echo esc_attr( $greeting ); ?>" class="regular-text">
		<p class="description"><?php esc_html_e( 'A few catchy words to motivate your readers to comment', 'jetpack' ); ?></p>

		<?php
	}

	/**
	 * Sanitize the clever comment greeting
	 *
	 * @since 1.4
	 * @param string $val The contact form greeting string.
	 * @return string
	 */
	public function comment_form_greeting_sanitize( $val ) {

		// Delete if empty or the default.
		if ( empty( $val ) || ( $this->default_greeting === $val ) ) {
			delete_option( 'highlander_comment_form_prompt' );
			return false;
		}

		return wp_kses( $val, array() );
	}
}

Jetpack_Comments_Settings::init();
