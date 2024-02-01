<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Details_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		$new_endpoint = new Details_Endpoint( $client_portal );

		$new_endpoint->portal                       = $client_portal;
		$new_endpoint->slug                         = 'details';
		$new_endpoint->name                         = __('Your Details', 'zero-bs-crm');
		$new_endpoint->hide_from_menu               = false;
		$new_endpoint->menu_order                   = 1;
		$new_endpoint->icon                         = 'fa-user';
		$new_endpoint->template_name                = 'details.php';
		$new_endpoint->add_rewrite_endpoint         = true;
		$new_endpoint->should_check_user_permission = true;

		$endpoints[] = $new_endpoint;
		return $endpoints;
	}

	function render_admin_notice() {
		global $zbs;

		$admin_message = '<b>' . __( 'Admin notice:', 'zero-bs-crm' ) . '</b><br>';
		$admin_message .= __( 'This is the Client Portal contact details page. This will show the contact their details and allow them change information in the fields below. You can hide fields from this page in <i>Settings → Client Portal → Fields to hide on Portal</i>.', 'zero-bs-crm' );
		##WLREMOVE
		$admin_message .= '<br><br><a href="' . $zbs->urls['kbclientportal'] . '" target="_blank">' . __( 'Learn more', 'zero-bs-crm' ) . '</a>';
		##/WLREMOVE

		?>
		<div class='alert alert-info' style="font-size: 0.8em;text-align: left;margin-top:0px;">
		<?php echo $admin_message ?>
		</div><?php
	}

	// Functions that were in the template file
	function save_details() {
		if(
			$_POST['save'] == 1
			&& isset( $_POST['_wpnonce'] )
			&& wp_verify_nonce( $_POST['_wpnonce'], 'jpcrm-update-client-details' )
		) {
			$uid = get_current_user_id();
			$uinfo = get_userdata( $uid );
			$cID = zeroBS_getCustomerIDWithEmail($uinfo->user_email);

			// added !empty check - because if logged in as admin, saved deets, it made a new contact for them
			if((int)$_POST['customer_id'] == $cID && !empty($cID)){

				// handle the password fields, if set.
				if(isset($_POST['password']) && !empty($_POST['password']) && isset($_POST['password2']) && !empty($_POST['password2']) ){

					if($_POST['password'] != $_POST['password2']){
						echo "<div class='zbs_alert danger'>" . esc_html__("Passwords do not match","zero-bs-crm") . "</div>";
					} else {
						// update password
						wp_set_password( sanitize_text_field($_POST['password']), $uid);

						// log password change
						zeroBS_addUpdateLog(
							$cID,
							-1,
							-1,
							array(
								'type' => __( 'Password updated via Client Portal', 'zero-bs-crm' ),
								'shortdesc' => __( 'Contact changed their password via the Client Portal', 'zero-bs-crm' ),
								'longdesc' => '',
							),
							'zerobs_customer'
						);

						// display message
						echo "<div class='zbs_alert'>" . esc_html__( 'Password updated.', 'zero-bs-crm' ) . "</div>";
						// update any details as well
						$this->portal->jpcrm_portal_update_details_from_post($cID);
					}
				} else {
					// update any details as well
					$this->portal->jpcrm_portal_update_details_from_post($cID);
				}

				do_action('jpcrm_client_portal_after_save_details');
			}
		}
	}	

	function get_value( $fieldK, $zbsCustomer ) {
		// get a value (this allows field-irrelevant global tweaks, like the addr catch below...)
		$value = '';
		if (isset($zbsCustomer[$fieldK])) $value = $zbsCustomer[$fieldK];

		// #backward-compatibility
		// contacts got stuck in limbo as we upgraded db in 2 phases.
		// following catches old str and modernises to v3.0
		// make addresses their own objs 3.0+ and do away with this.
		// ... hard typed to avoid custom field collisions, hacky at best.
		switch ($fieldK){

			case 'secaddr1':
				if (isset($zbsCustomer['secaddr_addr1'])) $value = $zbsCustomer['secaddr_addr1'];
				break;

			case 'secaddr2':
				if (isset($zbsCustomer['secaddr_addr2'])) $value = $zbsCustomer['secaddr_addr2'];
				break;

			case 'seccity':
				if (isset($zbsCustomer['secaddr_city'])) $value = $zbsCustomer['secaddr_city'];
				break;

			case 'seccounty':
				if (isset($zbsCustomer['secaddr_county'])) $value = $zbsCustomer['secaddr_county'];
				break;

			case 'seccountry':
				if (isset($zbsCustomer['secaddr_country'])) $value = $zbsCustomer['secaddr_country'];
				break;

			case 'secpostcode':
				if (isset($zbsCustomer['secaddr_postcode'])) $value = $zbsCustomer['secaddr_postcode'];
				break;
		}

		return $value;
	}

	function render_text_field( $fieldK, $fieldV, $value ) {
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?>
		<p>
			<label class='label' for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e( $fieldV[1], 'zero-bs-crm' ); ?>:</label>
			<input <?php echo esc_attr( $extra_attributes ); ?> type="text" name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control widetext" placeholder="<?php echo esc_attr( isset( $fieldV[2] ) ? $fieldV[2] : '' ); ?>" value="<?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>" />
		</p>
		<?php
	}

	function render_price_field($fieldK, $fieldV, $value){
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?><p>
			<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
			<?php echo esc_html( zeroBSCRM_getCurrencyChr() ); ?> <input <?php echo esc_attr( $extra_attributes ); ?> style="width: 130px;display: inline-block;;" type="text" name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control  numbersOnly" placeholder="<?php echo esc_attr( isset( $fieldV[2] ) ? $fieldV[2] : '' ); ?>" value="<?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>" />
		</p><?php
	}

	/**
	 * Renders the HTML of a numeric field identified by $field_key with value $value.
	 *
	 * @param string $field_key The key associated with this field, used (for example) in the input name.
	 * @param object $field_settings Row from the meta table that needs to be updated.
	 * @param object $value Row from the meta table that needs to be updated.
	 *
	 * @return void
	 */
	private function render_numeric_field( $field_key, $field_settings, $value ) {
		$extra_attributes = '';
		if ( isset( $field_settings['read_only'] ) && $field_settings['read_only'] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?>
		<p>
			<label for="<?php echo esc_attr( $field_key ); ?>"><?php echo esc_html( $field_settings[1] ); ?>:</label>
			<input <?php echo esc_attr( $extra_attributes ); ?> style="width: 130px;display: inline-block;;" type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control  numbersOnly" placeholder="<?php echo isset( $field_settings[2] ) ? esc_attr( $field_settings[2] ) : ''; ?>" value="<?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>" />
		</p>
		<?php
	}

	function render_date_field( $field_key, $field_value, $value ) {
		$extra_attributes = '';
		if ( isset( $field_value[ 'read_only' ] ) && $field_value[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled';
		}
		$date_value = '';
		if ( ! empty( $value ) && $value !== -99) {
			$date_value = jpcrm_uts_to_date_str( $value, 'Y-m-d', true );
		}
		?>
			<p>
				<label class='label' for="<?php echo esc_attr( $field_key ); ?>">
					<?php esc_html_e( $field_value[1], 'zero-bs-crm' ); ?>:
				</label>
				<input<?php echo esc_attr( $extra_attributes ); ?> type="date" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="zbsc_<?php echo esc_attr( $field_key ); ?>" placeholder="yyyy-mm-dd" value="<?php echo esc_attr( $date_value ); ?>"/>
			</p>
		<?php
	}

	function render_select_field($fieldK, $fieldV, $value){
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?>
		<p>
			<label class='label' for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
			<select <?php echo esc_attr( $extra_attributes ); ?> name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control zbs-watch-input" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>">
				<?php
				// pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
				$options = array();
				if (isset($fieldV[3]) && is_array($fieldV[3])) {
					$options = $fieldV[3];
				} else {
					// DAL2 these don't seem to be auto-decompiled?
					// doing here for quick fix, maybe fix up the chain later.
					if (isset($fieldV[2])) $options = explode(',', $fieldV[2]);
				}

				if (isset($options) && count($options) > 0){

					//catcher
					echo '<option value="" disabled="disabled"';
					if ( empty( $value ) ) echo ' selected="selected"';
					echo '>'.esc_html__('Select',"zero-bs-crm").'</option>';

					foreach ($options as $opt){

						echo '<option value="' . esc_attr( $opt ) .'"';
						if (isset($value) && strtolower($value) == strtolower($opt)) echo ' selected="selected"';
						// __ here so that things like country lists can be translated
						echo '>' . esc_html( __( $opt, 'zero-bs-crm' ) ) .'</option>';

					}

				} else echo '<option value="">'.esc_html__('No Options',"zero-bs-crm").'!</option>';

				?>
			</select>
			<input type="hidden" name="zbsc_<?php echo esc_attr( $fieldK ); ?>_dirtyflag" id="zbsc_<?php echo esc_attr( $fieldK ); ?>_dirtyflag" value="0" />
		</p>
		<?php
	}

	function render_telephone_field($fieldK, $fieldV, $value, $zbsCustomer) {
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}

		$click2call = 0;
		?><p>
		<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm");?>:</label>
		<input <?php echo esc_attr( $extra_attributes ); ?> type="text" name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control zbs-tel" placeholder="<?php echo esc_attr( isset( $fieldV[2] ) ? $fieldV[2] : '' ); ?>" value="<?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>" />
		<?php if ($click2call == "1" && isset($zbsCustomer[$fieldK]) && !empty($zbsCustomer[$fieldK])) echo '<a href="' . esc_attr( zeroBSCRM_clickToCallPrefix().$zbsCustomer[$fieldK] ) . '" class="button"><i class="fa fa-phone"></i> ' . esc_html( $zbsCustomer[$fieldK] ) . '</a>'; ?>
		<?php
		if ($fieldK == 'mobtel'){

			$sms_class = 'send-sms-none';
			$sms_class = apply_filters('zbs_twilio_sms', $sms_class);
			do_action('zbs_twilio_nonce');

			$customerMob = ''; if (is_array($zbsCustomer) && isset($zbsCustomer[$fieldK]) && isset($contact['id'])) $customerMob = zeroBS_customerMobile($contact['id'],$zbsCustomer);

			if (!empty($customerMob)) echo '<a class="' . esc_attr( $sms_class ) . ' button" data-smsnum="' . esc_attr( $customerMob ) .'"><i class="mobile alternate icon"></i> '. esc_html__('SMS','zero-bs-crm') . ': ' . esc_html( $customerMob ) . '</a>';
		}

		?>
		</p>
		<?php
	}

	function render_email_field($fieldK, $fieldV, $value){
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}

		?><p>
		<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
		<div class="<?php echo esc_attr( $fieldK ); ?>">
			<input <?php echo esc_attr( $extra_attributes ); ?> type="text" name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control zbs-email" placeholder="<?php echo esc_attr( isset( $fieldV[2] ) ? $fieldV[2] : '' ); ?>" value="<?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>" />
		</div>
		</p><?php
	}

	/**
	 * Renders the HTML of a textarea identified by $field_key with value $value.
	 *
	 * @param string $field_key The key associated with this field, used (for example) in the input name.
	 * @param object $field_settings Row from the meta table that needs to be updated.
	 * @param object $value Row from the meta table that needs to be updated.
	 *
	 * @return void
	 */
	private function render_text_area_field( $field_key, $field_settings, $value ) {
		$extra_attributes = "";
		if ( isset( $field_settings['read_only'] ) && $field_settings['read_only'] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?><p>
		<label for="<?php echo esc_attr( $field_key ); ?>"><?php echo esc_html( $field_settings[1] ); ?>:</label>
		<textarea <?php echo esc_attr( $extra_attributes ); ?> name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control" placeholder="<?php echo isset( $field_settings[2] ) ? esc_attr( $field_settings[2] ) : ''; ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>"><?php echo ! empty( $value ) ? esc_attr( $value ) : ''; ?></textarea>
		</p><?php
	}

	function render_country_list_field($fieldK, $fieldV, $value, $showCountryFields) {
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}

		$countries = zeroBSCRM_loadCountryList();

		if ($showCountryFields == "1"){

			?><p>
			<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
			<select <?php echo esc_attr( $extra_attributes ); ?> name="zbsc_<?php echo esc_attr( $fieldK ); ?>" id="<?php echo esc_attr( $fieldK ); ?>" class="form-control" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>">
				<?php

				if (isset($countries) && count($countries) > 0){

					//catcher
					echo '<option value="" disabled="disabled"';
					if ( empty( $value ) ) echo ' selected="selected"';
					echo '>'.esc_html__('Select',"zero-bs-crm").'</option>';

					foreach ($countries as $countryKey => $country){

						// temporary fix for people storing "United States" but also "US"
						// needs a migration to iso country code, for now, catch the latter (only 1 user via api)

						echo '<option value="' . esc_attr( $country ) . '"';
						if (isset($value) && (
								strtolower($value) == strtolower($country)
								||
								strtolower($value) == strtolower($countryKey)
							)) echo ' selected="selected"';
						echo '>' . esc_html( $country ) . '</option>';

					}

				} else echo '<option value="">'.esc_html__('No Countries Loaded',"zero-bs-crm").'!</option>';

				?>
			</select>
			</p><?php

		}
	}

	function render_radio_field($fieldK, $fieldV, $value, $postPrefix) {
		$extra_attributes = "";
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}

		?><p>
		<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
		<div class="zbs-field-radio-wrap">
			<?php

			// pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
			$options = false;
			if (isset($fieldV[3]) && is_array($fieldV[3])) {
				$options = $fieldV[3];
			} else {
				// DAL2 these don't seem to be auto-decompiled?
				// doing here for quick fix, maybe fix up the chain later.
				if (isset($fieldV[2])) $options = explode(',', $fieldV[2]);
			}

			if (isset($options) && is_array($options) && count($options) > 0 && $options[0] != ''){

				$optIndex = 0;

				foreach ($options as $opt){
					// <label><input type="radio" name="group1" id="x" /> <span>Label text x</span></label>
					echo '<div class="zbs-radio">';
					echo '<label for="'.esc_attr( $fieldK ).'-'.esc_attr( $optIndex ).'"><input ' . esc_attr( $extra_attributes ) . ' type="radio" name="' . esc_attr( $postPrefix.$fieldK ) . '" id="'. esc_attr( $fieldK ) . '-' . esc_attr( $optIndex ) . '" value="' . esc_attr( $opt ) . '"';
					if (isset($value) && $value == $opt) echo ' checked="checked"';
					echo ' /> <span>' . esc_html( $opt ) . '</span></label></div>';

					$optIndex++;
				}

			} else echo '-';

			?>
		</div>
		</p><?php
	}

	function render_checkbox_field($fieldK, $fieldV, $value, $postPrefix) {
		$extra_attributes = apply_filters( 'jpcrm_client_portal_detail_field_extra_attributes', $fieldK, $fieldV );
		if ( isset( $fieldV[ 'read_only' ] ) && $fieldV[ 'read_only' ] ) {
			$extra_attributes .= ' readonly disabled ';
		}
		?><p>
		<label for="<?php echo esc_attr( $fieldK ); ?>"><?php esc_html_e($fieldV[1],"zero-bs-crm"); ?>:</label>
		<div class="zbs-field-checkbox-wrap">
			<?php

			// pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
			$options = false;
			if (isset($fieldV[3]) && is_array($fieldV[3])) {
				$options = $fieldV[3];
			} else {
				// DAL2 these don't seem to be auto-decompiled?
				// doing here for quick fix, maybe fix up the chain later.
				if (isset($fieldV[2])) $options = explode(',', $fieldV[2]);
			}

			// split fields (multi select)
			$dataOpts = array();
			if ( !empty( $value ) ) {
				$dataOpts = explode(',', $value);
			}

			if (isset($options) && is_array($options) && count($options) > 0 && $options[0] != ''){

				$optIndex = 0;

				foreach ($options as $opt){
					echo '<div class="zbs-cf-checkbox">';
					echo '<label for="' . esc_attr( $fieldK ) . '-' . esc_attr( $optIndex ) . '"><input ' . esc_attr( $extra_attributes ) . ' type="checkbox" name="' . esc_attr( $postPrefix . $fieldK ) . '-' . esc_attr( $optIndex ) . '" id="' . esc_attr( $fieldK ) . '-' . esc_attr( $optIndex ) . '" value="' . esc_attr( $opt ) . '"';
					if (in_array($opt, $dataOpts)) echo ' checked="checked"';
					echo ' /> <span>' . esc_html( $opt ) . '</span></label></div>';

					$optIndex++;

				}

			} else echo '-';

			?>
		</div>
		</p><?php
	}

	function render_field_by_type( $type, $fieldK, $fieldV, $value, $postPrefix, $showCountryFields, $zbsCustomer ) {
		switch ( $type ) {
			case 'text':
				$this->render_text_field( $fieldK, $fieldV, $value );
				break;
			case 'price':
				$this->render_price_field( $fieldK, $fieldV, $value );
				break;
			case 'date':
				$this->render_date_field( $fieldK, $fieldV, $value );
				break;

			case 'select':
				$this->render_select_field( $fieldK, $fieldV, $value );
				break;

			case 'tel':
				$this->render_telephone_field( $fieldK, $fieldV, $value, $zbsCustomer );
				break;

			case 'email':
				$this->render_email_field( $fieldK, $fieldV, $value );
				break;

			case 'textarea':
				$this->render_text_area_field( $fieldK, $fieldV, $value );
				break;

			// Added 1.1.19
			case 'selectcountry':
				$this->render_country_list_field( $fieldK, $fieldV, $value, $showCountryFields  );
				break;

			// 2.98.5 added autonumber, checkbox, radio
			case 'autonumber':
				// NOT SHOWN on portal :)
				break;

			// radio
			case 'radio':
				$this->render_radio_field( $fieldK, $fieldV, $value, $postPrefix );
				break;

			case 'checkbox':
				$this->render_checkbox_field( $fieldK, $fieldV, $value, $postPrefix );
				break;

			case 'numberint':
			case 'numberfloat':
				$this->render_numeric_field( $fieldK, $fieldV, $value ); //phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				break;

			default:
				do_action( 'jpcrm_client_portal_detail_render_field_by_type', $type, $fieldK, $fieldV, $value, $postPrefix, $showCountryFields, $zbsCustomer );
				break;
		}
	}
}
