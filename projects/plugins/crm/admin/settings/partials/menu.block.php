<?php
/*
!
 * Admin Page Partial: Settings: Menu Block
 * This outputs the left hand menu for settings pages
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

	global $zbs;

	// } Default
	$tabs    = array( 'settings' => 'General' );
	$tabsNew = array(); // slugs included in here will get a new flag

	// } Get Settings
	$settings = $zbs->settings->getAll();

	// } Add hard-typed:
	$tabs['bizinfo']      = __( 'Business Info', 'zero-bs-crm' );
	$tabs['customfields'] = __( 'Custom Fields', 'zero-bs-crm' );
	$tabs['fieldsorts']   = __( 'Field Sorts', 'zero-bs-crm' );
	$tabs['fieldoptions'] = __( 'Field Options', 'zero-bs-crm' );
	$tabs['locale']       = __( 'Locale', 'zero-bs-crm' );
	$tabs['listview']     = __( 'List View', 'zero-bs-crm' );
	$tabs['tax']          = __( 'Tax', 'zero-bs-crm' );
	$tabs['license']      = __( 'CRM License', 'zero-bs-crm' );

if ( $settings['companylevelcustomers'] == 1 ) {
	$tabs['companies'] = __( 'Companies', 'zero-bs-crm' );
}

	// } Load them from proper list :)
	global $zeroBSCRM_extensionsInstalledList;

	// } This will cycle through "installed" extensions and display them as tabs, using their custom funcs to get names, and falling back to a capitalised version of their perma
if ( isset( $zeroBSCRM_extensionsInstalledList ) && is_array( $zeroBSCRM_extensionsInstalledList ) ) {
	foreach ( $zeroBSCRM_extensionsInstalledList as $installedExt ) {

		// } Ignore pages for a min
		global $zbsExtensionsExcludeFromSettings;

		if ( ! in_array( $installedExt, $zbsExtensionsExcludeFromSettings ) ) {

			// } Got name func?
			if ( function_exists( 'zeroBSCRM_extension_name_' . $installedExt ) ) {

				// } Fire it to generate name :)
				$extNameFunc = 'zeroBSCRM_extension_name_' . $installedExt;

				// additional check, that there's actually a settings func to run :)
				if ( function_exists( 'zeroBSCRM_extensionhtml_settings_' . $installedExt ) ) {

					$tabs[ $installedExt ] = call_user_func( $extNameFunc );

				}
			} else {

					// } Fallback to capitalised ver of perm
					// Don't even show, as of 10/1/19
					// if func doesn't exist, screw it
					// ... came ultimately to check for the page setting:
				if ( function_exists( 'zeroBSCRM_extensionhtml_settings_' . $installedExt ) ) {

					$tabs[ $installedExt ] = ucwords( $installedExt );

				}
			}
		}
	}
}

	// Optional:
if ( $settings['feat_transactions'] == 1 ) {
	$tabs['transactions'] = __( 'Transactions', 'zero-bs-crm' );
}
if ( $settings['feat_forms'] == 1 ) {
	$tabs['forms'] = __( 'Forms', 'zero-bs-crm' );
}
if ( $settings['feat_portal'] == 1 ) {
	$tabs['clients'] = __( 'Client Portal', 'zero-bs-crm' );
}
if ( $settings['feat_api'] == 1 ) {
	$tabs['api'] = 'API';
}

	// Base hard-typed:
	$tabs['mail']          = __( 'Mail', 'zero-bs-crm' );
	$tabs['maildelivery']  = __( 'Mail Delivery', 'zero-bs-crm' );
	$tabs['mailtemplates'] = __( 'Mail Templates', 'zero-bs-crm' );
	$tabs['oauth']         = __( 'OAuth Connection', 'zero-bs-crm' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

	// make these filterable for the extensions..
	$tabs = apply_filters( 'zbs_settings_tabs', $tabs );

	// hacky rewrite to add submenu under general/mail, needs genericifying so can use submenus throughout
	$sortedTabs   = array();
	$underGeneral = array( 'customfields', 'fieldsorts', 'fieldoptions', 'locale', 'listview', 'bizinfo', 'tax', 'license' );
	$underMail    = array( 'maildelivery', 'mailtemplates', 'mailcampaigns' );

	// WH this shows $tabs has ones which we excluded above. Possibly due to load order timings?
	global $zbsExtensionsExcludeFromSettings;

	$tabs = apply_filters( 'zbs_settings_tabs', $tabs );

foreach ( $tabs as $tab => $name ) {

	// double check as the above zbs_write_log of $tabs outputs
	/*
	[23-Aug-2018 23:43:05 UTC] Array
	(
		[settings] => General
		[bizinfo] => Business Info
		[customfields] => Custom Fields
		[transactions] => Transactions
		[fieldsorts] => Field Sorts
		[listview] => List View
		[forms] => Front-end Forms
		[clients] => Client Portal
		[api] => API
		[quotebuilder] => Quote Builder
		[invbuilder] => Invoice Builder
		[systememailspro] => System Emails Pro
		[mail] => Mail
		[maildelivery] => Mail Delivery
		[mailtemplates] => Mail Templates
		[bulktag] => Bulk Tagger
	)
	*/

	if ( in_array( $tab, $zbsExtensionsExcludeFromSettings ) ) {
		continue;
	}

	if ( is_array( $name ) && isset( $name['submenu'] ) ) {
		$sortedTabs[ $tab ] = $name;
		continue;
	}

	if ( ! isset( $sortedTabs[ $tab ] ) ) {
		$sortedTabs[ $tab ] = array();
	}
	$sortedTabs[ $tab ]['name'] = $name;
	$sortedTabs[ $tab ]['ico']  = ''; // nothing yet

	if ( in_array( $tab, $underGeneral ) ) {
		if ( ! isset( $sortedTabs['settings'] ) ) {
			$sortedTabs['settings'] = array();
		}
		if ( ! isset( $sortedTabs['settings']['submenu'] ) ) {
			$sortedTabs['settings']['submenu'] = array();
		}
		$sortedTabs['settings']['submenu'][ $tab ] = array(
			'name' => $name,
			'ico'  => '',
		);

		// unset this - hacky
		unset( $sortedTabs[ $tab ] );
	}

	if ( in_array( $tab, $underMail ) ) {
		if ( ! isset( $sortedTabs['mail'] ) ) {
			$sortedTabs['mail'] = array();
		}
		if ( ! isset( $sortedTabs['mail']['submenu'] ) ) {
			$sortedTabs['mail']['submenu'] = array();
		}
		$sortedTabs['mail']['submenu'][ $tab ] = array(
			'name' => $name,
			'ico'  => '',
		);

		// unset this - hacky
		unset( $sortedTabs[ $tab ] );
	}
}

?>
<div class="ui vertical fluid menu" id="zbs-settings-menu">
	<!-- Would be nice to add a cpanel style js search
	<div class="item">
		<div class="ui input"><input type="text" placeholder="Search..."></div>
	</div> -->
	<div class="branding item" id="zbs-settings-head-tour">
		<?php echo esc_html__( 'CRM Settings', 'zero-bs-crm' ); ?>
	</div>

	<?php foreach ( $sortedTabs as $tab => $tabArr ) : ?>

		<?php
		// could/should expand this to have icons + submenus
		// as per example under "sub menu" here: https://semantic-ui.com/collections/menu.html
		$ico = '';
		if ( isset( $tabArr['ico'] ) ) {
			$ico = $tabArr['ico'];
		}
		$name = '';
		if ( isset( $tabArr['name'] ) ) {
			$name = $tabArr['name'];
		}
		?>

		<?php if ( isset( $tabArr['submenu'] ) && count( $tabArr['submenu'] ) > 0 ) { ?>
			<div class="item">
				<a class='item zbs-settings-head <?php echo ( $tab == $current ) ? ' active' : ''; ?>>' href='?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=<?php echo esc_attr( $tab ); ?>'><?php echo esc_html( $ico . $name ); ?></a>
				<div class="menu">
				<?php foreach ( $tabArr['submenu'] as $tab2 => $tabArr2 ) { ?>

					<?php
						$ico2  = $tabArr2['ico'];
						$name2 = $tabArr2['name'];
						$new   = '';
					if ( in_array( $tab2, $tabsNew ) ) {
						$new = '<span class="ui label green tiny">New</span>';
					}
						$url = admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=' . $tab2 );
						// temporary hard typed exception
					if ( $tab2 == 'mailtemplates' ) {
						$url = admin_url( 'admin.php?page=' . $zbs->slugs['email-templates'] );
					}
						$class = ( $tab2 == $current ) ? ' active' : '';
					?>

					<a class='item <?php echo esc_attr( $class ); ?>' href='<?php echo esc_url( $url ); ?>'><?php echo esc_html( $new . $ico2 . $name2 ); ?></a>

				<?php } ?>
				</div>
			</div>

		<?php } else { ?>

			<a class='item <?php echo ( $tab == $current ) ? ' active' : ''; ?>' href='?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=<?php echo esc_attr( $tab ); ?>'><?php echo esc_html( $ico . $name ); ?></a>

		<?php } ?>

	<?php endforeach ?>
	<?php ##WLREMOVE ?>
	<a class="item" href="<?php echo jpcrm_esc_link( $zbs->slugs['extensions'] ); ?>"><i class="ui orange puzzle piece icon"></i> <?php echo esc_html__( 'Extensions', 'zero-bs-crm' ); ?></a>
	<?php ##/WLREMOVE ?>
	<a class="item" href="<?php echo jpcrm_esc_link( wp_nonce_url( $zbs->slugs['settings'] . '&resetsettings=1' ) ); ?> "> <?php echo esc_html__( 'Restore default settings', 'zero-bs-crm' ); ?></a>
</div>
