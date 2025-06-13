<?php
/**
 * Your Details Page
 *
 * This displays the users details for editing
 *
 * @package automattic/jetpack-crm
 * @see     https://kb.jetpackcrm.com/
 * @version 3.0
 */

defined( 'ABSPATH' ) || exit( 0 ); // Don't allow direct access

global $zbs, $zbsCustomerFields; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
$portal           = $zbs->modules->portal;
$details_endpoint = new Automattic\JetpackCRM\Details_Endpoint( $portal );

do_action( 'zbs_enqueue_scripts_and_styles' );

// handle the saving of the details.
if ( array_key_exists( 'save', $_POST ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
	$details_endpoint->save_details();
}

$uid        = get_current_user_id();
$uinfo      = get_userdata( $uid );
$contact_id = zeroBS_getCustomerIDWithEmail( $uinfo->user_email );

?>
<div class="alignwide zbs-site-main zbs-portal-grid">
	<nav class="zbs-portal-nav">
		<?php

		// define
		$details_slug = 'details';

		// This function is defined in Client Portal Pro.
		if ( function_exists( 'zeroBSCRM_clientPortalgetEndpoint' ) ) {
			$details_slug = zeroBSCRM_clientPortalgetEndpoint( 'details' );
		}
		$portal->render->portal_nav( $details_slug );
		?>
	</nav>
	<div class='zbs-portal-content'>
		<?php
		$page_title = __( 'Your Details', 'zero-bs-crm' );
		$page_title = apply_filters( 'zbs_portal_details_title', $page_title );
		?>
		<h2><?php echo esc_html( $page_title ); ?></h2>
		<?php
		// if admin, explain
		if ( current_user_can( 'admin_zerobs_manage_options' ) && empty( $contact_id ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown,WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$details_endpoint->render_admin_notice();
		}
		?>
		<div class='zbs-entry-content' style="position:relative;">
			<form enctype="multipart/form-data" action="#" name="zbs-update-deets" method="POST" style="padding-bottom:50px;" class="form-horizontal form-inline">
				<?php

				wp_nonce_field( 'jpcrm-update-client-details' );

				$fields = $zbsCustomerFields; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$fields = apply_filters( 'jpcrm_client_portal_detail_fields', $fields );

				// Get field Hides...
				$field_hide_overrides = $zbs->settings->get( 'fieldhides' );
				$contact_obj          = zeroBS_getCustomerMeta( $contact_id );

				$open_group = false;

				// Fields to hide for front-end situations (Portal)
				$fields_to_hide_on_portal = $zbs->DAL->fields_to_hide_on_frontend( ZBS_TYPE_CONTACT ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$potential_not_to_show    = $zbs->settings->get( 'portal_hidefields' );
				if ( isset( $potential_not_to_show ) ) {
					$potential_not_to_show = explode( ',', $potential_not_to_show );
				}
				if ( is_array( $potential_not_to_show ) ) {
					$fields_to_hide_on_portal = $potential_not_to_show;
				}

				?>
				<input type="hidden" name="customer_id" id="customer_id" value="<?php echo esc_attr( $contact_id ); ?>" />
				<div class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItem">
					<?php

					// Address settings
					$show_addresses      = zeroBSCRM_getSetting( 'showaddress' );
					$show_second_address = zeroBSCRM_getSetting( 'secondaddress' );
					$show_country_fields = zeroBSCRM_getSetting( 'countries' );

					// This global holds "enabled/disabled" for specific fields... ignore unless you're WH or ask
					global $zbsFieldsEnabled; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					if ( $show_second_address == '1' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
						$zbsFieldsEnabled['secondaddress'] = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					}

					$second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
					if ( empty( $second_address_label ) ) {
						$second_address_label = __( 'Second Address', 'zero-bs-crm' );
					}

					$post_prefix     = 'zbsc_';
					$zbs_field_group = '';
					$address_areas   = array(
						'Main Address'   => 'jpcrm-main-address',
						'Second Address' => 'jpcrm-second-address',
					);

					$was_open_multigroup_wrap = false;
					foreach ( $fields as $field_key => $field_value ) {
						// WH hard-not-showing some fields
						if ( in_array( $field_key, $fields_to_hide_on_portal, true ) ) {
							continue;
						}
						// Hide address fields by group
						if (
							isset( $field_value['area'] )
							&& isset( $address_areas[ $field_value['area'] ] )
							&& in_array( $address_areas[ $field_value['area'] ], $fields_to_hide_on_portal, true )
						) {
							continue;
						}

						$show_field = true;

						// Check if not hard-hidden by opt override (on off for second address, mostly)
						if ( isset( $field_value['opt'] ) && ( ! isset( $zbsFieldsEnabled[ $field_value['opt'] ] ) || ! $zbsFieldsEnabled[ $field_value['opt'] ] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							$show_field = false;
						}

						// or is hidden by checkbox?
						if ( isset( $field_hide_overrides['customer'] ) && is_array( $field_hide_overrides['customer'] ) ) {
							if ( in_array( $field_key, $field_hide_overrides['customer'], true ) ) {
								$show_field = false;
							}
						}

						// ==================================================================================
						// Following grouping code needed moving out of ifShown loop:

						// Whatever prev field group was, if this is diff, close (post group)
						if (
							$open_group &&
							// diff group
							(
								( isset( $field_value['area'] ) && $field_value['area'] !== $zbs_field_group ) ||
								// No group
								! isset( $field_value['area'] ) && $zbs_field_group !== ''
							)
						) {
							echo '</div>';
							$open_group = false;
						}

						// Any groupings?
						if ( isset( $field_value['area'] ) ) {
							if ( ! $was_open_multigroup_wrap ) {
								echo '<div class="zbs-multi-group-wrap">';
								$was_open_multigroup_wrap = true;
							}

							// First in a grouping? (assumes in sequential grouped order)
							if ( $zbs_field_group != $field_value['area'] ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
								// set it
								$zbs_field_group = $field_value['area'];

								// Make class for hiding address (this form output is weird) <-- classic mike saying my code is weird when it works fully. Ask if you don't know!
								// DR Still Weird?
								$jpcrm_should_hide_or_not_class = '';
								// if addresses turned off, hide the lot
								if (
									$show_addresses !== 1
									|| ( $zbs_field_group === 'Second Address' && $show_second_address !== 1 )
								) {
									$jpcrm_should_hide_or_not_class = 'zbs-hide';
								}

								if ( $field_value['area'] === 'Second Address' ) {
									echo '<div class="zbs-multi-group-item ' . esc_attr( $jpcrm_should_hide_or_not_class ) . '"><label class="zbs-field-group-label">' . esc_html( $second_address_label ) . '</label>';
								} else {
									echo '<div class="zbs-multi-group-item ' . esc_attr( $jpcrm_should_hide_or_not_class ) . '"><label class="zbs-field-group-label">' . esc_html__( $field_value['area'], 'zero-bs-crm' ) . '</label>'; // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
								}
								// Set this (need to close)
								$open_group = true;
							}
						} else {
							// No groupings!
							$zbs_field_group = '';
						}

						// Grouping
						// ==================================================================================

						// close opened wrap of groups
						if ( ! array_key_exists( 'area', $field_value ) && $was_open_multigroup_wrap ) {
							echo '</div>';
							$was_open_multigroup_wrap = false;
						}

						// If field is set to show...
						if ( $show_field ) {
							// This whole output is LEGACY
							// v3.0 + this is resolved in core via zeroBSCRM_html_editFields() and zeroBSCRM_html_editField()
							// ... in FormatHelpers.
							// ... this could do with re-writing to match that.
							$value = $details_endpoint->get_value( $field_key, $contact_obj );
							if ( isset( $field_value[0] ) ) {

								if ( $zbs_field_group === 'Second Address' ) {
									$field_value[1] = str_replace( ' (' . $second_address_label . ')', '', $field_value[1] );
								}
								$details_endpoint->render_field_by_type( $field_value[0], $field_key, $field_value, $value, $post_prefix, $show_country_fields, $contact_obj );
							}
						}
					} // foreach field
					// closes any groups/tabs that are still open
					if ( $was_open_multigroup_wrap ) {
						echo '</div>';
					}
					if ( $open_group ) {
						echo '</div>';
					}
					?>
				<p>
					<label style="margin-top:2em;"><?php esc_html_e( 'Change your password (or leave blank to keep the same)', 'zero-bs-crm' ); ?></label>
					<input class="form-control" type="password" id="password" name="password" value=""/>
				</p>
				<p>
					<label><?php esc_html_e( 'Re-enter password', 'zero-bs-crm' ); ?></label>
					<input class="form-control" type="password" id="password2" name="password2" value=""/>
				</p>
				<p>
					<input type="hidden" id="save" name="save" value="1"/>
					<input type="submit" id="submit" value="<?php esc_attr_e( 'Submit', 'zero-bs-crm' ); ?>"/>
				</p>
				</div>
			</form>
		</div>
	</div>
	<div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>


