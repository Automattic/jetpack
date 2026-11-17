<?php
/**
 * Where Jetpack offers the usage tracking setting once it leaves Jetpack › Settings.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\Redirect;

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
						<p><?php esc_html_e( 'Choose whether to share information with our analytics tool about your use of services while logged in to your WordPress.com account.', 'jetpack' ); ?></p>
						<p>
							<a href="<?php echo esc_url( self::WPCOM_PRIVACY_URL ); ?>" target="_blank" rel="noopener noreferrer">
								<?php esc_html_e( 'Manage your usage information on WordPress.com', 'jetpack' ); ?>
								<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'jetpack' ); ?></span>
								<span aria-hidden="true">↗</span>
							</a>
						</p>
						<p class="description">
							<?php
							self::print_linked_sentence(
								/* translators: %1$s: URL of the Automattic privacy policy. %2$s: "(opens in a new tab)", read only by screen readers. */
								__( 'This information helps us improve our products, make marketing to you more relevant, personalize your WordPress.com experience, and more as detailed in our <a href="%1$s" target="_blank" rel="noopener noreferrer">privacy policy%2$s</a>.', 'jetpack' ),
								Redirect::get_url( 'a8c-privacy' )
							);
							?>
						</p>
						<p class="description">
							<?php
							self::print_linked_sentence(
								/* translators: %1$s: URL of the Automattic cookie policy. %2$s: "(opens in a new tab)", read only by screen readers. */
								__( 'We use other tracking tools, including some from third parties. <a href="%1$s" target="_blank" rel="noopener noreferrer">Read about these%2$s</a> and how to control them.', 'jetpack' ),
								Redirect::get_url( 'a8c-cookies' )
							);
							?>
						</p>
						<p class="description">
							<?php
							self::print_linked_sentence(
								/* translators: %1$s: URL of the Jetpack Privacy Center. %2$s: "(opens in a new tab)", read only by screen readers. */
								__( 'For more information on how specific Jetpack features use data and track activity, please refer to our <a href="%1$s" target="_blank" rel="noopener noreferrer">Privacy Center%2$s</a>.', 'jetpack' ),
								Redirect::get_url( 'jetpack-support-privacy' )
							);
							?>
						</p>
					</td>
				</tr>
			</table>
		</div>
		<?php
	}

	/**
	 * Print a translated sentence whose link opens in a new tab.
	 *
	 * @param string $text Sentence with the link's URL as %1$s and its screen reader text as %2$s.
	 * @param string $url  Link URL.
	 * @return void
	 */
	private static function print_linked_sentence( $text, $url ) {
		$new_tab = '<span class="screen-reader-text">' . esc_html__( '(opens in a new tab)', 'jetpack' ) . '</span>';

		echo wp_kses(
			sprintf( $text, esc_url( $url ), $new_tab ),
			array(
				'a'    => array(
					'href'   => array(),
					'target' => array(),
					'rel'    => array(),
				),
				'span' => array( 'class' => array() ),
			)
		);
	}
}

Jetpack_Privacy_Settings_Home::init();
