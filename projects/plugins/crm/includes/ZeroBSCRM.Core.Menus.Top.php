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

	/*
			!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

				THIS FILE IS FOR JPCRM Top Menu related changes - later to be unified into one .Menu file

			!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


	*/

/*
xxx

// Top menu
add_action("wp_after_admin_bar_render","zeroBSCRM_admin_top_menu", 10);

// Learn menu
function jpcrm_initialise_learn_menu(){

	new Learn_Menu();

}
// Note the priority here. This causes the "learn" block to present after the top menu
add_action( "wp_after_admin_bar_render", "jpcrm_initialise_learn_menu", 11 );

*/

// } Admin head for the top menu (i.e. remembering the toggle mode) - modified for custom admin
function zeroBSCRM_admin_menu_settings() {

	$cid       = get_current_user_id();
	$hiding_wp = get_user_meta( $cid, 'zbs-hide-wp-menus', true );
	if ( zeroBSCRM_isAdminPage() ) {

		// detect any compat (e.g. material admin)
		$zbs_custom_admin = zeroBSCM_custom_admin_detect();

		// globalise js (global js adds a class to body depending on this)
		// Not needed, now dealt with by zeroBSCRM_bodyClassMods below
		// ... gonna leave here because Material Admin doesn't allow admin_body_class
		?><script>var zbscrmjs_custom_admin = '<?php echo esc_html( $zbs_custom_admin ); ?>';</script>
		<?php

		// if hiding, append class to body :)- this should be a single js call really, fudged for now :)
		// jQuery('body').addClass('zbs-fullscreen'); - NOW NOT NEEDED (see zeroBSCRM_bodyClassMods - added via php for less visual lag)
		// left in for cases like material admin not using proper admin_body_class
		if ( $hiding_wp ) {
			?>
				<script type="text/javascript">jQuery(function(){ jQuery('body').addClass('zbs-fullscreen'); jQuery('#wpcontent').addClass('zbs-menu-open'); });</script>
				<?php
		}

		/*
		This is now all done with CSS classes :)
		if($hiding_wp){

		if($zbs_custom_admin == 'material_admin'){
			?><style>
				#wpcontent{
					margin-left: -10px;
					margin-top: -50px;
				}
				#wpadminbar, #adminmenuback, #adminmenuwrap{
					display:none;
				}
				#zbs-admin-top-bar {
					margin-right: 0px !important;
				}
				.zbs-admin-main-menu, .zbs-dash-header {
					margin-left: -30px !important;
				}
			</style>
			<?php
		}else{
			?><style>
				#wpcontent{
					margin-left: 0px;
					margin-top: -32px;
				}
				#wpadminbar, #adminmenuback, #adminmenuwrap{
					display:none;
				}
			</style>
			<script>
				var zbscrmjs_custom_admin = 'none';
			</script>
			<?php
		}
		}else{
		if($zbs_custom_admin == 'material_admin'){
			?>
			<style>
				#zbs-admin-top-bar {
					margin-right: 0px !important;
				}
				.zbs-admin-main-menu, .zbs-dash-header {
					margin-left: -30px !important;
				}
			</style>
			<script>
				var zbscrmjs_custom_admin = 'material';
			</script>
			<?php
		}
		.update-nag{
			display:none;
		}
		</style>
		*/
	}
}
add_action( 'admin_head', 'zeroBSCRM_admin_menu_settings' );

add_filter( 'admin_body_class', 'zeroBSCRM_bodyClassMods' );
function zeroBSCRM_bodyClassMods( $classes = '' ) {

	// show hide fullscreen mode
	$hiding_wp = get_user_meta( get_current_user_id(), 'zbs-hide-wp-menus', true );
	if ( zeroBSCRM_isAdminPage() ) {

		// if hiding, append class to body
		if ( $hiding_wp ) {
			$classes .= ' zbs-fullscreen ';
		}
	}

	// compat - MAterial admin
	if ( zeroBSCM_custom_admin_detect() == 'material' ) {
		$classes .= ' zbs-compat-material-admin ';
	}

	return $classes;
}

// } THIS IS THE PENDING COUNT FOR ZBS DASHBOARD (akin to pending posts red number)
// } USED TO HIGHLIGHT NOTIFICATIONS - WHICH WILL ALSO BE IN TOP MENU UI - can use it here too
add_filter( 'add_menu_classes', 'zeroBSCRM_show_pending_number' );
function zeroBSCRM_show_pending_number( $menu ) {

	$pending_count = 0;   // update this with count of UNREAD notifications if we want to use here.

	// build string to match in $menu array
	$menu_str = 'zerobscrm-dash';

	// loop through $menu items, find match, add indicator
	foreach ( $menu as $menu_key => $menu_data ) {

		if ( $menu_str != $menu_data[2] ) {
			continue;
		}
		$menu[ $menu_key ][0] .= ' <span class="update-plugins count-' . $pending_count . '"><span class="plugin-count">' . number_format_i18n( $pending_count ) . '</span></span>';
	}
	return $menu;
}

// } This is NEW UI for the top menu. Helpful links in the top menu = Improved UI
function zeroBSCRM_admin_top_menu( $branding = 'zero-bs-crm', $page = 'dash' ) {

		// } restrict to ONLY Jetpack CRM pages - NOTE our EXTENSIONS will need to use the same
		// } $zbs->slugs global. Some of mine use $zeroBSCRM_extension_slugs
		// } will update the extensions to use the probably $zbs->slugs global
		// } WH: All good.
	if ( zeroBSCRM_isAdminPage() ) {

		global $zbs;

		// } Check whether we want to run the hopscotch tour
		$uid          = get_current_user_id();
		$zbs_hopscoth = get_user_meta( $uid, 'zbs-hopscotch-tour', true );
		if ( $zbs_hopscoth == '' && ! isset( $_GET['zbs-welcome-tour'] ) ) {

			// first load..
			update_user_meta( $uid, 'zbs-hopscotch-tour', 0 );
			?>
				<script type="text/javascript">var zbscrmjs_hopscotch_virgin=1;</script>
				<?php

		} else {

			// not first time...
			?>
				<script type="text/javascript">var zbscrmjs_hopscotch_virgin=0;</script>
				<?php

		}

		if ( isset( $_GET['zbs-welcome-tour'] ) && $_GET['zbs-welcome-tour'] == 1 ) {

			// user-initiated:
			?>
				<script type="text/javascript">var zbscrmjs_hopscotch_virgin=1;</script>
				<?php
		}

		// } passing "branding" for the logo top :-)
		$branding = '';

		##WLREMOVE
		$branding = 'zero-bs-crm';
		##/WLREMOVE

		// } AJAX nonce, rest is dealt with in the admin global js :)
		?>
			<script type="text/javascript">var zbscrmjs_topMenuSecToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce-topmenu' ) ); ?>';</script>
			<?php

			// } Menu hidden? - maybe we can cookie this? for now this is slick.
			$hiding_wp = get_user_meta( $uid, 'zbs-hide-wp-menus', true );
			if ( $hiding_wp ) {
				$admin_menu_state = 'menu-closed';
			} else {
				$admin_menu_state = 'menu-open';
			}

			// } Other Prep
			$currentUser = wp_get_current_user();
			$alsoCo      = ''; // } WH added to fix php warnings - what\s this?
			$b2bMode     = zeroBSCRM_getSetting( 'companylevelcustomers' );

			// pre-collate tools so can hide if none :)
			$toolsMenu = array();

			// calendar
			if ( zeroBSCRM_getSetting( 'feat_calendar' ) > 0 ) {
				$toolsMenu[] = '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['manage-events'] ) . '" class="item"><i class="icon calendar outline"></i> ' . __( 'Task Scheduler', 'zero-bs-crm' ) . '</a>';
			}
			// forms
			if ( zeroBSCRM_permsForms() && zeroBSCRM_getSetting( 'feat_forms' ) > 0 ) {
				$toolsMenu[] = '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['manageformscrm'] ) . '" class="item"><i class="icon file outline"></i> ' . __( 'Forms', 'zero-bs-crm' ) . '</a>';
			}

			// removes data-tools page for everyone except WP Admin + zbs admin
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				$toolsMenu[] = '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['datatools'] ) . '" class="item"><i class="icon configure"></i> ' . __( 'Data Tools', 'zero-bs-crm' ) . '</a>';
			}

			// filter items (allows additions from ext etc.)
			$toolsMenu = apply_filters( 'zbs-tools-menu', $toolsMenu );

			// } Add extensions to base, always :) more upsell.
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				$toolsMenu[] = '<a class="item" id="zbs-manage-modules-tour" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) . '"><i class="icon th" aria-hidden="true"></i> ' . __( 'Core Modules', 'zero-bs-crm' ) . '</a>';
				##WLREMOVE
				$toolsMenu[] = '<a class="item" id="zbs-manage-ext-tour" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['extensions'] ) . '"><i class="icon plug" aria-hidden="true"></i> ' . __( 'Extensions', 'zero-bs-crm' ) . '</a>';
				##/WLREMOVE
			}

			?>


		<!--- mobile only menu -->
		<div class="ui mobile tablet only" id="zbs-mobile-nav">
			<div id="zbs-main-logo-mobile">
				<div class="zbs-face-1-mobile">
					<img id="zbs-main-logo-mobby" alt="Jetpack CRM mobile logo" src="<?php echo esc_url( jpcrm_get_logo( true, 'white' ) ); ?>" style="cursor:pointer;">
				</div>
			</div>
			<?php

			// Dev mode? add ui label
			if ( zeroBSCRM_isLocal() ) {

				// no id etc. to stop people hiding with css
				?>
				<div class="item" style="float: right;color: #FFF;margin-top: -2.5em;"><?php esc_html_e( 'Developer Mode', 'zero-bs-crm' ); ?></div>
				<?php

			}

			?>
			<div class="ui stackable menu inverted" id="zbs-mobile-navigation-toggle">
				
			<!-- basic menu tabs for mobile -->
				<a class="item<?php zeroBS_menu_active( $zbs->slugs['dash'] ); ?>" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) ); ?>"><i class="icon dashboard"></i><?php esc_html_e( 'Dashboard', 'zero-bs-crm' ); ?></a>
				<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managecontacts'] ) ); ?>"><i class="icon users"></i> <?php esc_html_e( 'Contacts', 'zero-bs-crm' ); ?></a>
			<?php if ( $b2bMode == 1 ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managecompanies'] ) ); ?>"><i class="icon building outline"></i> <?php echo esc_html( jpcrm_label_company( true ) ); ?></a>
				<?php } ?>
			<?php if ( zeroBSCRM_permsViewQuotes() && zeroBSCRM_getSetting( 'feat_quotes' ) > 0 ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managequotes'] ) ); ?>"><i class="icon file outline"></i> <?php esc_html_e( 'Quotes', 'zero-bs-crm' ); ?></a>
				<?php } ?>

			<?php if ( zeroBSCRM_permsViewInvoices() && zeroBSCRM_getSetting( 'feat_invs' ) > 0 ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['manageinvoices'] ) ); ?>"><i class="icon file alternate outline"></i> <?php esc_html_e( 'Invoices', 'zero-bs-crm' ); ?></a>
				<?php } ?>
			<?php if ( zeroBSCRM_permsViewTransactions() && zeroBSCRM_getSetting( 'feat_transactions' ) > 0 ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managetransactions'] ) ); ?>"><i class="icon shopping cart"></i> <?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></a>
				<?php } ?>

			<?php
				// tools menu added 29/6/18, because Brian needs access to his, maybe we need to rethink this whole menu setup

			if ( count( $toolsMenu ) > 0 ) {
				foreach ( $toolsMenu as $menuItem ) {

					// wh quick hack to avoid clashing ID's
					$menuItemHTML = str_replace( 'id="', 'id="mob-', $menuItem );
					$menuItemHTML = str_replace( "id='", "id='mob-", $menuItemHTML );

					echo $menuItemHTML;

				}
			}
			?>
				  


			</div>
			
		</div>
		<script type="text/javascript">
		jQuery(function(){
			jQuery('#zbs-main-logo-mobby').on("click",function(e){
				jQuery("#zbs-mobile-navigation-toggle").toggle();
			});
		})
		</script>
		<!---  // mobile only menu -->


		<div id="zbs-hide-main-menu" class="ui stackable menu inverted zbs-admin-main-menu mobile tablet hidden" style="z-index:5">

		<div class="item <?php echo esc_attr( $admin_menu_state ); ?> mobile hidden" id="zbs-main-logo-wrap">
			<div class="zbs-cube" id="zbs-main-logo-cube-wrap">
				<div class="zbs-face1">
					<img id="zbs-main-logo" alt="Jetpack CRM logo" src="<?php echo esc_url( jpcrm_get_logo() ); ?>" style="cursor:pointer;">
				</div>
				<div class="zbs-face2">
					<i class="expand icon fa-flip-horizontal"></i>
				</div>
			</div>
		</div>
		<?php

		/*
		don't check here as of 24/9/19
		// Dev mode? add ui label
		if (zeroBSCRM_isLocal()){

		//remove the label top left for developer mode.

		// no id etc. to stop people hiding with css
		?><div class="item"><?php _e('Developer Mode','zero-bs-crm'); ?></div><?php

		} */

		?>

		<div class="right menu ui inverted zbs-admin-bg-menu mobile hidden" style="z-index:5">


			<a class="item<?php esc_attr( zeroBS_menu_active( $zbs->slugs['dash'] ) ); ?>" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) ); ?>"><?php esc_html_e( 'Dashboard', 'zero-bs-crm' ); ?></a>
			<div class="ui simple dropdown item select<?php esc_attr( zeroBS_menu_active_type( 'contact' ) ); ?>" id="zbs-contacts-topmenu" style="min-width:114px;z-index:2">
				<span class="text"><?php esc_html_e( 'Contacts', 'zero-bs-crm' ); ?></span>
				<i class="dropdown icon"></i>
				<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">

				<?php
				if ( zeroBSCRM_permsCustomers() ) { // ADD CUSTOMER //esc_url( 'post-new.php?post_type=zerobs_customer'.$alsoCo )
					echo ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_customer', false ) . $alsoCo . '" class="item"><i class="icon plus"></i> ' . esc_html__( 'Add New', 'zero-bs-crm' ) . '</a>';
				}
				?>

					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managecontacts'] ) ); ?>"><i class="icon list"></i> <?php esc_html_e( 'View all', 'zero-bs-crm' ); ?></a>

					<?php if ( zeroBSCRM_permsCustomers() ) { // CONTACT TAGS ?>
					<a class="item" href="<?php echo jpcrm_esc_link( 'tags', -1, 'zerobs_customer', false, 'contact' ); ?>"><i class="icon tags"></i> <?php esc_html_e( 'Tags', 'zero-bs-crm' ); ?></a>
					<?php } ?>

					<?php if ( zeroBSCRM_permsCustomers() && $zbs->isDAL2() ) { // CONTACT SEGMENTS ?>
					<a class="item" href="<?php echo jpcrm_esc_link( $zbs->slugs['segments'], -1, 'zerobs_customer', false, 'contact' ); ?>"><i class="chart pie icon"></i> <?php esc_html_e( 'Segments', 'zero-bs-crm' ); ?></a>
					<?php } ?>

					<?php if ( $b2bMode == 1 ) { ?>

					<div class="ui divider"></div>

					<div class="ui simple dropdown item " id="zbs-companies-topmenu">
						<?php echo esc_html( jpcrm_label_company( true ) ); ?><i class="dropdown icon zbs-subsub-ico"></i>
						<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
							<?php
							if ( zeroBSCRM_permsCustomers() ) {
								echo ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_company', false ) . '" class="item"><i class="icon plus"></i> ' . esc_html__( 'Add New', 'zero-bs-crm' ) . '</a>';
							}
							?>
							<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managecompanies'] ) ); ?>"><i class="icon list"></i> <?php esc_html_e( 'View all', 'zero-bs-crm' ); ?></a>
							<a class="item" href="<?php echo jpcrm_esc_link( 'tags', -1, 'zerobs_company', false, 'zerobscrm_companytag' ); ?>"><i class="icon tags"></i> <?php esc_html_e( 'Tags', 'zero-bs-crm' ); ?></a>
						</div>
					</div>

					<?php } ?>

					<div class="ui divider"></div>

					<?php if ( ! zeroBSCRM_isExtensionInstalled( 'csvpro' ) && zeroBSCRM_isExtensionInstalled( 'csvimporterlite' ) ) { ?>
								<a class="item" href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['csvlite'] ) ); ?>"><i class="icon cloud upload"></i> <?php esc_html_e( 'Import', 'zero-bs-crm' ); ?></a>
						<?php
					} else {

						// if csvpro installed
						if ( zeroBSCRM_isExtensionInstalled( 'csvpro' ) ) {

							global $zeroBSCRM_CSVImporterslugs;

							// got slug
							if ( isset( $zeroBSCRM_CSVImporterslugs ) && is_array( $zeroBSCRM_CSVImporterslugs ) && isset( $zeroBSCRM_CSVImporterslugs['app'] ) ) {
								?>
								<a class="item" href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zeroBSCRM_CSVImporterslugs['app'] ) ); ?>"><i class="icon cloud upload"></i> <?php esc_html_e( 'Import', 'zero-bs-crm' ); ?></a>
								<?php
							}
						}
					}
					?>



					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['export-tools'] ) ); ?>"><i class="icon cloud download"></i> <?php esc_html_e( 'Export', 'zero-bs-crm' ); ?></a>
						<?php

						// filter items (allows additions from ext etc.)
						// for now empty (could contain the above) - so can add custom for log report (miguel)
						$contactsMenu = array();
						$contactsMenu = apply_filters( 'zbs-contacts-menu', $contactsMenu );
						if ( count( $contactsMenu ) > 0 ) {

							// show divider?
							?>
							<div class="ui divider"></div>
							<?php

							foreach ( $contactsMenu as $menuItem ) {
								echo $menuItem; }
						}

						?>

				</div>
			</div>


			<?php
			if ( zeroBSCRM_permsViewQuotes() && zeroBSCRM_getSetting( 'feat_quotes' ) > 0 ) {
				?>
			<div class="ui simple dropdown item select<?php zeroBS_menu_active_type( 'quote' ); ?>" id="zbs-quotes-topmenu" style="z-index:5">
				<span class="text"><?php esc_html_e( 'Quotes', 'zero-bs-crm' ); ?></span>
				<i class="dropdown icon"></i>
				<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
						<?php
						if ( zeroBSCRM_permsQuotes() ) {
							echo ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_quote', false ) . $alsoCo . '" class="item"><i class="icon plus"></i> ' . esc_html__( 'Add New', 'zero-bs-crm' ) . '</a>';
						}
						?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managequotes'] ) ); ?>"><i class="icon list"></i> <?php esc_html_e( 'View all', 'zero-bs-crm' ); ?></a>
					
					<?php if ( zeroBSCRM_permsQuotes() && $zbs->isDAL3() ) { // TAGS ?>
					<a class="item" href="<?php echo jpcrm_esc_link( 'tags', -1, ZBS_TYPE_QUOTE, false, 'quote' ); ?>"><i class="icon tags"></i> <?php esc_html_e( 'Tags', 'zero-bs-crm' ); ?></a>
					<?php } ?>

						<?php if ( zeroBSCRM_permsQuotes() ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['quote-templates'] ) ); ?>"><i class="icon file text"></i> <?php esc_html_e( 'Templates', 'zero-bs-crm' ); ?></a>
					<?php } ?>


						<?php if ( zeroBSCRM_permsQuotes() ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['export-tools'] ) ); ?>&zbstype=quote"><i class="icon cloud download"></i> <?php esc_html_e( 'Export', 'zero-bs-crm' ); ?></a>
					<?php } ?>

						<?php

						// filter items (allows additions from ext etc.)
						// for now empty (could contain the above)
						$quotesMenu = array();
						$quotesMenu = apply_filters( 'zbs-quotes-menu', $quotesMenu );
						if ( count( $quotesMenu ) > 0 ) {

							// show divider?
							?>
							<div class="ui divider"></div>
							<?php

							foreach ( $quotesMenu as $menuItem ) {
								echo $menuItem; }
						}

						?>
				</div>
			</div>
			<?php } ?>

			<?php if ( zeroBSCRM_permsViewInvoices() && zeroBSCRM_getSetting( 'feat_invs' ) > 0 ) { ?>
			<div class="ui simple dropdown item select<?php zeroBS_menu_active_type( 'invoice' ); ?>" id="zbs-invoices-topmenu" style="z-index:5">
				<span class="text"><?php esc_html_e( 'Invoices', 'zero-bs-crm' ); ?></span>
				<i class="dropdown icon"></i>
				<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
					<?php
					if ( zeroBSCRM_permsInvoices() ) {
						echo ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_invoice', false ) . $alsoCo . '" class="item"><i class="icon plus"></i> ' . esc_html__( 'Add New', 'zero-bs-crm' ) . '</a>';
					}
					?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['manageinvoices'] ) ); ?>"><i class="icon list"></i> <?php esc_html_e( 'View all', 'zero-bs-crm' ); ?></a>

					<?php if ( zeroBSCRM_permsInvoices() && $zbs->isDAL3() ) { // TAGS ?>
					<a class="item" href="<?php echo jpcrm_esc_link( 'tags', -1, ZBS_TYPE_INVOICE, false, 'invoice' ); ?>"><i class="icon tags"></i> <?php esc_html_e( 'Tags', 'zero-bs-crm' ); ?></a>
					<?php } ?>
					
					<?php if ( zeroBSCRM_permsInvoices() ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['export-tools'] ) ); ?>&zbstype=invoice"><i class="icon cloud download"></i> <?php esc_html_e( 'Export', 'zero-bs-crm' ); ?></a>
					<?php } ?>

					<?php
						// filter items (allows additions from ext etc.)
						// for now empty (could contain the above)
						$invoicesMenu = array();
						$invoicesMenu = apply_filters( 'zbs-invoices-menu', $invoicesMenu );
					if ( count( $invoicesMenu ) > 0 ) {

						// show divider?
						?>
							<div class="ui divider"></div>
							<?php

							foreach ( $invoicesMenu as $menuItem ) {
								echo $menuItem; }
					}

					?>
				</div>
			</div>
			<?php } ?>

			<?php if ( zeroBSCRM_permsViewTransactions() && zeroBSCRM_getSetting( 'feat_transactions' ) > 0 ) { ?>
			<div class="ui simple dropdown item select<?php zeroBS_menu_active_type( 'transaction' ); ?>" id="zbs-transactions-topmenu" style="z-index:5">
				<span class="text"><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></span>
				<i class="dropdown icon"></i>
				<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
					<?php
					if ( zeroBSCRM_permsTransactions() ) {
						echo ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_transaction', false ) . $alsoCo . '" class="item"><i class="icon plus"></i> ' . esc_html__( 'Add New', 'zero-bs-crm' ) . '</a>';
					}
					?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['managetransactions'] ) ); ?>"><i class="icon list"></i> <?php esc_html_e( 'View all', 'zero-bs-crm' ); ?></a>
					<a class="item" href="<?php echo jpcrm_esc_link( 'tags', -1, 'zerobs_transaction', false, 'zerobscrm_transactiontag' ); ?>"><i class="icon tags"></i> <?php esc_html_e( 'Tags', 'zero-bs-crm' ); ?></a>

					<?php if ( zeroBSCRM_permsTransactions() ) { ?>
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['export-tools'] ) ); ?>&zbstype=transaction"><i class="icon cloud download"></i> <?php esc_html_e( 'Export', 'zero-bs-crm' ); ?></a>
					<?php } ?>

					<?php

						// filter items (allows additions from ext etc.)
						// for now empty (could contain the above)
						$transactionsMenu = array();
						$transactionsMenu = apply_filters( 'zbs-transactions-menu', $transactionsMenu );
					if ( count( $transactionsMenu ) > 0 ) {

						// show divider?
						?>
							<div class="ui divider"></div>
							<?php

							foreach ( $transactionsMenu as $menuItem ) {
								echo $menuItem; }
					}

					?>
				</div>
			</div>
			<?php } ?>

		<?php
		if ( isset( $usePrevious ) ) {
			?>

		<div class="ui simple dropdown item select" id="zbs-extensions-topmenu" style="z-index:5">
			<span class="text"><?php esc_html_e( 'Extensions', 'zero-bs-crm' ); ?></span>
			<i class="dropdown icon"></i>
			<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
				<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) ); ?>"><i class="icon th" aria-hidden="true"></i> Core Modules</a>
				<?php
				##WLREMOVE
				?>
				<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['extensions'] ) ); ?>"><i class="fa fa-tachometer" aria-hidden="true"></i> Manage Extensions</a>
				<?php
					##/WLREMOVE
					// this allows us to add items to this menu. This is done via add_action
					// e.g. add_action('zbs-top-menu-extensions-dropdown', 'zeroBSCRM_{extensionName}_topmenu', 10); //10 being default.
					do_action( 'zbs-top-menu-extensions-dropdown' );
				?>

			</div>
		</div>

			<div class="ui simple dropdown item select" style="z-index:5">
			<span class="text">Support</span>
			<i class="dropdown icon"></i>
			<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">
				<a href="<?php echo esc_url( $zbs->urls['support'] ); ?>" class="item" target="_blank"><i class="fa fa-paper-plane"></i> <?php esc_html_e( 'Email us', 'zero-bs-crm' ); ?></a>
				<a href="<?php echo esc_url( $zbs->urls['twitter'] ); ?>" class="item" target="_blank"><i class="fa fa-twitter"></i> <?php esc_html_e( 'Tweet us', 'zero-bs-crm' ); ?></a>
				<a href="<?php echo esc_url( $zbs->urls['community'] ); ?>" target="_blank" class="item"><i class="fa fa-slack"></i> <?php esc_html_e( 'Join our Slack', 'zero-bs-crm' ); ?></a>
				<a href="<?php echo esc_url( $zbs->urls['docs'] ); ?>" class="item" target="_blank"><i class="fa fa-file-text-o"></i> <?php esc_html_e( 'Knowledge base', 'zero-bs-crm' ); ?></a>
			</div>
			</div>

			<?php

				// } this puts in the NOTICIATION BELL (or pending notifications count)
				do_action( 'zbs-crm-notify' );

			?>

			<div class="ui simple dropdown item" id="userbutt" style="z-index:5">
			<span class="text">
			<?php
			$uid = get_current_user_id();
			echo jpcrm_get_avatar( $uid, 30 );
			?>
			</span>
			<i class="dropdown icon"></i>
			<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">


				<?php
				// removes this for the teams page for everyone except WP Admin
				if ( current_user_can( 'admin_zerobs_manage_options' ) ) {
					?>
					<a id="zbs-team-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['team'] ) ); ?>" class="item"><i class="fa fa-users"></i> <?php esc_html_e( 'Team', 'zero-bs-crm' ); ?></a>
				<?php } ?>



				<?php if ( zeroBSCRM_permsForms() && zeroBSCRM_getSetting( 'feat_forms' ) > 0 ) { ?>
				<a id="zbs-forms-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['manageformscrm'] ) ); ?>" class="item"><i class="fa fa-file-o"></i> <?php esc_html_e( 'Forms', 'zero-bs-crm' ); ?></a>
				<?php } ?>



				<?php if ( zeroBSCRM_getSetting( 'feat_calendar' ) > 0 ) { ?>
				<a id="zbs-events-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['manage-events'] ) ); ?>" class="item"><i class="fa fa-calendar"></i> <?php esc_html_e( 'Task Scheduler', 'zero-bs-crm' ); ?></a>
				<?php } ?>


				<a id="zbs-settings-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) ); ?>" class="item"><i class="fa fa-cog"></i> <?php esc_html_e( 'Settings', 'zero-bs-crm' ); ?></a>

				<a id="zbs-datatools-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['datatools'] ) ); ?>" class="item"><i class="fa fa-wrench"></i> <?php esc_html_e( 'Tools', 'zero-bs-crm' ); ?></a>



				<?php
				// } Only welcome tour for admins atm
				if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
					?>
				<a id="zbs-tour-top-menu-dash" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) ); ?>&zbs-welcome-tour=1" class="item"><i class="fa fa-magic"></i> <?php esc_html_e( 'Welcome Tour', 'zero-bs-crm' ); ?></a>
				<?php } ?>

				<a id="zbs-team-top-menu" href="<?php echo esc_url( wp_logout_url() ); ?>" class="item"><i class="fa fa-sign-out"></i> <?php esc_html_e( 'Log Out', 'zero-bs-crm' ); ?></a>
			</div>
			</div>


			<?php } // testing this: ?>

			<?php

			// tools menu added to mobile menu above, so collated at top now ^^

			if ( count( $toolsMenu ) > 0 ) {
				?>
			<div class="ui simple dropdown item" id="top-bar-tools-menu">
			<span class="text"><?php esc_html_e( 'Tools', 'zero-bs-crm' ); ?></span>
			<i class="dropdown icon"></i>
			<div class="menu ui inverted zbs-admin-bg-menu zbs-dropdown">

					<?php
					foreach ( $toolsMenu as $menuItem ) {
						echo $menuItem; }
					?>

			</div>
			</div>
				<?php
			}

			// } this puts in the NOTICIATION BELL (or pending notifications count)
			do_action( 'zbs-crm-notify' );
			?>

			<div class="ui simple dropdown item" id="zbs-user-menu-item">
			<span class="text">
			<?php
			$uid = get_current_user_id();
			echo jpcrm_get_avatar( $uid, 30 );
			?>
			</span>
			<i class="dropdown icon"></i>
			</div>

			<?php
			// } Build pop-out

			$popout_menu = array(
				'col1' => array(),
				'col2' => array(),
				'col3' => array(),
			);

			// if admin, settings + datatools
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				$popout_menu['col1'][] = '<a id="zbs-settings2-top-menu" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '" class="item"><i class="settings icon"></i> ' . __( 'Settings', 'zero-bs-crm' ) . '</a>';
				##WLREMOVE
				$popout_menu['col1'][] = '<a id="zbs-datatools-top-menu" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['datatools'] ) . '" class="item"><i class="wrench icon"></i> ' . __( 'Data Tools', 'zero-bs-crm' ) . '</a>';
				##/WLREMOVE
			}
			// teams page for WP Admin or Jetpack CRM Full Admin
			if ( current_user_can( 'manage_options' ) ) {
				$popout_menu['col1'][] = '<a id="zbs-team-top-menu" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['team'] ) . '" class="item"><i class="icon users"></i> ' . __( 'Team', 'zero-bs-crm' ) . '</a>';
			}

			// if admin, system status + extensions
			if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
				$popout_menu['col1'][] = '<a class="item" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '"><i class="server icon" aria-hidden="true"></i> ' . __( 'System Assistant', 'zero-bs-crm' ) . '</a>';
				$popout_menu['col1'][] = '<a class="item" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['emails'] ) . '"><i class="envelope icon" aria-hidden="true"></i> ' . __( 'Emails', 'zero-bs-crm' ) . '</a>';
				$popout_menu['col1'][] = '<a class="item" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) . '"><i class="icon th" aria-hidden="true"></i> ' . __( 'Core Modules', 'zero-bs-crm' ) . '</a>';
				##WLREMOVE
				$popout_menu['col1'][] = '<a class="item" href="' . zeroBSCRM_getAdminURL( $zbs->slugs['extensions'] ) . '"><i class="icon plug" aria-hidden="true"></i> ' . __( 'Extensions', 'zero-bs-crm' ) . '</a>';
				##/WLREMOVE

			}

			// remove the col if nothing in there
			if ( count( $popout_menu['col1'] ) === 0 ) {
				unset( $popout_menu['col1'] );
			}

			?>
			<div class="ui popup bottom left transition hidden" id="zbs-user-menu">
				<?php
				switch ( count( $popout_menu ) ) {
					case 3:
						$menu_style = 'three';
						break;
					case 2:
						$menu_style = 'two';
						break;
					default:
						$menu_style = 'one';
				}
				?>
				<div class="ui <?php echo esc_attr( $menu_style ); ?> column equal height divided grid">
			<?php if ( isset( $popout_menu['col1'] ) && count( $popout_menu['col1'] ) > 0 ) { ?>
				<div class="column">
					<h4 class="ui header"><?php esc_html_e( 'CRM Admin', 'zero-bs-crm' ); ?></h4>
					<div class="ui link list">
					<?php
					foreach ( $popout_menu['col1'] as $link ) {
						echo $link; }
					?>
					</div>
				</div><?php } ?>
				<div class="column">
					<h4 class="ui header"><?php esc_html_e( 'Support', 'zero-bs-crm' ); ?></h4>
					<div class="ui link list">
					
				<?php ##WLREMOVE ?>
					<a href="<?php echo esc_url( $zbs->urls['docs'] ); ?>" class="item" target="_blank"><i class="file text outline icon"></i> <?php esc_html_e( 'Knowledge base', 'zero-bs-crm' ); ?></a>
				<?php ##/WLREMOVE ?>
					
					<a href="<?php echo esc_url( $zbs->urls['support'] ); ?>" class="item" target="_blank"><i class="icon mail outline"></i> <?php esc_html_e( 'Email us', 'zero-bs-crm' ); ?></a>
					
				<?php ##WLREMOVE ?>
					<a href="<?php echo esc_url( $zbs->urls['twitter'] ); ?>" class="item" target="_blank"><i class="icon twitter"></i> <?php esc_html_e( '@jetpackcrm', 'zero-bs-crm' ); ?></a>
				<?php
					// slack for admins :)
				if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
					?>
						<a href="<?php echo esc_url( $zbs->urls['community'] ); ?>" target="_blank" class="item"><i class="slack icon"></i> <?php esc_html_e( 'Join our Slack', 'zero-bs-crm' ); ?></a>
						<?php
				}
				?>
					<?php ##/WLREMOVE ?>
					
					<a class="item" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['feedback'] ) ); ?>"><i class="idea icon" aria-hidden="true"></i> <?php esc_html_e( 'Give Feedback', 'zero-bs-crm' ); ?></a>
					
					<?php
					// welcome tour and crm resources page for admins :)
					if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
						##WLREMOVE
						?>
						<a id="zbs-tour-top-menu-dash" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) ); ?>&zbs-welcome-tour=1" class="item"><i class="icon magic"></i> <?php esc_html_e( 'Welcome Tour', 'zero-bs-crm' ); ?></a>
						<a id="crm-resources-top-menu-dash" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['crmresources'] ) ); ?>" class="item"><i class="icon building"></i> <?php esc_html_e( 'Resources', 'zero-bs-crm' ); ?></a>
						<?php
						##/WLREMOVE
					}
					?>
					</div>
				</div>
				<div class="column">
					<h4 class="ui header"><?php echo esc_html( $currentUser->display_name ); ?></h4>
					<div class="ui link list">

					<a id="zbs-profile-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['your-profile'] ) ); ?>" class="item"><i class="icon user"></i> <?php esc_html_e( 'Your Profile', 'zero-bs-crm' ); ?></a>

					<?php
					if ( zeroBSCRM_getSetting( 'feat_calendar' ) > 0 ) {
						$cID = get_current_user_id();
						?>
					<a id="zbs-events2-top-menu" href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['manage-events'] ) ); ?>&zbsowner=<?php echo esc_attr( $cID ); ?>" class="item"><i class="icon tasks"></i> <?php esc_html_e( 'Your Tasks', 'zero-bs-crm' ); ?></a>
					<?php } ?>

					<?php
					##WLREMOVE //upsell
					if ( ! zeroBSCRM_hasPaidExtensionActivated() && zeroBSCRM_isZBSAdminOrAdmin() ) {
						?>
						
						<a class="item" href="<?php echo esc_url( $zbs->urls['pricing'] ); ?>" target="_blank"><i class="rocket icon" aria-hidden="true"></i> <?php esc_html_e( 'Plans', 'zero-bs-crm' ); ?></a>

					<?php } ##/WLREMOVE ?>

					<div class="ui divider"></div>

					<a href="<?php echo esc_url( wp_logout_url() ); ?>" class="item"><i class="icon sign out"></i> <?php esc_html_e( 'Log Out', 'zero-bs-crm' ); ?></a>
					</div>
				</div>
				</div>
			</div>

		</div>
	</div>
		<?php

	}
}

// dumps out 'active' class if slug matches loaded page
// note 'active' seems to open drop downs, so now using: zbs-currently-browsing
function zeroBS_menu_active( $slug = '' ) {

	if ( ( isset( $_GET['page'] ) && $_GET['page'] == $slug ) || ( isset( $_GET['zbsslug'] ) && $_GET['zbsslug'] == $slug ) ) {
		echo ' zbs-currently-browsing';
	}
}
// dumps out 'active' class if slug is within a 'section'
// note 'active' seems to open drop downs, so now using: zbs-currently-browsing
function zeroBS_menu_active_type( $type = '' ) {

	switch ( $type ) {

		case 'contact':
			if ( zeroBSCRM_isAnyContactPage() ) {
				echo ' zbs-currently-browsing';
			}
			break;
		case 'quote':
			if ( zeroBSCRM_isAnyQuotePage() ) {
				echo ' zbs-currently-browsing';
			}
			break;
		case 'invoice':
			if ( zeroBSCRM_isAnyInvoicePage() ) {
				echo ' zbs-currently-browsing';
			}
			break;
		case 'transaction':
			if ( zeroBSCRM_isAnyTransactionPage() ) {
				echo ' zbs-currently-browsing';
			}
			break;

	}
}
