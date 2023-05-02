<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: WooCommerce My Account integration
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync My Account integration class
 */
class Woo_Sync_My_Account_Integration {


	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup WooSync
	 * Note: This will effectively fire after core settings and modules loaded
	 * ... effectively on tail end of `init`
	 */
	public function __construct( ) {
		// Initialise Hooks
		$this->init_hooks();
		// Styles and scripts
		$this->register_styles_scripts();
	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Woo_Sync_My_Account_Integration is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Woo_Sync_My_Account_Integration main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}


	/**
	 * Initialise Hooks
	 */
	private function init_hooks( ) {

		// Add menu item to Woo My Account
		add_filter( 'woocommerce_account_menu_items', array( $this, 'append_items_to_woo_menu' ), 99, 1 );

		// Expose invoice content:
		add_action( 'woocommerce_account_invoices_endpoint', array( $this, 'render_invoice_list' ) );

		// Enqueue styles and scripts
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles_scripts' ) );

		// Expose CRM fields for editing on My Account (where specified in `wcport` setting)	
		add_action( 'woocommerce_edit_account_form', array( $this, 'render_additional_crm_fields_on_my_account' ), 10, 0 ); 

		// Save any changes to CRM fields as submitted from My Account page (where used `$this->render_additional_crm_fields_on_my_account`)
		add_action( 'woocommerce_save_account_details', array( $this, 'save_my_account_crm_field_changes'), 10, 1 );

		// See also $zbs->wordpress_user_integration->wordpress_profile_update (catches woo my account + wp profile update changes)

	}


	/**
	 * Get Invoice List
	 */
	public function render_invoice_list(){

		global $zbs;

		$settings = $zbs->modules->woosync->settings->getAll();
		if ( 
			array_key_exists( 'wcacc', $settings) && 
			$settings['wcacc'] &&
			property_exists( $zbs->modules, 'portal' )
		){

			if ( $this->check_customer_has_invoices() ) {
				$invoices_endpoint = new \Automattic\JetpackCRM\Invoices_Endpoint( $zbs->modules->portal );
				$invoices_endpoint->list_invoices_html_output();
			} else {

				echo esc_html__( 'No invoices available.', 'zero-bs-crm' );

			}

		} else {

			echo esc_html__( 'This feature is disabled.', 'zero-bs-crm' );

		}

	}


	/**
	 * Does the current logged in customer have invoices?
	 *
	 * @return bool
	 */
	private function check_customer_has_invoices(){

		$wordpress_user_id = get_current_user_id();
		$uinfo = get_userdata( $wordpress_user_id );
		$contact_id = zeroBS_getCustomerIDWithEmail( $uinfo->user_email );

		if ( $contact_id > 0 ){

			$customer_invoices = zeroBS_getInvoicesForCustomer( $contact_id, true, 100, 0, false );
			
			if ( count( $customer_invoices ) > 0){

				return true;

			}

		}

		return false;
	}


	/**
	 * Appends our menu items (e.g. `Your Invoices`) to the Woo menu stack
	 *  To be fired via hook: `woocommerce_account_menu_items`
	 */
	public function append_items_to_woo_menu( $items ){

		global $zbs;

		$my_account_invoices_enabled = zeroBSCRM_getSetting( 'feat_invs' ) > 0;
		$wc_settings = $zbs->modules->woosync->settings->getAll();

		if ( $my_account_invoices_enabled && $wc_settings['wcacc'] ){

			$modified_items =  array( 'invoices' => __( 'Your Invoices', 'zero-bs-crm' ) );
   			$modified_items = array_slice( $items, 0, 2, true ) + $modified_items + array_slice( $items, 2, count( $items ), true );
			
			$items = $modified_items;

		} 

		return $items;

	}


	/**
	 * Register styles and scripts
	 */
	public function register_styles_scripts() {
		global $zbs;

    	wp_register_style( 'jpcrm-woo-sync-my-account', plugins_url( '/css/jpcrm-woo-sync-my-account'.wp_scripts_get_suffix().'.css', JPCRM_WOO_SYNC_ROOT_FILE ) );
		wp_register_style( 'jpcrm-woo-sync-fa', plugins_url( '/css/font-awesome.min.css', ZBS_ROOTFILE ) );
	}

	/**
	 * Enqueue styles and scripts
	 */
	public function enqueue_styles_scripts(){

		$account_page_id = get_option('woocommerce_myaccount_page_id');

		if ( is_page( $account_page_id ) ) {
			global $zbs;
			wp_enqueue_style( 'jpcrm-woo-sync-my-account' );
			wp_enqueue_style( 'jpcrm-woo-sync-fa'	);
			wp_enqueue_script('wh-moment-v2-8-1-js', untrailingslashit(ZEROBSCRM_URL) .'/js/lib/moment-with-locales.min.js', array('jquery'), $zbs->version );
			zeroBSCRM_enqueue_libs_js_momentdatepicker();
			// Adds the public portal script with the daterangepicker locale inline (it retrieves the locale from our core function)
			$locale_opt_for_daterangepicker = json_encode( zeroBSCRM_date_localeForDaterangePicker() );
			wp_enqueue_script( 'jpcrm-public-bind-daterange-js', plugins_url( '/js/jpcrm-public-bind-daterange'.wp_scripts_get_suffix() . '.js', ZBS_ROOTFILE ), $zbs->version, true );
			wp_add_inline_script( 'jpcrm-public-bind-daterange-js', 'var JPCRM_PUBLIC_LOCALE_OPT_FOR_DATERANGEPICKER = ' . $locale_opt_for_daterangepicker . ';', 'before' );
		}

	}



	/**
	 * Render CRM fields for editing on My Account (where specified in `wcport` setting)
	 * WH note: This could make use of a central functions for a chunk of it (e.g. shared with portal/front-end exposed fields?)
	 */
	public function render_additional_crm_fields_on_my_account() { 

		// make action magic happen here... 
		global $zbs, $zbsCustomerFields, $zbsFieldsEnabled;

		$settings = $zbs->modules->woosync->settings->getAll();

		if ( array_key_exists( 'wcport', $settings ) ){
	
			// Retrieve current user data
			$wordpress_user_id            = get_current_user_id();
			$uinfo          = get_userdata( $wordpress_user_id );
			$contact_id     = zeroBS_getCustomerIDWithEmail($uinfo->user_email);
			$crm_contact    = zeroBS_getCustomerMeta($contact_id);

			// Field models/settings

			// Fields pulled from contact model
			$fields = $zbsCustomerFields;

			// Retireve fields show/hide statuses
			$fields_to_show = $settings['wcport'];
			$fields_to_hide = $zbs->settings->get('fieldhides');	
			$fields_to_show_on_woo_my_account = explode(",", $fields_to_show);

            // Fields to hide for front-end situations (Portal)
            $fields_to_hide_on_portal = $zbs->DAL->fields_to_hide_on_frontend( ZBS_TYPE_CONTACT );

            // Portal hide field setting (overrides global setting ^)
			$portal_hide_fields_setting = $zbs->settings->get('portal_hidefields');
			if ( isset( $portal_hide_fields_setting ) ){

				$portal_hide_fields_setting_array = explode( ',', $portal_hide_fields_setting );
				if ( is_array( $portal_hide_fields_setting_array ) ){

					$fields_to_hide_on_portal = $portal_hide_fields_setting_array;
				}

			}

			// Address/contact settings
			$show_addresses = zeroBSCRM_getSetting('showaddress');
			$show_second_address = zeroBSCRM_getSetting('secondaddress');
			$show_address_country_field = zeroBSCRM_getSetting('countries');
			$click2call = false;

			// Legacy: This global holds "enabled/disabled" for specific fields... ignore unless you're WH or ask
			if ( $show_second_address == "1" ) {
				$zbsFieldsEnabled['secondaddress'] = true;
			} 
		
			// Track group element state
			$open_field_group   = false;
			$field_group_key    = '';

			?>
			<input type="hidden" name="zbs_customer_id" id="zbs_customer_id" value="<?php echo esc_attr( $contact_id ); ?>" />
			<?php

			// Cycle through fields and op
			foreach ( $fields as $field_key => $field_value ){

				// Hard global front-end & specific Woo My Account blocking of some fields
				if (
					// Global block
					!in_array( $field_key, $fields_to_hide_on_portal )
					&& // Woo My Account settings specific block
					in_array( $field_key, $fields_to_show_on_woo_my_account )
					&& // Hard-hidden by opt override (on off for second address, mostly)
					!( isset( $field_value['opt'] ) && ( !isset( $zbsFieldsEnabled[ $field_value['opt'] ] ) || !$zbsFieldsEnabled[ $field_value['opt']] ) )
					&& // or is hidden by checkbox? 
					!( isset( $fields_to_hide['customer'] ) && is_array( $fields_to_hide['customer'] ) && in_array( $field_key, $fields_to_hide['customer'] ) )
				){
					// Output all fields with a field format type
					if ( isset( $field_value[0] ) ){

						// Output Fields in Woo matching format (<p> per line)
						?><p class="form-row"><?php

						// Split by field format
						switch ( $field_value[0] ){

							case 'text':

								?>
								<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
								<input type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="input-text" style="width: 100%;padding: 15px;margin-bottom: 18px;" placeholder="<?php if (isset($field_value[2])) echo esc_attr( $field_value[2] ); ?>" value="<?php if (isset($crm_contact[$field_key])) echo esc_attr( $crm_contact[$field_key] ); ?>" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>" />
								<?php

								break;

							case 'price':

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e($field_value[1],"zero-bs-crm"); ?></label>
									<?php echo esc_html( zeroBSCRM_getCurrencyChr() ); ?> <input style="width: 130px;display: inline-block;" type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control  numbersOnly" placeholder="<?php if (isset($field_value[2])) echo esc_attr( $field_value[2] ); ?>" value="<?php if (isset($crm_contact[$field_key])) echo esc_attr( $crm_contact[$field_key] ); ?>" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>" />
								<?php

								break;


							case 'date':
								$value = (isset($crm_contact[$field_key])) ? $crm_contact[$field_key] : null;

								$date_value = '';
								if ( ! empty( $value ) && $value !== -99) {
									$date_value = zeroBSCRM_date_i18n( -1, $value, false, true );
								}
							?>
								<p>
									<label class='label' for="<?php echo esc_attr( $field_key ); ?>">
										<?php esc_html_e( $field_value[1], 'zero-bs-crm' ); ?>:
									</label>
									<input
										type="text"
										name="zbsc_<?php echo esc_attr( $field_key ); ?>"
										id="zbsc_<?php echo esc_attr( $field_key ); ?>"
										class="form-control widetext zbs-date zbs-empty-start zbs-dc"
										placeholder="<?php if ( isset( $field_value[2] ) ) echo esc_attr__( $field_value[2], 'zero-bs-crm' ); ?>"
										value="<?php echo esc_attr( $date_value ); ?>"
										autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>"
									/>
								</p>
							<?php
								break;

							case 'select':

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e($field_value[1],"zero-bs-crm"); ?></label>
									<select name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control zbs-watch-input" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>">
										<?php
											// pre DAL 2 = $field_value[3], DAL2 = $field_value[2]
											$options = array(); 
											if (isset($field_value[3])) {

												$options = $field_value[3];

											} else {

												// DAL2 these don't seem to be auto-decompiled
												if ( isset( $field_value[2] ) ) {
													$options = explode( ',', $field_value[2] );
												}

											}

											if (isset($options) && count($options) > 0){

												echo '<option value="" disabled="disabled"';
												if (
														!isset( $crm_contact[$field_key] )
														|| 
														( isset( $crm_contact[$field_key] ) && empty( $crm_contact[$field_key] ) )
													) {

													echo ' selected="selected"';

												}
												echo '>' . esc_html__( 'Select', "zero-bs-crm" ) . '</option>';

												foreach ($options as $opt){

													echo '<option value="' . esc_attr( $opt ) . '"';

													if ( isset( $crm_contact[$field_key] ) && strtolower( $crm_contact[$field_key] ) == strtolower( $opt ) ){
														
														echo ' selected="selected"'; 

													}

													// __ here so that things like country lists can be translated
													echo '>' . esc_html__( $opt, "zero-bs-crm" ) . '</option>';

												}

											} else echo '<option value="">' . esc_html__( 'No Options', "zero-bs-crm" ) . '!</option>';

										?>
									</select>
								<?php

								break;

							case 'tel':

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e($field_value[1],"zero-bs-crm");?></label>
									<input type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control zbs-tel" placeholder="<?php if (isset($field_value[2])) echo esc_attr( $field_value[2] ); ?>" value="<?php if (isset($crm_contact[$field_key])) echo esc_attr( $crm_contact[$field_key] ); ?>" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>" />
									<?php

									if ( $click2call == "1" && isset( $crm_contact[$field_key] ) && !empty( $crm_contact[$field_key] ) ) {
										
										echo '<a href="' . esc_attr( zeroBSCRM_clickToCallPrefix() . $crm_contact[$field_key] ) . '" class="button"><i class="fa fa-phone"></i> ' . esc_html( $crm_contact[$field_key] ) . '</a>';
									
									}

									if ( $field_key == 'mobtel' ){

										// Twilio hook-in
										do_action( 'zbs_twilio_nonce' );

										// Twilio filtering for css classes
										$sms_class = 'send-sms-none';
										$sms_class = apply_filters( 'zbs_twilio_sms', $sms_class ); ;

										$contact_mobile = ''; 
										if ( is_array( $crm_contact ) && isset( $crm_contact[$field_key] ) && isset( $contact['id'] ) ){
										
											$contact_mobile = zeroBS_customerMobile( $contact['id'], $crm_contact );

										}
										
										if ( !empty( $contact_mobile) ){
											echo '<a class="' . esc_attr( $sms_class ) . ' button" data-smsnum="' . esc_attr( $contact_mobile ) .'"><i class="mobile alternate icon"></i> ' . esc_html__( 'SMS', 'zero-bs-crm' ) . ': ' . esc_html( $contact_mobile ) . '</a>';
										}

									}

										?>
								<?php

								break;

							case 'email':

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?>:</label>
									<input type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control zbs-email" placeholder="<?php if (isset($field_value[2])) echo esc_attr( $field_value[2] ); ?>" value="<?php if (isset($crm_contact[$field_key])) echo esc_attr( $crm_contact[$field_key] ); ?>" autocomplete="off" />
								<?php

								break;

							case 'textarea':

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?>:</label>
									<textarea name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control" placeholder="<?php if (isset($field_value[2])) echo esc_attr( $field_value[2] ); ?>" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>"><?php if (isset($crm_contact[$field_key])) echo esc_textarea($crm_contact[$field_key]); ?></textarea>
								<?php

								break;

							#} Added 1.1.19 
							case 'selectcountry':

								$countries = zeroBSCRM_loadCountryList();

								if ( $show_address_country_field == "1" ){

								?><label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
									<select name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control" autocomplete="zbscontact-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>">
										<?php

											// got countries?
											if ( isset( $countries ) && count( $countries ) > 0 ){

												echo '<option value="" disabled="disabled"';
												if ( 
													!isset( $crm_contact[$field_key] ) 
													||
													( isset( $crm_contact[$field_key] ) && empty( $crm_contact[$field_key] ) ) ){

													 echo ' selected="selected"';

												}
												echo '>' . esc_html__( 'Select', "zero-bs-crm" ) . '</option>';

												foreach ($countries as $countryKey => $country){

													// temporary fix for people storing "United States" but also "US"
													// needs a migration to iso country code, for now, catch the latter (only 1 user via api)

													echo '<option value="' . esc_attr( $country ) . '"';
													if ( 
														isset( $crm_contact[$field_key] ) 
														&& 
														( 
															strtolower( $crm_contact[$field_key] ) == strtolower( $country )
															||
															strtolower( $crm_contact[$field_key] ) == strtolower( $countryKey )
														)
													){
														
														echo ' selected="selected"'; 

													}

													echo '>' . esc_html( $country ) . '</option>';

												}

											} else echo '<option value="">' . esc_html__( 'No Countries Loaded', "zero-bs-crm" ) . '!</option>';

										?>
									</select><?php

								}

								break;

							// auto number - can't actually edit autonumbers, so its just outputting :)
							case 'autonumber':

								?>
								<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
								<?php
									// output any saved autonumber for this obj
									$value = $field_value[2];
									$str   = '';
									if ($value !== -99) {
										$str = $value;
									}

									// we strip the hashes saved in db for easy separation later
									$str = str_replace('#','',$str);

									// then output...
									if ( empty( $str ) ) {
										echo '~';
									} else {
										echo esc_html( $str );
									}

									break;

							case 'numberint':
								$value = isset( $crm_contact[$field_key] ) ? $crm_contact[$field_key] : -99;

								?>
								<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
								<input style="width: 130px;display: inline-block;" type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control intOnly zbs-dc zbs-custom-field" placeholder="<?php if (isset($field_value[2])) echo esc_attr__($field_value[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>" />
								<?php

									break;

							case 'numberfloat':
								$value = isset( $crm_contact[$field_key] ) ? $crm_contact[$field_key] : -99;

								?>
								<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
								<input style="width: 130px;display: inline-block;" type="text" name="zbsc_<?php echo esc_attr( $field_key ); ?>" id="<?php echo esc_attr( $field_key ); ?>" class="form-control numbersOnly zbs-dc zbs-custom-field" placeholder="<?php if (isset($field_value[2])) echo esc_attr__($field_value[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $field_key ); ?>" />
								<?php

									break;

							case 'checkbox':
									$value = isset( $crm_contact[$field_key] ) ? $crm_contact[$field_key] : -99;

								?>
								<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
								<?php
									// pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
									$options = false; 
									if ( isset( $field_value[3] ) && is_array( $field_value[3] ) ) {
										$options = $field_value[3];
									} else if ( isset( $field_value[2] ) ) {
										// DAL2 these don't seem to be auto-decompiled?
										// doing here for quick fix, maybe fix up the chain later.
										$options = explode( ',', $field_value[2] );
									}

									// split fields (multi select)
									$data_options = array();
									if ( $value !== -99 && ! empty( $value ) ) {
										$data_options = explode(',', $value);
									}

									if (
										isset( $options ) 
										&& is_array( $options ) 
										&& count( $options ) > 0 
										&& $options[0] != ''
									) {
										$option_index = 0;

										foreach ( $options as $opt ) {
											echo '<div class="ui checkbox"><input type="checkbox" name="zbsc_' . esc_attr( $field_key . '-' . $option_index ) . '" id="' . esc_attr( $field_key . '-' . $option_index ) . '" value="' . esc_attr( $opt ) . '"';
											if ( in_array( $opt, $data_options ) ) {
												echo ' checked="checked"';
											}
											echo ' /><label for="' . esc_attr( $field_key . '-' . $option_index ) . '">' . esc_html( $opt ) . '</label></div>';

											$option_index++;
										}

									} else {
										echo '<label for="' . esc_attr( $field_key ) . '-0">' . esc_html__( 'No Options', 'zero-bs-crm' ) . '!</label>';
									}
								?>
								<input type="hidden" name="zbsc_<?php echo esc_attr( $field_key ); ?>_dirtyflag" id="zbsc_<?php echo esc_attr( $field_key ); ?>_dirtyflag" value="0" />
								<?php

									break;

							case 'radio':
									$value = isset( $crm_contact[$field_key] ) ? $crm_contact[$field_key] : -99;

									?>
									<label for="<?php echo esc_attr( $field_key ); ?>"><?php esc_html_e( $field_value[1], "zero-bs-crm" ); ?></label>
									<div class="zbs-field-radio-wrap">
									<?php
										// pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
										$options = false; 
										if ( isset( $field_value[3] ) && is_array( $field_value[3] ) ) {
											$options = $field_value[3];
										} else if ( isset( $field_value[2] ) ) {
											// DAL2 these don't seem to be auto-decompiled?
											// doing here for quick fix, maybe fix up the chain later.
											$options = explode( ',', $field_value[2] );
										}

										if (
											isset( $options ) 
											&& is_array( $options )
											&& count( $options ) > 0 
											&& $options[0] != ''
										) {
											$option_index = 0;

											foreach ( $options as $opt ) {
												echo '<div class="zbs-radio"><input type="radio" name="zbsc_' . esc_attr( $field_key ) . '" id="' . esc_attr( $field_key . '-' . $option_index ) . '" value="' . esc_attr( $opt ) . '"';

												if ($value !== -99 && $value == $opt) echo ' checked="checked"'; 
												echo ' /> <label for="' . esc_attr( $field_key . '-' . $option_index ) . '">' . esc_html( $opt ) . '</label></div>';

												$option_index++;
											}

										} else {
											echo '<label for="' . esc_attr( $field_key ) . '-0">' . esc_html__( 'No Options', 'zero-bs-crm' ) . '!</label>';
										}

									?>
										</div>
										<input type="hidden" name="zbsc_<?php echo esc_attr( $field_key ); ?>_dirtyflag" id="zbsc_<?php echo esc_attr( $field_key ); ?>_dirtyflag" value="0" />
									<?php

									break;
						}

					}

					?></p><?php

				} // / not in 'hard do not show' list

			} // foreach field
		
		} // if array key does not exist

	}
	

	/**
	 * Save any changes made from extra field additions on My Account page (via `$this->render_additional_crm_fields_on_my_account`)
	 *
	 * @param int $wordpress_user_id
	 */
	public function save_my_account_crm_field_changes( $wordpress_user_id ) {
		global $zbs, $zbsCustomerFields;

		$contact_id = zeroBS_getCustomerIDFromWPID( $wordpress_user_id );
		$old_contact_data = $zbs->DAL->contacts->getContact( $contact_id );
		$new_contact_data = zeroBS_buildCustomerMeta($_POST, $old_contact_data);

		// Here we check for fields already updated via core WordPress User integration
		if ( defined( 'JPCRM_PROFILE_UPDATE_CHANGES' ) ){
			$do_not_update = JPCRM_PROFILE_UPDATE_CHANGES;
		} else {
			$do_not_update = array();
		}

		if ( $contact_id > 0 ) {
			// First thing we have to do is to get some fields from WooCommerce
			// and 'translate' their key names into our CRM key names.
			$woo_field_to_crm_field = array(
				'account_first_name' => 'fname',
				'account_last_name' => 'lname',
				'account_email' => 'email',
			);

			foreach ( $_POST as $post_key => $post_value ) {
				if ( ! isset( $woo_field_to_crm_field[ $post_key ] ) ) {
					continue;
				}
				
				$crm_field = $woo_field_to_crm_field[ $post_key ];
			
				if ( ! in_array( $crm_field, $do_not_update ) ) {
						$new_contact_data[ $crm_field ] = $post_value;
				}
			}

			// TODO: This is the same code from Client Portal. This should be centralised somehow.
			// process fields
			$fields_to_change = array();
			foreach ( $new_contact_data as $key => $value ) {
				if ( !isset( $zbsCustomerFields[$key] ) || in_array( $key, $do_not_update ) ) {
					$new_contact_data[$key] = $old_contact_data[$key];
				}
				// collect fields that changed
				elseif ( isset($old_contact_data[$key]) && $old_contact_data[$key] != $value ) {
					$fields_to_change[] = $key;
				}
			}
			// update contact if fields changed
			if ( count( $fields_to_change ) > 0 ) {
				$contact_id = $zbs->DAL->contacts->addUpdateContact(
					array(
						'id'    =>  $contact_id,
						'data'  => $new_contact_data,
						'do_not_update_blanks' => false
					)
				);

				// update log if contact update was successful
				if ( $contact_id ) {

					// build long description string for log
					$longDesc = '';
					foreach ( $fields_to_change as $field ) {
						if ( !empty( $longDesc ) ) {
							$longDesc .= '<br>';
						}
						$longDesc .= sprintf( '%s: <code>%s</code> → <code>%s</code>', $field, $old_contact_data[$field], $new_contact_data[$field]);
					}

					zeroBS_addUpdateLog(
						$contact_id,
						-1,
						-1,
						array(
							'type' => __( 'Details updated via WooCommerce My Account', 'zero-bs-crm' ),
							'shortdesc' => __( 'Contact changed some of their details via WooCommerce My Account', 'zero-bs-crm' ),
							'longdesc' => $longDesc,
						),
						'zerobs_customer'
					);
				}
			}
		}
	}

}