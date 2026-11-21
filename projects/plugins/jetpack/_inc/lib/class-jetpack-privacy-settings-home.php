<?php
/**
 * Where Jetpack offers the usage tracking setting once it leaves Jetpack › Settings.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\My_Jetpack\Initializer;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Gives the usage tracking setting a section on the user's Profile page once Jetpack › Settings drops its Privacy card.
 *
 * @since $$next-version$$
 */
class Jetpack_Privacy_Settings_Home {

	/**
	 * The WordPress.com page that holds the setting, the user's "Usage information" choice.
	 *
	 * @var string
	 */
	const WPCOM_PRIVACY_URL = 'https://wordpress.com/me/privacy';

	/**
	 * Hook the Profile page section.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'profile_personal_options', array( __CLASS__, 'render_profile_section' ) );
	}

	/**
	 * Whether Jetpack › Settings drops its Privacy card, read the way the Settings app reads it.
	 *
	 * @return bool
	 */
	public static function is_moved_off_settings() {
		return class_exists( Initializer::class )
			&& method_exists( Initializer::class, 'is_settings_consolidation_enabled' )
			&& Initializer::is_settings_consolidation_enabled();
	}

	/**
	 * Print the Profile page section.
	 *
	 * @return void
	 */
	public static function render_profile_section() {
		if ( ! self::is_moved_off_settings() ) {
			return;
		}

		?>
		<div id="jetpack-privacy">
			<h2><?php esc_html_e( 'Jetpack Privacy Settings', 'jetpack' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( 'Usage Information', 'jetpack' ); ?></th>
					<td>
						<a href="<?php echo esc_url( self::WPCOM_PRIVACY_URL ); ?>" target="_blank" rel="noopener noreferrer">
							<?php esc_html_e( 'Manage usage information on WordPress.com', 'jetpack' ); ?>
							<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'jetpack' ); ?></span>
							<span aria-hidden="true">↗</span>
						</a>
					</td>
				</tr>
			</table>
		</div>
		<?php
	}
}

Jetpack_Privacy_Settings_Home::init();
