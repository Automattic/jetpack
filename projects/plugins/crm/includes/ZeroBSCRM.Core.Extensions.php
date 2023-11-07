<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.18
 *
 * Copyright 2020 Automattic
 *
 * Date: 30/08/16
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

/*
======================================================
	EXTENSION Globals
	====================================================== */

	// this is filtered in core, so if you want to remove/add to this
	// hook into zbs_exclude_from_settings filter
	global $zbsExtensionsExcludeFromSettings;
$zbsExtensionsExcludeFromSettings = array( 'pdfinv', 'csvimporterlite', 'portal', 'cf7', 'cal', 'batchtagger', 'salesdash', 'envato', 'bulktag', 'clientportalpro', 'mailcampaigns', 'apiconnector', 'contactform7', 'awesomesupport', 'membermouse', 'bulktagger', 'systememailspro', 'woo', 'wpa', 'advancedsegments', 'contactform', 'pay' );

/*
======================================================
	EXTENSION Globals
	====================================================== */

/*
======================================================
	EXTENSION FUNCS
	====================================================== */

// } function to detect what extensions are installed
// } ONLY WORKS after plugins_loaded
// } see https://codex.wordpress.org/Plugin_API/Action_Reference
function zeroBSCRM_extensionsInstalled() {

	// } This list var will be populated via do_action at top of every extension
	global $zeroBSCRM_extensionsInstalledList;
	return $zeroBSCRM_extensionsInstalledList;
}

// } function to return all extensions inc what extensions are installed
// } ONLY WORKS after plugins_loaded
// } see https://codex.wordpress.org/Plugin_API/Action_Reference
function zeroBSCRM_extensionsList() {
	global $zbs;

	// } This list is all extensions + which are free
	global $zeroBSCRM_extensionsCompleteList;

	// get free
	$freeExts = zeroBSCRM_extensions_free( true );

	// } Process full list inc what's on/off
	$ret = array(); foreach ( $zeroBSCRM_extensionsCompleteList as $extKey => $extObj ) {

		// } Get name
		$extName = $extKey;
		if ( function_exists( 'zeroBSCRM_extension_name_' . $extKey ) == 'function' ) {
			$extName = call_user_func( 'zeroBSCRM_extension_name_' . $extKey );
		}
		// } if not, usefallback
		if ( $extName == $extKey && isset( $extObj['fallbackname'] ) ) {
			$extName = $extObj['fallbackname'];
		}

		$ret[ $extKey ] = array(
			'name'      => $extName,
			'installed' => zeroBSCRM_isExtensionInstalled( $extKey ),
			'free'      => in_array( $extKey, $freeExts ),
			'meta'      => $extObj,
		);

	}

	return $ret;
}

// } Returns a list split into FREE / PAID
function zeroBSCRM_extensionsListSegmented() {

	$exts = zeroBSCRM_extensionsList();

	// } Sort em
	$ret = array(
		'free' => array(),
		'paid' => array(),
	);
	foreach ( $exts as $extKey => $ext ) {

		if ( $ext['free'] ) {
			$ret['free'][ $extKey ] = $ext;
		} else {
			$ret['paid'][ $extKey ] = $ext;
		}
	}

	return $ret;
}

// } Returns a list of possible PAID exts
function zeroBSCRM_extensionsListPaid( $onlyInstalledAndActive = false ) {

	$exts = zeroBSCRM_extensionsList();

	// } Sort em
	$ret = array();
	foreach ( $exts as $extKey => $ext ) {

		if ( ! $ext['free'] ) {

			if ( $onlyInstalledAndActive ) {

				if ( isset( $ext['installed'] ) && $ext['installed'] ) {
					$ret[ $extKey ] = $ext;
				}
			} else {
				$ret[ $extKey ] = $ext;
			}
		}
	}

	return $ret;
}

// } Returns a list of installed PAID exts
function zeroBSCRM_activeInstalledProExt() {

	return zeroBSCRM_extensionsListPaid( true );
}

// This is a meshing of Mikes method + our existing ext system
// it catches:
// Installed, branded extensions
// Installed, rebranded extensions
// Installed, unactive, branded extensions
// DOES NOT FIND:
// Installed, unactive, rebranded extensions
// ... does this by checking actives for NAMES
// ... and checking our installed ext func
// REturns array of arrays(name=>,key=>,slug=>) (where possible)
/*
e.g.
(
	[Automations] => Array
		(
			[name] => Automations
			[key] => automations
			[slug] =>
			[active] => 1
		)

	[Mail Campaigns] => Array
		(
			[name] => Jetpack CRM Extension: Mail Campaigns
			[key] => mailcampaigns
			[slug] => zero-bs-extension-mailcamps/ZeroBSCRM_MailCampaigns.php
			[active] => -1
		)

)

// note keepAllVars allows stripping of unnecessary vars (pre send to update.)
*/
function zeroBSCRM_installedProExt( $ignoreIfCantFindSlug = false, $keepAllVars = false, $ignoreIfCantFindKey = true ) {

	$ret = array();

	// first go through our 'installedExt'
	$zbsExtInstalled = zeroBSCRM_activeInstalledProExt();

	if ( is_array( $zbsExtInstalled ) ) {
		foreach ( $zbsExtInstalled as $k => $deets ) {

			// will have all but only slug where ext's have this:
			$slug = '';
			$file = ''; if ( function_exists( 'zeroBSCRM_extension_file_' . $k ) ) {
						$file = call_user_func( 'zeroBSCRM_extension_file_' . $k );
						$slug = plugin_basename( $file );
			}

			// if here, MUST be active :)
			$ret[ $deets['name'] ] = array(
				'name'   => $deets['name'],
				'key'    => $k,
				'slug'   => $slug,
				'active' => 1,
				'ver'    => '',
				'file'   => $file,
			);

		}
	}

	// from: https://codex.wordpress.org/Function_Reference/get_plugins
	// Check if get_plugins() function exists. This is required on the front end of the
	// site, since it is in a file that is normally only loaded in the admin.
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	// then go through installed plugins and try and grab any deactivated via name
	$zbs_all = get_plugins();

	if ( is_array( $zbs_all ) ) {
		foreach ( $zbs_all as $slug => $v ) {

			// } JetpackRebrandRelook
			if ( $v['Name'] !== 'Jetpack CRM' && stripos( '#' . $v['Name'], 'Jetpack CRM' ) > 0 ) {

				// is a branded one of ours (probably)

				// cleaned name
				$cleanName = str_replace( 'Jetpack CRM Extension: ', '', $v['Name'] );

				if ( ! isset( $ret[ $cleanName ] ) ) {

					// attempt to find deets
					$key           = '';
					$potentialItem = zeroBSCRM_returnExtensionDetailsFromName( $cleanName );
					if ( is_array( $potentialItem ) ) {
						$key = $potentialItem['key'];
					}

					$active = -1;
					if ( is_plugin_active( $slug ) ) {
						$active = 1;
					}

					$ret[ $cleanName ] = array(
						'name'   => $v['Name'],
						'key'    => $key,
						'slug'   => $slug,
						'active' => $active,
						'ver'    => $v['Version'],
						'file'   => '',
					);

				} else {

					// was set by zeroBSCRM_activeInstalledProExt() above, so fill in any missing details :)
					if ( empty( $ret[ $cleanName ]['ver'] ) ) {
						$ret[ $cleanName ]['ver'] = $v['Version'];
					}
				}
			} else {

				// either CORE crm, or other plugin, or REBRANDED ver of ext
				// try to catch deactivated rebranded vers?
				// LICENSING3.0 TODO

			}
		} // / foreach plugin
	}

	// go through RET + get versions where needed :) + weed out $ignoreIfCantFindSlug
	$finalReturn = array();

	foreach ( $ret as $extName => $ext ) {

		$extA = $ext;
		if ( empty( $ext['ver'] ) && ! empty( $ext['file'] ) ) {
			$pluginFullDeets = get_plugin_data( $ext['file'] );
			if ( is_array( $pluginFullDeets ) && isset( $pluginFullDeets['Version'] ) ) {
				$extA['ver'] = $pluginFullDeets['Version'];
			}
			// might as well copy over name if here too :)
			if ( is_array( $pluginFullDeets ) && isset( $pluginFullDeets['Name'] ) ) {
				$extA['name'] = $pluginFullDeets['Name'];
			}
		}

		// strip these (unnecessary vars)
		if ( ! $keepAllVars ) {
			unset( $extA['file'] );
		}

		// finally, clean any slugs which are coming through as zero-bs-extension-csv-importer/ZeroBSCRM_CSVImporter.php instaed of ZeroBSCRM_CSVImporter.php
		// (but keep full in 'path')
		if ( strpos( $extA['slug'], '/' ) > 0 ) {

			$extA['path'] = $extA['slug'];
			$extA['slug'] = substr( $extA['slug'], strrpos( $extA['slug'], '/' ) + 1 );

		}

		if (
			( ! $ignoreIfCantFindSlug || ( $ignoreIfCantFindSlug && isset( $extA['slug'] ) && ! empty( $extA['slug'] ) ) )
			&&
			( ! $ignoreIfCantFindKey || ( $ignoreIfCantFindKey && isset( $extA['key'] ) && ! empty( $extA['key'] ) ) )
			) {

			$finalReturn[ $extName ] = $extA;

		}
	}

	return $finalReturn;
}

// as above (zeroBSCRM_installedProExt) but returns a single arr for WL Core, if installed
function zeroBSCRM_installedWLCore( $ignoreIfCantFindSlug = false, $keepAllVars = false, $ignoreIfCantFindKey = true ) {

	if ( ! zeroBSCRM_isWL() ) {
		return false;
	}

	$ret = false;

	// then go through installed plugins and try and grab any deactivated via name
	$zbs_all = get_plugins();
	if ( is_array( $zbs_all ) ) {
		foreach ( $zbs_all as $slug => $v ) {

			// if is core :) + WL
			if ( $slug == plugin_basename( ZBS_ROOTFILE ) ) {

				// is rebranded core :)

				// cleaned name
				$cleanName = $v['Name'];

				// attempt to find deets
				$key    = 'core';
				$active = -1;
				if ( is_plugin_active( $slug ) ) {
					$active = 1;
				}

				$ret = array(
					'name'   => $v['Name'],
					'key'    => $key,
					'slug'   => $slug,
					'active' => $active,
					'ver'    => $v['Version'],
					'file'   => '',
				);

			}
		} // / foreach plugin
	}

	// go through RET + get versions where needed :) + weed out $ignoreIfCantFindSlug
	$finalReturn = array();

	$extA = $ret;
	if ( empty( $ret['ver'] ) && ! empty( $ret['file'] ) ) {
		$pluginFullDeets = get_plugin_data( $ret['file'] );
		if ( is_array( $pluginFullDeets ) && isset( $pluginFullDeets['Version'] ) ) {
			$extA['ver'] = $pluginFullDeets['Version'];
		}
		// might as well copy over name if here too :)
		if ( is_array( $pluginFullDeets ) && isset( $pluginFullDeets['Name'] ) ) {
			$extA['name'] = $pluginFullDeets['Name'];
		}
	}

	// strip these (unnecessary vars)
	if ( ! $keepAllVars ) {
		unset( $extA['file'] );
	}

	// finally, clean any slugs which are coming through as zero-bs-extension-csv-importer/ZeroBSCRM_CSVImporter.php instaed of ZeroBSCRM_CSVImporter.php
	// (but keep full in 'path')
	if ( strpos( $extA['slug'], '/' ) > 0 ) {

		$extA['path'] = $extA['slug'];
		$extA['slug'] = substr( $extA['slug'], strrpos( $extA['slug'], '/' ) + 1 );

	}

	if (
		( ! $ignoreIfCantFindSlug || ( $ignoreIfCantFindSlug && isset( $extA['slug'] ) && ! empty( $extA['slug'] ) ) )
		&&
		( ! $ignoreIfCantFindKey || ( $ignoreIfCantFindKey && isset( $extA['key'] ) && ! empty( $extA['key'] ) ) )
		) {

		$finalReturn = $extA;

	}

	return $finalReturn;
}

function zeroBSCRM_extensionsInstalledCount( $activatedOnly = false ) {

	// grabs all extensions (rebrander only grabs active, rest grabs active + deactive)
	$exts = zeroBSCRM_installedProExt();

	if ( ! $activatedOnly ) {
		return count( $exts );
	}

	$c = 0;
	// typo - should have been $exts not $ext.
	foreach ( $exts as $e ) {

		if ( $e['active'] == '1' ) {
			++$c;
		}
	}
	return $c;
}

/*
* Returns array of installed (active) core module keys
*/
function jpcrm_core_modules_installed() {

	$modules           = zeroBSCRM_extensions_free();
	$modules_installed = array();

	foreach ( $modules as $module_key => $module ) {

		if ( is_array( $module ) && zeroBSCRM_isExtensionInstalled( $module_key ) ) {

			$modules_installed[] = $module_key;

		}
	}

	return $modules_installed;
}

/*
* Returns count of installed (active) core modules
*/
function jpcrm_core_modules_installed_count() {

	$modules      = zeroBSCRM_extensions_free();
	$module_count = 0;

	foreach ( $modules as $module_key => $module ) {

		if ( is_array( $module ) && zeroBSCRM_isExtensionInstalled( $module_key ) ) {

			++$module_count;

		}
	}

	return $module_count;
}

// } MS - 27th Feb 2019. This is bugged.
// } function to detect if a specific extension is installed
// } ONLY WORKS after plugins_loaded
// } see https://codex.wordpress.org/Plugin_API/Action_Reference
function zeroBSCRM_isExtensionInstalled( $extKey = '' ) {

	// } This list var will be populated via do_action at top of every extension
	global $zeroBSCRM_extensionsInstalledList, $zbs;

	if ( count( $zeroBSCRM_extensionsInstalledList ) > 0 ) {

		foreach ( $zeroBSCRM_extensionsInstalledList as $ext ) {
			if ( ! empty( $ext ) && $ext == $extKey ) {
				return true;
			}
		}
	}

	// } Otherwise it's not!
	return false;
}

// } function to return a specific extension details
// } ONLY WORKS after plugins_loaded
// } see https://codex.wordpress.org/Plugin_API/Action_Reference
function zeroBSCRM_returnExtensionDetails( $extKey = '' ) {

	// } list
	global $zeroBSCRM_extensionsCompleteList;

	// get free
	$freeExts = zeroBSCRM_extensions_free( true );

	if ( array_key_exists( $extKey, $zeroBSCRM_extensionsCompleteList ) ) {

		$extObj = $zeroBSCRM_extensionsCompleteList[ $extKey ];

		// } Get name
		$extName = $extKey;
		if ( function_exists( 'zeroBSCRM_extension_name_' . $extKey ) == 'function' ) {
			$extName = call_user_func( 'zeroBSCRM_extension_name_' . $extKey );
		}
		// } if not, usefallback
		if ( $extName == $extKey && isset( $extObj['fallbackname'] ) ) {
			$extName = $extObj['fallbackname'];
		}

		return array(
			'key'       => $extKey,
			'name'      => $extName,
			'installed' => zeroBSCRM_isExtensionInstalled( $extKey ),
			'free'      => in_array( $extKey, $freeExts ),
			'meta'      => $extObj,
		);

	}

	// } Otherwise it's not!
	return false;
}

// brutal check through list for 'Automations' etc.
function zeroBSCRM_returnExtensionDetailsFromName( $extName = '' ) {

	// } list
	global $zeroBSCRM_extensionsCompleteList;

	// get free
	$freeExts = zeroBSCRM_extensions_free( true );

	if ( is_array( $zeroBSCRM_extensionsCompleteList ) ) {
		foreach ( $zeroBSCRM_extensionsCompleteList as $key => $deets ) {

			// check against names
			$thisIsIt = false;

			if ( $deets['fallbackname'] == $extName ) {
				$thisIsIt = true;
			}
			if ( isset( $deets['name'] ) && $deets['name'] == $extName ) {
				$thisIsIt = true;
			}

			// aliases (where we've changed names, e.g. PayPal Sync -> PayPal Connect)
			if ( isset( $deets['aliases'] ) && is_array( $deets['aliases'] ) ) {
				foreach ( $deets['aliases'] as $alias ) {
					if ( $alias == $extName ) {
						$thisIsIt = true;
					}
				}
			}

			if ( $thisIsIt ) {

				return array(
					'key'       => $key,
					'name'      => $extName,
					'installed' => zeroBSCRM_isExtensionInstalled( $key ),
					'free'      => in_array( $key, $freeExts ),
				);
			}
		}
	}

	// } Otherwise it's not!
	return false;
}

function zeroBSCRM_hasSyncExtensionActivated() {

	// tries several plugins to see if installed
	$hasExtension   = false;
	$syncExtensions = array( 'pay', 'woosync', 'stripesync', 'worldpay', 'groovesync', 'googlesync', 'envato' );
	foreach ( $syncExtensions as $ext ) {

		if ( zeroBSCRM_isExtensionInstalled( $ext ) ) {

			$hasExtension = true;
			break;

		}
	}

	return $hasExtension;
}

function zeroBSCRM_hasPaidExtensionActivated() {

	$list = zeroBSCRM_extensionsListSegmented();
	if ( is_array( $list['paid'] ) && count( $list['paid'] ) > 0 ) {
		foreach ( $list['paid'] as $extKey => $extDeet ) {

			// test
			if ( zeroBSCRM_isExtensionInstalled( $extKey ) ) {
				return true;
			}
		}
	}

	return false;
}

// } Check update - DEFUNCT - moved to transient checks
function zeroBSCRM_extensions_checkForUpdates() {
}

/*
======================================================
	/ EXTENSION FUNCS
	====================================================== */

/*
======================================================
	EXTENSION DETAILS / FREE/included EXTENSIONS
	====================================================== */

// } JSON short description only
// REFRESH this is ever update woo/products: From: https://jetpackcrm.com/wp-json/zbsextensions/v1/extensions/0
function zeroBSCRM_serve_cached_extension_block() {
	// a localhosted version of the extensions array. Loading images from local.
	$plugin_url = plugins_url( '', ZBS_ROOTFILE ) . '/';

	$imgs = array(
		'ph'             => $plugin_url . 'i/ext/1px.png',
		'rm'             => $plugin_url . 'i/ext/registration-magic.png',
		'live'           => $plugin_url . 'i/ext/livestorm.png',
		'exit'           => $plugin_url . 'i/ext/exit-bee.png',
		'wp'             => $plugin_url . 'i/ext/wordpress-utilities.png',
		'as'             => $plugin_url . 'i/ext/advanced-segments.png',
		'aweb'           => $plugin_url . 'i/ext/aweber.png',
		'mm'             => $plugin_url . 'i/ext/member-mouse.png',
		'auto'           => $plugin_url . 'i/ext/automations.png',
		'api'            => $plugin_url . 'i/ext/api.png',
		'cpp'            => $plugin_url . 'i/ext/client-portal-pro.png',
		'passw'          => $plugin_url . 'i/ext/client-password-manager.png',
		'twilio'         => $plugin_url . 'i/ext/twillo.png',
		'mailchimp'      => $plugin_url . 'i/ext/mailchip.png',
		'awesomesupport' => $plugin_url . 'i/ext/awesome-support.png',
		'convertkit'     => $plugin_url . 'i/ext/convertkit.png',
		'batchtag'       => $plugin_url . 'i/ext/bulk-tagger.png',
		'googlecontact'  => $plugin_url . 'i/ext/google-contacts.png',
		'groove'         => $plugin_url . 'i/ext/groove.png',
		'contactform'    => $plugin_url . 'i/ext/contact-form-7.png',
		'stripe'         => $plugin_url . 'i/ext/stripe.png',
		'worldpay'       => $plugin_url . 'i/ext/world-pay.png',
		'invpro'         => $plugin_url . 'i/ext/invoicing-pro.png',
		'gravity'        => $plugin_url . 'i/ext/gravity-forms.png',
		'csvpro'         => $plugin_url . 'i/ext/csv-importer-pro.png',
		'mailcamp'       => $plugin_url . 'i/ext/mail-campaigns.png',
		'paypal'         => $plugin_url . 'i/ext/paypal.png',
		'salesdash'      => $plugin_url . 'i/ext/sales-dashboard.png',

	);

	$json = '{"data":{},"count":29,"paid":[{"id":26172,"name":"Registration Magic Connect","short_desc":"Capture your Registration Magic sign ups into Jetpack CRM. Including First Name and Last Name.","date":{"date":"2019-01-08 12:57:32.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"59","regular_price":"59","image":"' . $imgs['rm'] . '","extkey":"registrationmagic"},{"id":25432,"name":"Livestorm","short_desc":"The Jetpack CRM livestorm connector automatically adds your Livestorm webinar sign ups into Jetpack CRM.","date":{"date":"2018-12-02 22:03:07.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['live'] . '","extkey":"livestorm"},{"id":25431,"name":"ExitBee Connect","short_desc":"Exit Bee Connect automatically adds your Exit Bee form completions into Jetpack CRM.","date":{"date":"2018-12-02 21:59:18.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['exit'] . '","extkey":"exitbee"},{"id":25336,"name":"WordPress Utilities","short_desc":"The Jetpack CRM WordPress utilities extension adds your website registrations to your Jetpack CRM.","date":{"date":"2018-11-19 22:50:37.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"59","regular_price":"59","image":"' . $imgs['wp'] . '","extkey":"wordpressutilities"},{"id":25174,"name":"Advanced Segments","short_desc":"Easily divide your contacts into dynamic subgroups and manage your contacts effectively","date":{"date":"2018-09-21 10:44:24.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['as'] . '","extkey":"advancedsegments"},{"id":24955,"name":"AWeber Connect","short_desc":"Connect your aWeber to your Jetpack CRM and add new Jetpack CRM contacts to your aWeber list.","date":{"date":"2018-07-26 05:02:28.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39","regular_price":"39","image":"' . $imgs['aweb'] . '","extkey":"aweber"},{"id":24763,"name":"Membermouse Connect","short_desc":"Enhance your MemberMouse subscription website by integrating your data with Jetpack CRM","date":{"date":"2018-07-24 17:29:28.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['mm'] . '","extkey":"membermouse"},{"id":24696,"name":"Automations","short_desc":"Let Automations handle the mundane tasks within your CRM and save yourself time.","date":{"date":"2018-07-22 15:24:14.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['auto'] . '","extkey":"automations"},{"id":24692,"name":"API Connector","short_desc":"Connects your website to Jetpack CRM via the API. Supports Forms, Website Registrations. Use on as many external sites as you like.","date":{"date":"2018-07-09 00:46:59.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"59","regular_price":"59","image":"' . $imgs['api'] . '","extkey":"apiconnector"},{"id":24676,"name":"Client Portal Pro","short_desc":"Customise your Client Portal, Allow File Downloads, Display Tasks and Tickets plus much more","date":{"date":"2018-07-06 17:40:11.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['cpp'] . '","extkey":"clientportalpro"},{"id":24569,"name":"Client Password Manager","short_desc":"Securely manage usernames and passwords for your clients websites, servers, and other logins.","date":{"date":"2018-05-28 14:09:12.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39","regular_price":"39","image":"' . $imgs['passw'] . '","extkey":"passwordmanager"},{"id":20570,"name":"Twilio Connect","short_desc":"Send SMS messages to your contacts, leads, and customers","date":{"date":"2017-11-24 11:53:18.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['twilio'] . '","extkey":"twilio"},{"id":18274,"name":"MailChimp","short_desc":"Subscribe your Jetpack CRM contacts to your MailChimp email marketing list automatically.","date":{"date":"2017-07-27 09:35:08.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39","regular_price":"39","image":"' . $imgs['mailchimp'] . '","extkey":"mailchimp"},{"id":18221,"name":"Awesome Support","short_desc":"Integrate Jetpack CRM with Awesome Support Plugin and see your Contacts support ticket information within your CRM.","date":{"date":"2017-07-24 19:49:23.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"29","regular_price":"29","image":"' . $imgs['awesomesupport'] . '","extkey":"awesomesupport"},{"id":17921,"name":"ConvertKit","short_desc":"Subscribe your contacts to your ConvertKit list automatically. Subscribe to a form, add a tag or subscribe to a sequence","date":{"date":"2017-07-10 10:25:41.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39","regular_price":"39","image":"' . $imgs['convertkit'] . '","extkey":"convertkit"},{"id":17692,"name":"Bulk Tagger","short_desc":"Bulk tag your contacts based on transaction keywords. Target contacts based on their transaction tags.","date":{"date":"2017-07-02 10:09:47.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"29.00","regular_price":"29.00","image":"' . $imgs['batchtag'] . '","extkey":"batchtag"},{"id":17425,"name":"Google Contacts Sync","short_desc":"Retrieve all contact data from Google Contacts. Keep all Leads in your CRM and start managing your contacts effectively.","date":{"date":"2017-06-05 12:32:02.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39.00","regular_price":"39.00","image":"' . $imgs['googlecontact'] . '","extkey":"googlecontact"},{"id":17413,"name":"Groove Sync","short_desc":"Retrieve all contact data from Groove\u00a0automatically. Keep all Leads in your CRM.","date":{"date":"2017-06-02 16:25:18.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"39.00","regular_price":"39.00","image":"' . $imgs['groove'] . '","extkey":"groove"},{"id":17409,"name":"Contact Form 7","short_desc":"Use Contact Form 7 to collect leads and contact info. Save time by automating your lead generation process.","date":{"date":"2017-06-01 13:05:12.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['contactform'] . '","extkey":"contactform"},{"id":17378,"name":"Stripe Sync","short_desc":"Retrieve all customer data from Stripe automatically.","date":{"date":"2017-05-30 18:30:29.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49.00","regular_price":"49.00","image":"' . $imgs['stripe'] . '","extkey":"stripe"},{"id":17356,"name":"WorldPay Sync","short_desc":"Retrieve all customer data from WorldPay\u00a0automatically. Works great with Sales Dashboard.","date":{"date":"2017-05-24 12:25:12.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49.00","regular_price":"49.00","image":"' . $imgs['worldpay'] . '","extkey":"worldpay"},{"id":17067,"name":"Invoicing PRO","short_desc":"Invoicing PRO lets your\u00a0customers pay their invoices right from your Client Portal using either PayPal or Stripe.","date":{"date":"2017-02-21 11:06:47.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['invpro'] . '","extkey":"invpro"},{"id":17030,"name":"Gravity Forms Connect","short_desc":"Use Gravity Forms to collect leads and contact info. Save time by automating your lead generation process.","date":{"date":"2017-01-25 03:31:56.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['gravity'] . '","extkey":"gravity"},{"id":16690,"name":"CSV Importer PRO","short_desc":"Import your existing contact data into the Jetpack CRM system with our super simple CSV importer extension.","date":{"date":"2016-06-20 23:02:27.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"29","regular_price":"29","image":"' . $imgs['csvpro'] . '","extkey":"csvpro"},{"id":16688,"name":"Mail Campaigns","short_desc":"Send emails to targeted segments of contacts with this easy to use, powerful mail extension. Contact your contacts easily.","date":{"date":"2016-06-20 22:53:09.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"79","regular_price":"79","image":"' . $imgs['mailcamp'] . '","extkey":"mailcamp"},{"id":16685,"name":"PayPal Sync","short_desc":"Retrieve all customer data from PayPal automatically. Works great with Sales Dashboard.","date":{"date":"2016-06-16 23:00:34.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"49","regular_price":"49","image":"' . $imgs['paypal'] . '","extkey":"paypal"},{"id":16609,"name":"Sales Dashboard","short_desc":"<p class=\"p1\"><span class=\"s1\">The ultimate sales dashboard. Track Gross Revenue, Net Revenue, Customer growth right from your CRM.<\/span><\/p>","date":{"date":"2016-06-05 14:04:16.000000","timezone_type":3,"timezone":"Europe\/London"},"price":"129","regular_price":"129","image":"' . $imgs['salesdash'] . '","extkey":"salesdash"}]}';
	return $json;
}

// } Vars
global $zeroBSCRM_extensionsInstalledList, $zeroBSCRM_extensionsCompleteList, $jpcrm_core_extension_setting_map;

$jpcrm_core_extension_setting_map = array(
	'forms'           => 'feat_forms',
	'pdfinv'          => 'feat_pdfinv',
	'quotebuilder'    => 'feat_quotes',
	'invbuilder'      => 'feat_invs',
	'csvimporterlite' => 'feat_csvimporterlite',
	'api'             => 'feat_api',
	'cal'             => 'feat_calendar',
	'transactions'    => 'feat_transactions',
	'jetpackforms'    => 'feat_jetpackforms',
	'b2bmode'         => 'companylevelcustomers',
);

// } Fill out full list - NOTE: this is currently only used for extra info for extensions page
// } Sould still use the functions like "zeroBSCRM_extension_name_mailcampaigns" for names etc.
$zeroBSCRM_extensionsCompleteList = array(

	// MS 15th Oct. This list needs to be maintained as it drives the update check
	// Probably need a more central (i.e. on jetpackcrm.com) list of these
	// As per the above comments, we should consolidate this whole system, with
	// one central location holding extension meta (along with a fallback cache)

	// Paid extensions; last updated 21 March 1922
	'advancedsegments'   => array(
		'fallbackname' => 'Advanced Segments',
		'desc'         => __( 'Easily divide your contacts into dynamic subgroups and manage your contacts effectively.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/advanced-segments/',
		'colour'       => '#aa73ac',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/advanced-segments/',
	),
	'apiconnector'       => array(
		'fallbackname' => 'API Connector',
		'desc'         => __( 'Connects your website to Jetpack CRM via the API. Supports Forms & Registrations.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/api-connector/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/api-connector/',

	),
	'automations'        => array(
		'fallbackname' => 'Automations',
		'desc'         => __( 'Let our Automations do the mundane tasks for you.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/automations/',
		'colour'       => '#009cde',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/automations/',
	),
	'aweber'             => array(
		'fallbackname' => 'AWeber Connect',
		'desc'         => __( 'Send Jetpack CRM contacts to your AWeber list.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/aweber-connect/',
		'colour'       => '#aa73ac',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/aweber-connect/',
	),
	'awesomesupport'     => array(
		'fallbackname' => 'Awesome Support Connector',
		'desc'         => __( 'See your contacts support ticket overview.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/awesome-support/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/awesome-support/',
	),
	'batchtag'           => array(
		'fallbackname' => 'Bulk Tagger',
		'desc'         => __( 'Bulk Tag your contacts based on their transaction strings', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/bulk-tagger/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/bulk-tagger/',
	),
	'passwordmanager'    => array(
		'fallbackname' => 'Client Password Manager',
		'desc'         => __( 'Securely manage usernames and passwords for your clients websites, servers, and other logins.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/client-password-manager/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/client-password-manager/',
	),
	'clientportalpro'    => array(
		'fallbackname' => 'Client Portal Pro',
		'desc'         => __( 'Customise your Client Portal, Allow File Downloads, Display Tasks and more', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/client-portal-pro/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/client-portal-pro/',
	),
	'contactform'        => array(

		'fallbackname' => 'Contact Form 7 Connector',
		'desc'         => __( 'Use Contact Form 7 to collect leads and contact info.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/contact-form-7/',
		'colour'       => '#e2ca00',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/contact-form-7/',
	),
	'convertkit'         => array(
		'fallbackname' => 'ConvertKit Connector',
		'desc'         => __( 'Add your Jetpack CRM Contacts to your ConvertKit list.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/convertkit/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/convertkit/',
	),
	'csvpro'             => array(
		'fallbackname' => 'CSV Importer PRO',
		'desc'         => __( 'Import existing contact data from CSV (Pro Version)', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/simple-csv-importer/',
		'colour'       => 'green',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/csv-importer-pro/',
		'shortname'    => 'CSV Imp. PRO', // used where long name won't fit
	),
	'exitbee'            => array(
		'fallbackname' => 'Exit Bee Connect',
		'desc'         => __( 'Convert abandoning visitors into contacts.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/exitbee-connect/',
		'colour'       => '#aa73ac',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/exit-bee/',
	),
	'funnels'            => array(
		'fallbackname' => 'Funnels',
	),
	'googlecontact'      => array(
		'fallbackname' => 'Google Contacts',
		'desc'         => __( 'Retrieve all contact data from Google Contacts.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/google-contacts-sync/',
		'colour'       => '#91a8ad',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/google-contacts-sync/',
		'aliases'      => array( 'Google Contact Sync', 'Google Contact Connect' ),
	),
	'gravity'            => array(
		'fallbackname' => 'Gravity Connect',
		'desc'         => __( 'Create Contacts from Gravity Forms (Integration).', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/gravity-forms/',
		'colour'       => '#91a8ad', // grav forms :) #91a8ad
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/gravity-forms/',
		'aliases'      => array( 'Gravity Forms' ),
	),
	'groove'             => array(
		'fallbackname' => 'Groove Connect',
		'desc'         => __( 'Retrieve all contact data from Groove automatically.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/groove-sync/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/groove-sync/',
		'aliases'      => array( 'Groove Sync' ),
	),
	'invpro'             => array(
		'fallbackname' => 'Invoicing Pro',
		'desc'         => __( 'Collect invoice payments directly from your CRM with PayPal or Stripe.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/invoicing-pro/',
		'colour'       => '#1e0435',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/invoicing-pro/',
	),
	'livestorm'          => array(
		'fallbackname' => 'Livestorm Connect',
		'desc'         => __( 'Capture webinar sign ups to your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/livestorm-connect/',
		'colour'       => '#aa73ac',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/livestorm/',
		'aliases'      => array( 'Live Storm Connect' ),
	),
	'mailcamp'           => array(
		'fallbackname' => 'Mail Campaigns',
		'desc'         => __( 'Send emails to targeted segments of contacts.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/mail-campaigns/',
		'colour'       => 'rgb(173, 210, 152)',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/mail-campaigns-v2/',
		'aliases'      => array( '[BETA] v2.0 Mail Campaigns' ),
	),
	'mailchimp'          => array(
		'fallbackname' => 'MailChimp Connector',
		'desc'         => __( 'Add your Jetpack CRM Contacts to your Mailchimp email list.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/mailchimp/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/mailchimp/',
	),
	'membermouse'        => array(
		'fallbackname' => 'Member Mouse',
		'desc'         => __( 'Imports your Membermouse user data to your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/membermouse/',
		'colour'       => '#f01e14',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/member-mouse/',
	),
	'optinmonster'       => array(
		'fallbackname' => 'OptinMonster',
		'aliases'      => array( 'Optin Monster' ),
	),
	'paypal'             => array(
		'fallbackname' => 'PayPal Connect',
		'desc'         => __( 'Retrieve all contact data from PayPal automatically.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/paypal-sync/',
		'colour'       => '#009cde',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/paypal-sync/',
		'aliases'      => array( 'PayPal Sync' ),
	),
	'registrationmagic'  => array(
		'fallbackname' => 'Registration Magic',
	),
	'salesdash'          => array(
		'fallbackname' => 'Sales Dashboard',
		'desc'         => __( 'The ultimate sales dashboard. See sales trends and more', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/extensions/sales-dashboard/',
		'colour'       => 'black',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/sales-dashboard/',
	),
	'stripe'             => array(
		'fallbackname' => 'Stripe Connect',
		'desc'         => __( 'Retrieve all customer data from Stripe automatically.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/stripe-sync/',
		'colour'       => '#5533ff',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/stripe-sync/',
		'aliases'      => array( 'Stripe Sync' ),
	),
	'systememail'        => array(
		'fallbackname' => 'System Emails Pro',
		'aliases'      => array( 'System Email Pro' ),
	),
	'twilio'             => array(
		'fallbackname' => 'Twilio Connect',
		'desc'         => __( 'Send SMS from your Twilio Account.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/twilio/',
		'colour'       => '#11ABCC',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/twilio-connector/',
	),
	'wordpressutilities' => array(
		'fallbackname' => 'WordPress Utilities',
		'desc'         => __( 'Capture website sign ups into Jetpack CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/wordpress-utilities/',
		'colour'       => '#aa73ac',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/wordpress-utilities/',
	),
	'worldpay'           => array(
		'fallbackname' => 'WorldPay Sync',
		'desc'         => __( 'Create Contacts from World Pay Sync.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/product/worldpay-sync/',
		'colour'       => '#f01e14',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/worldpay-sync/',
	),

	// } ============= Free =====

	'api'                => array(

		'fallbackname' => 'API', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-random" aria-hidden="true"></i>',
		'desc'         => __( 'Enable the API area of your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/api/',
		'colour'       => '#000000',
		'helpurl'      => 'https://automattic.github.io/jetpack-crm-api-docs/',

		'shortName'    => 'API',

	),

	'cal'                => array(

		'fallbackname' => __( 'Task Scheduler', 'zero-bs-crm' ), // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-calendar" aria-hidden="true"></i>',
		'desc'         => __( 'Enable Jetpack CRM Task Scheduler.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/tasks/',
		'colour'       => '#ad6d0d',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/calendar/',

		'shortName'    => 'Calendar',

	),

	'quotebuilder'       => array(

		'fallbackname' => 'Quote Builder', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-file-text-o" aria-hidden="true"></i>',
		'desc'         => __( 'Write and send professional proposals from your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/quotes/',
		'colour'       => '#1fa67a',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/quotes/',

	),

	'invbuilder'         => array(

		'fallbackname' => 'Invoice Builder', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-file-text-o" aria-hidden="true"></i>',
		'desc'         => __( 'Write and send professional invoices from your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/invoices/',
		'colour'       => '#2a044a',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/invoices/',

	),

	'pdfinv'             => array(

		'fallbackname' => 'PDF Invoicing', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>',
		'desc'         => __( 'Want PDF Invoices? Get this installed.', 'zero-bs-crm' ),
		// 'url' => 'https://jetpackcrm.com/feature/',
		'colour'       => 'green',
		// 'helpurl' => 'https://kb.jetpackcrm.com/'

	),

	'transactions'       => array(

		'fallbackname' => 'Transactions', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-file-shopping-cart" aria-hidden="true"></i>',
		'desc'         => __( 'Log transactions in your CRM.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/transactions/',
		'colour'       => 'green',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/transactions/',

	),

	'forms'              => array(

		'fallbackname' => 'Front-end Forms', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-keyboard-o" aria-hidden="true"></i>',
		'desc'         => __( 'Useful front-end forms to capture leads.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/forms/',
		'colour'       => 'rgb(126, 88, 232)',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/forms/',
		'shortname'    => 'Forms', // used where long name won't fit

	),

	// } Free ver
	'csvimporterlite'    => array(

		'fallbackname' => 'CSV Importer LITE', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-upload" aria-hidden="true"></i>',
		'desc'         => __( 'Lite Version of CSV Customer Importer', 'zero-bs-crm' ),
		// 'url' => 'https://jetpackcrm.com/extensions/simple-csv-importer/',
		'colour'       => 'green',
		// 'helpurl' => 'https://kb.jetpackcrm.com/',
		'shortname'    => 'CSV Imp. LITE', // used where long name won't fit
		'prover'       => 'csvpro', // } if this is set, and 'csvimporter' ext exists, it'll default to "PRO installed"

	),

	'b2bmode'            => array(

		'fallbackname' => 'B2B Mode', // This is if no name func is found...
		'imgstr'       => '<i class="building outline icon"></i>',
		'desc'         => __( 'Manage Contacts at Companies or Organisations', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/feature/b2b-mode/',
		'colour'       => 'rgb(117 184 231)',
		'helpurl'      => 'https://kb.jetpackcrm.com/knowledge-base/how-to-assign-a-contact-to-a-company/',
		'shortname'    => 'B2B Mode', // used where long name won't fit

	),

	'jetpackforms'       => array(

		'fallbackname' => 'Jetpack Forms', // This is if no name func is found...
		'imgstr'       => '<i class="fa fa-keyboard-o" aria-hidden="true"></i>',
		'desc'         => __( 'Capture leads from Jetpack Forms', 'zero-bs-crm' ),
		// 'url' => 'https://jetpackcrm.com/feature/',
		'colour'       => 'rgb(126, 88, 232)',
		'helpurl'      => 'https://kb.jetpackcrm.com/knowledge-base/jetpack-contact-forms/',
		'shortname'    => 'Jetpack Forms', // used where long name won't fit

	),

	'woo-sync'           => array(
		'fallbackname' => 'WooSync',
		'desc'         => __( 'Retrieve all customer data from WooCommerce.', 'zero-bs-crm' ),
		'url'          => 'https://jetpackcrm.com/woocommerce/',
		'colour'       => 'rgb(216, 187, 73)',
		'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/woocommerce-sync/',
		'aliases'      => array( 'WooSync', 'Woo Sync' ),
	),

	// Legacy keys used to identify obsolete extensions
	'woosync'            => array(
		'fallbackname' => 'WooSync',
	),

); // } #coreintegration

// This deactivates all active ZBS extensions (used by migration routine for v3.0 - be careful if alter as back-compat may be comprimised)
function zeroBSCRM_extensions_deactivateAll() {

	// count
	$c = 0;

	// retrieve extensions
	$extensions = zeroBSCRM_installedProExt();

	// Disable extensions
	if ( is_array( $extensions ) ) {
		foreach ( $extensions as $shortName => $e ) {

			if ( isset( $e['path'] ) ) {
				deactivate_plugins( plugin_basename( $e['path'] ) );
			}
			++$c;
		}
	}

	return $c;
}

/*
*   Deactivates specific extension based on its key
*
*   @param string $key - e.g. 'woosync'
*
*   @return bool - (approximate) success
*/
function jpcrm_extensions_deactivate_by_key( $key ) {

	// Most reliable way I found to do this is using our internal extension register
	$installed_extensions = zeroBSCRM_installedProExt();

	foreach ( $installed_extensions as $name => $extension ) {

		if ( $extension['key'] == $key && $extension['active'] == 1 ) {

			// deactivate the extension
			if ( isset( $extension['path'] ) ) {

				deactivate_plugins( plugin_basename( $extension['path'] ) );

				return ! is_plugin_active( plugin_basename( $extension['path'] ) );

			}
		}
	}

	return false;
}

// } This activates a given extension
// No point, just use activate_plugin vanilla. function zeroBSCRM_extensions_activate($path=false){}

// } Free Array
// this is a simpler version, with better icons (from the welcome to ZBS page and a description)
// have also added "transactions" to here. CSVimporterLite I would not see as a "module" to disable. Think should be the areas
function zeroBSCRM_extensions_free( $justKeys = false ) {

	$exts = array(

		'csvimporterlite' => false, // false = doesn't show on ext manager page

		'api'             => array(
			'name'       => __( 'API', 'zero-bs-crm' ),
			'i'          => 'api.png',
			'short_desc' => __( 'The CRM API lets you interact with Jetpack CRM via the application program interface.', 'zero-bs-crm' ),
		),
		'cal'             => array(
			'name'       => __( 'Tasks', 'zero-bs-crm' ),
			'i'          => 'task-cal.png',
			'short_desc' => __( 'Manage tasks for your contacts and what you need to do for them.', 'zero-bs-crm' ),
		),
		'quotebuilder'    => array(
			'name'       => __( 'Quotes', 'zero-bs-crm' ),
			'i'          => 'quotes.png',
			'short_desc' => __( 'Offer Quotes for your contacts to help you win more business.', 'zero-bs-crm' ),
		),
		'invbuilder'      => array(
			'name'       => __( 'Invoices', 'zero-bs-crm' ),
			'i'          => 'invoices.png',
			'short_desc' => __( 'Send invoices to your clients and allow them to pay online.', 'zero-bs-crm' ),
		),
		'pdfinv'          => array(
			'name'       => __( 'PDF Engine', 'zero-bs-crm' ),
			'i'          => 'pdf.png',
			'short_desc' => __( 'Supports PDF invoicing and PDF quotes (plus more).', 'zero-bs-crm' ),
		),
		'forms'           => array(
			'name'       => __( 'Forms', 'zero-bs-crm' ),
			'i'          => 'form.png',
			'short_desc' => __( 'Capture contacts into your CRM using our simple form solutions.', 'zero-bs-crm' ),
		),
		'transactions'    => array(
			'name'       => __( 'Transactions', 'zero-bs-crm' ),
			'i'          => 'transactions.png',
			'short_desc' => __( 'Log transactions against contacts and see their total value in the CRM.', 'zero-bs-crm' ),
		),
		'b2bmode'         => array(
			'name'       => __( 'B2B Mode', 'zero-bs-crm' ),
			'i'          => 'customers.png',
			'short_desc' => __( 'Manage Contacts at Companies or Organisations', 'zero-bs-crm' ),
		),
		'jetpackforms'    => array(
			'name'       => __( 'Jetpack Forms', 'zero-bs-crm' ),
			'i'          => 'form.png',
			'short_desc' => __( 'Capture contacts from Jetpack forms into your CRM.', 'zero-bs-crm' ),
		),
		'woo-sync'        => array(
			'name'       => 'WooSync',
			'i'          => 'auto.png',
			'short_desc' => __( 'Retrieve all customer data from WooCommerce into your CRM.', 'zero-bs-crm' ),
		),

	);

	$exts = apply_filters( 'jpcrm_register_free_extensions', $exts );

	if ( $justKeys ) {
		return array_keys( $exts );
	}

	return $exts;
}

// } Free extensions name funcs
function zeroBSCRM_extension_name_pdfinv() {
	return __( 'PDF Engine', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_forms() {
	return __( 'Front-end Forms', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_quotebuilder() {
	return __( 'Quotes', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_invbuilder() {
	return __( 'Invoicing', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_csvimporterlite() {
	return __( 'CSV Importer LITE', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_api() {
	return __( 'API', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_cal() {
	return __( 'Tasks', 'zero-bs-crm' ); }

function zeroBSCRM_extension_name_transactions() {
	return __( 'Transactions', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_jetpackforms() {
	return __( 'Jetpack Forms', 'zero-bs-crm' ); }
function zeroBSCRM_extension_name_b2bmode() {
	return __( 'B2B Mode', 'zero-bs-crm' ); }

// } Settings page for PDF Invoicing (needs writing)
// } function zeroBSCRM_html_settings_pdfinv

// hard deletes any extracted repo (e.g. dompdf)
function zeroBSCRM_extension_remove_dl_repo( $repoName = '' ) {

	if ( in_array( $repoName, array( 'dompdf' ) ) ) {

		// this is here to stop us ever accidentally using zeroBSCRM_del
		define( 'ZBS_OKAY_TO_PROCEED', time() );
		zeroBSCRM_del( ZEROBSCRM_INCLUDE_PATH . $repoName );

	}
}

// } WH 2.0.6 - added to check installed pre-use, auto-installs if not present (or marks uninstalled + returns false)
// } $checkInstallFonts allows you to just check dompdf, not the piggy-backed pdf fonts installer too (as PDFBuilder needs this)
function zeroBSCRM_extension_checkinstall_pdfinv( $checkInstallFonts = true ) {

	global $zbs;

	// retrieve lib path
	$includeFile = $zbs->libInclude( 'dompdf' );

	$shouldBeInstalled = zeroBSCRM_getSetting( 'feat_pdfinv' );

	if ( $shouldBeInstalled == '1' && ! empty( $includeFile ) && ! file_exists( $includeFile ) ) {

		// } Brutal really, just set the setting
		global $zbs;
		$zbs->settings->update( 'feat_pdfinv', 0 );

		// } Returns true/false
		zeroBSCRM_extension_install_pdfinv();

	}

	$fontsInstalled = zeroBSCRM_getSetting( 'pdf_fonts_installed' );
	if ( $checkInstallFonts && $shouldBeInstalled == '1' && $fontsInstalled !== 1 ) {

		// check fonts
		$fonts = $zbs->get_fonts();
		$fonts->extract_and_install_default_fonts();

	}
}

// } Install funcs for free exts
function zeroBSCRM_extension_install_pdfinv() {

	global $zbs;

	if ( ! zeroBSCRM_checkSystemFeat_mb_internal_encoding() ) {
		global $zbsExtensionInstallError;
		$zbsExtensionInstallError = __( 'Please ensure the mbstring PHP module is enabled on your server prior to installing the PDF Engine.', 'zero-bs-crm' );
		return false;
	}

	// retrieve lib path
	$includeFilePath = $zbs->libPath( 'dompdf' );
	$includeFile     = $zbs->libInclude( 'dompdf' );

	// } Check if already downloaded libs:
	if ( ! empty( $includeFile ) && ! file_exists( $includeFile ) ) {

		global $zbs;

		// } Libs appear to need downloading..

			// } dirs
			$workingDir = ZEROBSCRM_PATH . 'temp' . time();
		if ( ! file_exists( $workingDir ) ) {
			wp_mkdir_p( $workingDir );
		}
			$endingDir = $includeFilePath;
		if ( ! file_exists( $endingDir ) ) {
			wp_mkdir_p( $endingDir );
		}

		if ( file_exists( $endingDir ) && file_exists( $workingDir ) ) {

			// } Retrieve zip
			$libs = zeroBSCRM_retrieveFile( $zbs->urls['extdlrepo'] . 'pdfinv.zip', $workingDir . '/pdfinv.zip' );

			// } Expand
			if ( file_exists( $workingDir . '/pdfinv.zip' ) ) {

				// } Should checksum?

				// } For now, expand zip
				$expanded = zeroBSCRM_expandArchive( $workingDir . '/pdfinv.zip', $endingDir . '/' );

				// } Check success?
				if ( file_exists( $includeFile ) ) {

					// } All appears good, clean up
					if ( file_exists( $workingDir . '/pdfinv.zip' ) ) {
						unlink( $workingDir . '/pdfinv.zip' );
					}
					if ( file_exists( $workingDir ) ) {
						rmdir( $workingDir );
					}

					jpcrm_install_core_extension( 'pdfinv' );

					// Also install pdf fonts
					$fonts = $zbs->get_fonts();
					$fonts->extract_and_install_default_fonts();

					return true;

				} else {

					// } Add error msg
					global $zbsExtensionInstallError;
					$zbsExtensionInstallError = __( 'Jetpack CRM was not able to extract the libraries it needs to in order to install PDF Engine.', 'zero-bs-crm' );

				}
			} else {

				// } Add error msg
				global $zbsExtensionInstallError;
				$zbsExtensionInstallError = __( 'Jetpack CRM was not able to download the libraries it needs to in order to install PDF Engine.', 'zero-bs-crm' );

			}
		} else {

			// } Add error msg
			global $zbsExtensionInstallError;
			$zbsExtensionInstallError = __( 'Jetpack CRM was not able to create the directories it needs to in order to install PDF Engine.', 'zero-bs-crm' );

		}
	} else {

		// } Already exists...

		// } Brutal really, just set the setting
		global $zbs;
		$zbs->settings->update( 'feat_pdfinv', 1 );

		// } Make it show up in the array again
		global $zeroBSCRM_extensionsInstalledList;
		if ( ! is_array( $zeroBSCRM_extensionsInstalledList ) ) {
			$zeroBSCRM_extensionsInstalledList = array();
		}
		$zeroBSCRM_extensionsInstalledList[] = 'pdfinv';

		// Also install pdf fonts
		$fonts = $zbs->get_fonts();
		$fonts->extract_and_install_default_fonts();

		return true;

	}

	// } Return fail
	return false;
}

// } Uninstall funcs for free exts
function zeroBSCRM_extension_uninstall_pdfinv() {
	return jpcrm_uninstall_core_extension( 'pdfinv' );
}

// } Transactions: New 2.98.2
function zeroBSCRM_extension_install_transactions() {
	return jpcrm_install_core_extension( 'transactions' );
}
function zeroBSCRM_extension_uninstall_transactions() {
	return jpcrm_uninstall_core_extension( 'transactions' );
}

function zeroBSCRM_extension_install_forms() {
	return jpcrm_install_core_extension( 'forms' );
}

function zeroBSCRM_extension_uninstall_forms() {
	return jpcrm_uninstall_core_extension( 'forms' );
}

function zeroBSCRM_extension_install_jetpackforms() {
	return jpcrm_install_core_extension( 'jetpackforms' );
}
function zeroBSCRM_extension_uninstall_jetpackforms() {
	return jpcrm_uninstall_core_extension( 'jetpackforms' );
}

function zeroBSCRM_extension_install_b2bmode() {
	return jpcrm_install_core_extension( 'b2bmode' );
}
function zeroBSCRM_extension_uninstall_b2bmode() {
	return jpcrm_uninstall_core_extension( 'b2bmode' );
}

function zeroBSCRM_extension_install_cal() {
	return jpcrm_install_core_extension( 'cal' );
}

function zeroBSCRM_extension_uninstall_cal() {
	return jpcrm_uninstall_core_extension( 'cal' );
}

function zeroBSCRM_extension_install_quotebuilder() {
	$result = jpcrm_install_core_extension( 'quotebuilder', true );
	return $result;
}

function zeroBSCRM_extension_uninstall_quotebuilder() {
	$result = jpcrm_uninstall_core_extension( 'quotebuilder', true );
	return $result;
}

function zeroBSCRM_extension_install_invbuilder() {
	return jpcrm_install_core_extension( 'invbuilder', true );
}

function zeroBSCRM_extension_uninstall_invbuilder() {
	return jpcrm_uninstall_core_extension( 'invbuilder', true );
}

function zeroBSCRM_extension_install_csvimporterlite() {
	return jpcrm_install_core_extension( 'csvimporterlite' );
}

function zeroBSCRM_extension_uninstall_csvimporterlite() {
	return jpcrm_uninstall_core_extension( 'csvimporterlite' );
}

function zeroBSCRM_extension_install_api() {
	return jpcrm_install_core_extension( 'api', true );
}

function zeroBSCRM_extension_uninstall_api() {
	return jpcrm_uninstall_core_extension( 'api', true );
}

// } Free extensions init
function zeroBSCRM_freeExtensionsInit() {

	global $zeroBSCRM_extensionsInstalledList, $jpcrm_core_extension_setting_map;

	$zeroBSCRM_extensionsInstalledList = array();

	foreach ( $jpcrm_core_extension_setting_map as $ext_name => $setting_name ) {
		if ( zeroBSCRM_getSetting( $setting_name ) == 1 ) {
			$zeroBSCRM_extensionsInstalledList[] = $ext_name;
		}
	}
}

/**
 * @param $ext_name Extension name
 * @return bool
 */
function jpcrm_install_core_extension( $ext_name, $flag_for_flush_rewrite = false ) {

	global $zbs, $zeroBSCRM_extensionsInstalledList, $jpcrm_core_extension_setting_map;

	$ext_setting = $jpcrm_core_extension_setting_map[ $ext_name ];

	$zbs->settings->update( $ext_setting, 1 );

	// Add to the installed extension list
	$is_installed = array_search( $ext_name, $zeroBSCRM_extensionsInstalledList );

	if ( ! $is_installed ) {
		$zeroBSCRM_extensionsInstalledList[] = $ext_name;

		// flush rewrite rules as needed
		if ( $flag_for_flush_rewrite ) {
			jpcrm_flag_for_flush_rewrite();
		}
		return true;
	}
	return false;
}

/**
 * @param $ext_name Extension name
 * @return bool
 */
function jpcrm_uninstall_core_extension( $ext_name, $flag_for_flush_rewrite = false ) {
	global $zbs, $zeroBSCRM_extensionsInstalledList, $jpcrm_core_extension_setting_map;

	$ext_setting = $jpcrm_core_extension_setting_map[ $ext_name ];

	$zbs->settings->update( $ext_setting, -1 );

	// Remove from the installed extension list
	$idx = array_search( $ext_name, $zeroBSCRM_extensionsInstalledList );

	if ( $idx !== false ) {
		array_splice( $zeroBSCRM_extensionsInstalledList, $idx, 1 );

		// flush rewrite rules as needed
		if ( $flag_for_flush_rewrite ) {
			jpcrm_flag_for_flush_rewrite();
		}

		return true;
	}

	return false;
}

/**
 * Registers an external extension, (adds to our global list, for now)
 *
 * @param $ext_name Extension name
 * @return bool
 */
function jpcrm_register_external_extension( $ext_name ) {

	if ( ! empty( $ext_name ) ) {

		global $zeroBSCRM_extensionsInstalledList;

		if ( ! is_array( $zeroBSCRM_extensionsInstalledList ) ) {
			$zeroBSCRM_extensionsInstalledList = array();
		}

		$zeroBSCRM_extensionsInstalledList[] = $ext_name;

		return true;

	}

	return false;
}

/*
======================================================
	EXTENSION DETAILS / FREE/included EXTENSIONS
	====================================================== */
