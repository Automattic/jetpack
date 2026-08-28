<?php
/**
 * Registers the integrations that ship with Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\External_Connections;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Automattic\Jetpack\Forms\Service\Google_Drive;
use Automattic\Jetpack\Status\Host;

/**
 * The bundled integrations, declared through the same public API a plugin would use.
 *
 * Nothing here reaches past jetpack_forms_register_integration(). If a bundled integration
 * cannot be expressed through the registry, that is a gap in the registry, not a reason for a
 * private side door — the six below are the test of whether the API is actually sufficient.
 */
class Built_In_Integrations {

	/**
	 * Whether the bundled integrations have been registered.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Register the bundled integrations.
	 *
	 * Hooked to `init`, because the titles and descriptions are translated and the package
	 * loads before WordPress is ready to translate. It is also called lazily the first time
	 * the registry is read, so a caller that somehow gets there first still sees a populated
	 * registry rather than an empty one. Calling it twice is a no-op.
	 *
	 * @return void
	 */
	public static function register() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		$assets_url = trailingslashit( Jetpack_Forms::assets_url() ) . 'images/integrations/';

		jetpack_forms_register_integration(
			'akismet',
			array(
				'type'                    => 'plugin',
				'file'                    => 'akismet/akismet.php',
				'settings_url'            => 'admin.php?page=akismet-key-config',
				'marketing_redirect_slug' => 'org-spam',
				'title'                   => __( 'Akismet Spam Protection', 'jetpack-forms' ),
				'subtitle'                => __( 'Akismet filters out form spam with 99% accuracy', 'jetpack-forms' ),
				'active_tooltip'          => __( 'This form is protected with Akismet spam protection.', 'jetpack-forms' ),
				'enabled_by_default'      => false,
				'icon_url'                => $assets_url . 'akismet.svg',
			)
		);

		jetpack_forms_register_integration(
			'zero-bs-crm',
			array(
				'type'                    => 'plugin',
				'file'                    => 'zero-bs-crm/ZeroBSCRM.php',
				'settings_url'            => 'admin.php?page=zerobscrm-plugin-settings',
				'marketing_redirect_slug' => 'org-crm',
				'title'                   => __( 'Jetpack CRM', 'jetpack-forms' ),
				'subtitle'                => __( 'Store contact form submissions in your CRM', 'jetpack-forms' ),
				'active_tooltip'          => __( 'Jetpack CRM is connected for this form.', 'jetpack-forms' ),
				'enabled_by_default'      => false,
				'icon_url'                => $assets_url . 'zero-bs-crm.svg',
				// A bare boolean rather than a settings object, so it names the setting it stands for.
				'settings_attribute'      => array(
					'name'    => 'jetpackCRM',
					'maps_to' => 'enabled',
				),
			)
		);

		jetpack_forms_register_integration(
			'salesforce',
			array(
				'type'               => 'service',
				'title'              => __( 'Salesforce', 'jetpack-forms' ),
				'subtitle'           => __( 'Send form contacts to Salesforce', 'jetpack-forms' ),
				'active_tooltip'     => __( 'Salesforce is connected for this form.', 'jetpack-forms' ),
				'enabled_by_default' => false,
				'icon_url'           => $assets_url . 'salesforce.svg',
				'settings_attribute' => 'salesforceData',
			)
		);

		jetpack_forms_register_integration(
			'google-drive',
			array(
				'type'               => 'service',
				'title'              => __( 'Google Sheets', 'jetpack-forms' ),
				'subtitle'           => __( 'Export form responses to Google Sheets.', 'jetpack-forms' ),
				'active_tooltip'     => __( 'Google Sheets is connected for this form.', 'jetpack-forms' ),
				'enabled_by_default' => false,
				'icon_url'           => $assets_url . 'google-drive.svg',
				'status_callback'    => array( self::class, 'google_drive_status' ),
			)
		);

		jetpack_forms_register_integration(
			'mailpoet',
			array(
				'type'                    => 'plugin',
				'file'                    => 'mailpoet/mailpoet.php',
				'settings_url'            => 'admin.php?page=mailpoet-homepage',
				'marketing_redirect_slug' => 'org-mailpoet',
				'title'                   => __( 'MailPoet email marketing', 'jetpack-forms' ),
				'subtitle'                => __( 'Send newsletters and marketing emails directly from your site.', 'jetpack-forms' ),
				'active_tooltip'          => __( 'MailPoet is connected for this form.', 'jetpack-forms' ),
				'enabled_by_default'      => false,
				'icon_url'                => $assets_url . 'mailpoet.svg',
				'settings_attribute'      => 'mailpoet',
			)
		);

		jetpack_forms_register_integration(
			'hostinger-reach',
			array(
				'type'                    => 'plugin',
				'file'                    => 'hostinger-reach/hostinger-reach.php',
				'settings_url'            => 'admin.php?page=hostinger-reach#/home',
				'marketing_redirect_slug' => 'hostinger-reach',
				'title'                   => __( 'Hostinger Reach', 'jetpack-forms' ),
				'subtitle'                => __( 'Send newsletters and marketing emails via Hostinger Reach.', 'jetpack-forms' ),
				'active_tooltip'          => __( 'Hostinger Reach is connected for this form.', 'jetpack-forms' ),
				'enabled_by_default'      => false,
				'icon_url'                => $assets_url . 'hostinger-reach.svg',
				'settings_attribute'      => 'hostingerReach',
				// Previously a hardcoded conditional around the whole registration.
				'is_available'            => array( Jetpack_Forms::class, 'is_hostinger_reach_enabled' ),
			)
		);
	}

	/**
	 * Allow the bundled integrations to be registered again.
	 *
	 * Only intended for tests, which reset the registry between cases.
	 *
	 * @return void
	 */
	public static function reset() {
		self::$registered = false;
	}

	/**
	 * Connection state for Google Sheets.
	 *
	 * Google Sheets is reached through the user's WordPress.com connection, so a site-level
	 * Jetpack connection is not enough on its own.
	 *
	 * @param array $status The base status shape.
	 * @return array The status with Google Sheets' own connection state merged in.
	 */
	public static function google_drive_status( array $status ) {
		$jetpack_connected = ( new Host() )->is_wpcom_simple()
			|| ( new Connection_Manager( 'jetpack-forms' ) )->is_user_connected( get_current_user_id() );

		$status['isConnected'] = $jetpack_connected && Google_Drive::has_valid_connection();
		$status['settingsUrl'] = External_Connections::get_connect_url( 'google-drive' );

		return $status;
	}
}
