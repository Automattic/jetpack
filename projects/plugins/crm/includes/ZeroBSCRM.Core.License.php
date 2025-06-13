<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4+
 *
 * Copyright 2020 Automattic
 *
 * Date: 05/02/2017
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}

// System Nag messages for license key and upgrades

add_action( 'wp_after_admin_bar_render', 'jpcrm_admin_nag_footer', 12 );
/**
 * This will nag if there's anytihng amiss with the settings.
 */
function jpcrm_admin_nag_footer() {

	global $zbs;

	// only nag if paid extensions are active
	if ( $zbs->extensionCount( true ) > 0 ) {
		// if transient already set, nothing to do
		if ( get_transient( 'jpcrm-license-modal' ) ) {
			return;
		}

		// if not in dev mode (as we can't add a key in dev mode currently)
		if ( ! zeroBSCRM_isLocal( true ) ) {

			// on one of our pages except settings
			if ( zeroBSCRM_isAdminPage() && ( ( isset( $_GET['page'] ) && $_GET['page'] !== 'zerobscrm-plugin-settings' ) || ( ! isset( $_GET['page'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

				// retrieve license
				$license = zeroBSCRM_getSetting( 'license_key' );
				if ( isset( $license ) && ! empty( $license ) ) {

					// License key is empty
					if ( ( isset( $license['key'] ) && $license['key'] === '' ) || ! isset( $license['key'] ) ) {

						// build message
						$message  = '<h3>' . __( 'License Key Needed', 'zero-bs-crm' ) . '</h3>';
						$message .= '<p>' . __( 'To continue to use CRM extensions you need will need to enter your Jetpack CRM license key.', 'zero-bs-crm' ) . '</p>';
						$message .= '<p><a href="' . esc_url_raw( $zbs->urls['licensekeys'] ) . '" class="ui button green" target="_blank">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=license' ) . '" class="ui button blue">' . __( 'License Settings', 'zero-bs-crm' ) . '</a></p>';

						// output modal
						jpcrm_show_admin_nag_modal( $message );
						return;

					}

					// License key is not valid
					if ( ! $license['validity'] && $license['extensions_updated'] ) {

						// build message
						$message  = '<h3>' . __( 'License Key Incorrect', 'zero-bs-crm' ) . '</h3>';
						$message .= '<p>' . __( 'Please update your license key. You can get your license key from your account and enter it in settings.', 'zero-bs-crm' ) . '</p>';
						$message .= '<p><a href="' . $zbs->urls['kblicensefaq'] . '" class="ui button blue" target="_blank">' . __( 'Read about license keys', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . $zbs->urls['licensekeys'] . '" target="_blank" class="ui button green">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a></p>';

						// output modal
						jpcrm_show_admin_nag_modal( $message );
						return;
					}

					// Extensions need updating
					if ( isset( $license['extensions_updated'] ) && ! $license['extensions_updated'] ) {

						// build message
						$message = '<h3>' . __( 'Extension Update Required', 'zero-bs-crm' ) . '</h3>';
						if ( $license['validity'] === 'empty' ) {

							// no license
							$message .= '<p>' . __( 'You are running extension versions which are not supported. Please enter your license key to enable updates.', 'zero-bs-crm' ) . '</p>';
							$message .= '<p><a href="' . $zbs->urls['licensekeys'] . '" class="ui button green" target="_blank">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=license' ) . '" class="ui button blue">' . __( 'License Settings', 'zero-bs-crm' ) . '</a></p>';

							// output modal
							jpcrm_show_admin_nag_modal( $message );
							return;

						} elseif ( ! $license['validity'] ) {

							// invalid license
							$message .= '<p>' . __( 'You are running extension versions which are not supported. Please enter a valid license key to enable updates.', 'zero-bs-crm' ) . '</p>';
							$message .= '<p><a href="' . $zbs->urls['kblicensefaq'] . '" class="ui button blue" target="_blank">' . __( 'Read about license keys', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . $zbs->urls['licensekeys'] . '" target="_blank" class="ui button green">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a></p>';

							// output modal
							jpcrm_show_admin_nag_modal( $message );
							return;

						}
					}
				}
			}
		} // / is not local/devmode (normal)

	}
}

/**
 * Show admin nag modal (e.g. if no license, but extensions)
 *
 * @param string $message The message to display in the modal.
 */
function jpcrm_show_admin_nag_modal( $message = '' ) {

	if ( ! get_transient( 'jpcrm-license-modal' ) ) {

		?>
		<script type="text/javascript">var jpcrm_modal_message_licensing_nonce = '<?php echo esc_js( wp_create_nonce( 'jpcrm-set-transient-nonce' ) ); ?>';</script>
		<div class="zbs_overlay" id="jpcrm-modal-message-licensing">
			<div class='close_nag_modal'>
				<span id="jpcrm-close-licensing-modal">x</span>
			</div>
			<div class='zbs-message-body'>
				<img style="max-width:350px;margin-bottom:1.4em" src="<?php echo esc_url( jpcrm_get_logo( false, 'white' ) ); ?>" alt="" style="cursor:pointer;" />
				<div class='zbs-message'>
					<?php
					echo $message; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
				</div>
			</div>
		</div>
		<?php

	}
}

/*
 * License related funcs
 */

/**
 * Force an update check (and update keys)
 */
function jpcrm_verify_license_with_server() {
	global $zbs;
	$plugin_updater = new zeroBSCRM_Plugin_Updater( $zbs->urls['api'], $zbs->api_ver, 'zero-bs-crm' );
	$zbs_transient  = new stdClass();
	$plugin_updater->check_update( $zbs_transient );
}

/**
 * Checks if license is valid based on stored settings.
 *
 * Best used for simple checks like upsells.
 *
 * @return bool Whether license is valid.
 */
function jpcrm_is_license_valid() {
	$license_info = zeroBSCRM_getSetting( 'license_key' );
	$is_valid     = isset( $license_info['validity'] ) && $license_info['validity'] === 'true';
	return $is_valid;
}

/**
 * Gets a list of multi site
 */
function jpcrm_multisite_get_site_list() {
	global $wpdb;
	$sites = array();
	$table = $wpdb->prefix . 'blogs';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table'" ) === $table ) { // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$sql   = "SELECT * FROM $table";
		$sites = $wpdb->get_results( $sql ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
	}

	// clean up (reduce bandwidth of pass/avoid overburdening)
	if ( is_array( $sites ) && count( $sites ) > 0 ) {
		$ret = array();
		foreach ( $sites as $site ) {
			$ret[] = jpcrm_tidy_multisite_site( $site );
		}
		$sites = $ret;
	}

	return $sites;
}

/**
 * Tidies up a multisite site row for processing.
 *
 * @param object $site_row The site row data to tidy up.
 * @return array|false The tidied site data or false if invalid.
 */
function jpcrm_tidy_multisite_site( $site_row ) {

	if ( isset( $site_row->blog_id ) ) {

		// active if not archived, spam, deleted
		$is_active = 1;
		if ( $site_row->archived ) {
			$is_active = -1;
		}
		if ( $site_row->spam ) {
			$is_active = -1;
		}
		if ( $site_row->deleted ) {
			$is_active = -1;
		}

		return array(

			// not req. always same??
			'site_id'  => $site_row->site_id,
			'blog_id'  => $site_row->blog_id,

			'domain'   => $site_row->domain,
			'path'     => $site_row->path,

			// active if not archived, spam, deleted
			'active'   => $is_active,

			// log these (useful)
			'deleted'  => $site_row->deleted,
			'archived' => $site_row->archived,
			'spam'     => $site_row->spam,
			'lang_id'  => $site_row->lang_id,

		);

	}

	return false;
}
