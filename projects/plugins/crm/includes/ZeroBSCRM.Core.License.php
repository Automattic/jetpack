<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4+
 *
 * Copyright 2020 Automattic
 *
 * Date: 05/02/2017
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// } System Nag messages for license key and upgrades

add_action( 'wp_after_admin_bar_render', 'zeroBSCRM_admin_nag_footer', 12 );
// } This will nag if there's anytihng amiss with the settings
function zeroBSCRM_admin_nag_footer() {

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
			if ( zeroBSCRM_isAdminPage() && ( ( isset( $_GET['page'] ) && $_GET['page'] != 'zerobscrm-plugin-settings' ) || ( ! isset( $_GET['page'] ) ) ) ) {

				// retrieve license
				$license = zeroBSCRM_getSetting( 'license_key' );
				if ( isset( $license ) && ! empty( $license ) ) {

					// License key is empty
					if ( ( isset( $license['key'] ) && $license['key'] == '' ) || ! isset( $license['key'] ) ) {

						// build message
						$message  = '<h3>' . __( 'License Key Needed', 'zero-bs-crm' ) . '</h3>';
						$message .= '<p>' . __( 'To continue to use CRM extensions you need will need to enter your Jetpack CRM license key.', 'zero-bs-crm' ) . '</p>';
						$message .= '<p><a href="' . esc_url_raw( $zbs->urls['licensekeys'] ) . '" class="ui button green" target="_blank">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=license' ) . '" class="ui button blue">' . __( 'License Settings', 'zero-bs-crm' ) . '</a></p>';

						// output modal
						zeroBSCRM_show_admin_nag_modal( $message );
						return;

					}

					// License key is not valid
					if ( $license['validity'] == false && $license['extensions_updated'] != false ) {

						// $message = __('Your License Key is Incorrect. Please update your license key for this site.', 'zero-bs-crm');
						// zeroBSCRM_show_admin_bottom_nag($message);

						// build message
						$message  = '<h3>' . __( 'License Key Incorrect', 'zero-bs-crm' ) . '</h3>';
						$message .= '<p>' . __( 'Please update your license key. You can get your license key from your account and enter it in settings.', 'zero-bs-crm' ) . '</p>';
						$message .= '<p><a href="' . $zbs->urls['kblicensefaq'] . '" class="ui button blue" target="_blank">' . __( 'Read about license keys', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . $zbs->urls['licensekeys'] . '" target="_blank" class="ui button green">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a></p>';

						// output modal
						zeroBSCRM_show_admin_nag_modal( $message );
						return;
					}

					// Extensions need updating
					if ( isset( $license['extensions_updated'] ) && $license['extensions_updated'] == false ) {

						// $message = __('You are running extension versions which are not supported. Please update immediately to avoid any issues.', 'zero-bs-crm');
						// zeroBSCRM_show_admin_bottom_nag($message);

						// build message
						$message = '<h3>' . __( 'Extension Update Required', 'zero-bs-crm' ) . '</h3>';
						if ( $license['validity'] == 'empty' ) {

							// no license
							$message .= '<p>' . __( 'You are running extension versions which are not supported. Please enter your license key to enable updates.', 'zero-bs-crm' ) . '</p>';
							$message .= '<p><a href="' . $zbs->urls['licensekeys'] . '" class="ui button green" target="_blank">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=license' ) . '" class="ui button blue">' . __( 'License Settings', 'zero-bs-crm' ) . '</a></p>';

							// output modal
							zeroBSCRM_show_admin_nag_modal( $message );
							return;

						} elseif ( $license['validity'] == false ) {

							// invalid license
							$message .= '<p>' . __( 'You are running extension versions which are not supported. Please enter a valid license key to enable updates.', 'zero-bs-crm' ) . '</p>';
							$message .= '<p><a href="' . $zbs->urls['kblicensefaq'] . '" class="ui button blue" target="_blank">' . __( 'Read about license keys', 'zero-bs-crm' ) . '</a>&nbsp;&nbsp;&nbsp;<a href="' . $zbs->urls['licensekeys'] . '" target="_blank" class="ui button green">' . __( 'Retrieve License Key', 'zero-bs-crm' ) . '</a></p>';

							// output modal
							zeroBSCRM_show_admin_nag_modal( $message );
							return;

						} else {

							// valid license
							// Suppressing here because it came across as a bit intense
							// $message .= '<p>'.__('You are running extension versions which are not supported. Please update your extension plugins immediately.', 'zero-bs-crm').'</p>';
							// $message .= '<p><button class="jpcrm-licensing-modal-set-transient-and-go ui button green" data-href="'.esc_url(admin_url('plugins.php')).'">'.__('Update Plugins','zero-bs-crm').'</button></p>';

						}
					}
				}
			}
		} // / is not local/devmode (normal)

	}
}

function zeroBSCRM_show_admin_bottom_nag( $message = '' ) {

	?><div class='zbs_nf'>
		<i class='ui icon warning'></i><?php echo $message; ?>
	</div>
	<?php
}

// Show admin nag modal (e.g. if no license, but extensions)
function zeroBSCRM_show_admin_nag_modal( $message = '' ) {

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
					<?php echo $message; ?>
				</div>
			</div>
		</div>
		<?php

	}
}

/*
======================================================
	License related funcs
	====================================================== */

function zeroBSCRM_license_check() {
	global $zbs;
	// this should force an update check (and update keys)
	$pluginUpdater = new zeroBSCRM_Plugin_Updater( $zbs->urls['api'], $zbs->api_ver, 'zero-bs-crm' );
	$zbs_transient = new stdClass();
	$pluginUpdater->check_update( $zbs_transient );
}

	// } gets a list of multi site
function zeroBSCRM_multisite_getSiteList() {
	global $wpdb;
	$sites = array();
	$table = $wpdb->prefix . 'blogs';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table'" ) == $table ) {
		$sql   = "SELECT * FROM $table";
		$sites = $wpdb->get_results( $sql );
	}

	// clean up (reduce bandwidth of pass/avoid overburdening)
	if ( is_array( $sites ) && count( $sites ) > 0 ) {
		$ret = array();
		foreach ( $sites as $site ) {
			$ret[] = zeroBSCRM_tidy_multisite_site( $site );
		}
		$sites = $ret;
	}

	return $sites;

	// debug print_r(zeroBSCRM_multisite_getSiteList()); exit();

	/*
		we don't need all this

		[blog_id] => 1
		[site_id] => 1
		[domain] => multisitetest.local
		[path] => /
		[registered] => 2018-08-10 15:29:31
		[last_updated] => 2018-08-10 15:30:43
		[public] => 1
		[archived] => 0
		[mature] => 0
		[spam] => 0
		[deleted] => 0
		[lang_id] => 0
	*/
}

function zeroBSCRM_tidy_multisite_site( $siteRow = array() ) {

	if ( isset( $siteRow->blog_id ) ) {

		// active if not archived, spam, deleted
		$isActive = 1;
		if ( $siteRow->archived ) {
			$isActive = -1;
		}
		if ( $siteRow->spam ) {
			$isActive = -1;
		}
		if ( $siteRow->deleted ) {
			$isActive = -1;
		}

		return array(

			// not req. always same??
			'site_id'  => $siteRow->site_id,
			'blog_id'  => $siteRow->blog_id,

			'domain'   => $siteRow->domain,
			'path'     => $siteRow->path,

			// active if not archived, spam, deleted
			'active'   => $isActive,

			// log these (useful)
			'deleted'  => $siteRow->deleted,
			'archived' => $siteRow->archived,
			'spam'     => $siteRow->spam,
			'lang_id'  => $siteRow->lang_id,

				// not req. / not useful
				// 'mature' => $siteRow->mature,
				// 'public' => $siteRow->public,
				// 'registered' => $siteRow->registered,
				// 'last_updated' => $siteRow->last_updated,

		);

	}

	return false;
}

/*
======================================================
	/ License related funcs
	====================================================== */
