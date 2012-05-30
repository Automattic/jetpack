<?php

class Jetpack_Comments_Settings {

	/** Variables *************************************************************/

	/**
	 * The default comment form greeting
	 * @var string
	 */
	var $default_greeting = ''; // Set in constructor

	/**
	 * The default comment form color scheme
	 * @var string
	 */
	var $default_color_scheme = '';

	/**
	 * The default comment form custom CSS url
	 * @var string
	 */
	var $default_custom_css_url = '';

	/**
	 * The default comment form color scheme
	 * @var string
	 */
	var $color_schemes = array();

	public function __construct() {
		// Setup settings
		add_action( 'admin_init', array( $this, 'add_settings' ) );
		$this->setup_globals();
	}

	/** Private Methods *******************************************************/

	/**
	 * Set any global variables or class variables
	 * @since JetpackComments (1.4)
	 */
	protected function setup_globals() {
		// Default option values
		$this->default_greeting       = __( 'Leave a Reply', 'jetpack' );
		$this->default_color_scheme   = 'light';
		$this->default_custom_css_url = '';

		// Possible color schemes
		$this->color_schemes = array(
			'light'        => __( 'Light',        'jetpack' ),
			'dark'         => __( 'Dark',         'jetpack' ),
			'transparent'  => __( 'Transparent',  'jetpack' ),
		);
	}

	/** Settings **************************************************************/

	/**
	 * Add the Jetpack settings to WordPress's discussions page
	 *
	 * @since JetpackComments (1.4)
	 */
	public function add_settings() {

		// Create the section
		add_settings_section(
			'jetpack_comment_form',
			__( 'Jetpack Comments', 'jetpack' ),
			array( $this, 'comment_form_settings_section' ),
			'discussion'
		);

		/** Clever Greeting ***************************************************/

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

		/** Color Scheme ******************************************************/

		add_settings_field(
			'jetpack_comment_form_color_scheme',
			__( 'Color Scheme', 'jetpack' ),
			array( $this, 'comment_form_color_scheme_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'jetpack_comment_form_color_scheme',
			array( $this, 'comment_form_color_scheme_sanitize' )
		);
	}

	/**
	 * Discussions setting section blurb
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_settings_section() {
	?>

		<p><?php _e( 'Trick-out your Jetpack Comments form with a clever greeting, color-scheme, and custom CSS.', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Custom Comment Greeting Text
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_greeting_setting() {

		// The greeting
		$greeting = get_option( 'highlander_comment_form_prompt', $this->default_greeting ); ?>

		<input type="text" name="highlander_comment_form_prompt" id="jetpack-comment-form-greeting" value="<?php echo esc_attr( $greeting ); ?>" class="regular-text">
		<p class="description"><?php _e( 'A few catchy words to motivate your readers to comment', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Sanitize the clever comment greeting
	 *
	 * @since JetpackComments (1.4)
	 * @param type $val
	 * @return string
	 */
	function comment_form_greeting_sanitize( $val ) {

		// Delete if empty or the default
		if ( empty( $val ) || ( $this->default_greeting == $val ) ) {
			delete_option( 'highlander_comment_form_prompt' );
			return false;
		}

		return wp_kses( $val, array() );
	}

	/**
	 * Color Scheme Setting
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_color_scheme_setting() {

		// The color scheme
		$scheme = get_option( 'jetpack_comment_form_color_scheme', $this->default_color_scheme ); ?>

		<fieldset>
			<legend class="screen-reader-text"><?php _e( 'Color Scheme', 'jetpack' ); ?></legend>

			<?php foreach( $this->color_schemes as $key => $label ) : ?>

				<label>
					<input type="radio" name="jetpack_comment_form_color_scheme" id="jetpack-comment-form-color-scheme" value="<?php echo $key; ?>" <?php checked( $scheme, $key ); ?>>
					<?php echo $label; ?>
				</label>
				<br />

			<?php endforeach; ?>

		</fieldset>

	<?php
	}

	/**
	 * Sanitize the color scheme
	 *
	 * @since JetpackComments (1.4)
	 * @param type $val
	 * @return string
	 */
	public function comment_form_color_scheme_sanitize( $val ) {

		// Delete the option if it's the default
		if ( empty( $val ) || !in_array( $val, array_keys( $this->color_schemes ) ) ) {
			delete_option( 'jetpack_comment_form_color_scheme' );
			$val = $this->default_color_scheme;
		}

		return $val;
	}
}

$jetpack_comments_admin = new Jetpack_Comments_Settings;
