<?php
/*
 * Jetpack CRM
 * https://jetpackcrm.com
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

	##WLREMOVE

	global $zbs;

	// } Assets we need specifically here

		// js
		wp_enqueue_script( 'jquery' );
		wp_enqueue_script( 'zbswelcomeblock', plugins_url( '/js/welcome-to-zbs/jquery.blockUI.min.js', ZBS_ROOTFILE ), array( 'jquery' ), $zbs->version );
		wp_enqueue_script( 'zbswelcomebootstrap', plugins_url( '/js/welcome-to-zbs/bootstrap.min.js', ZBS_ROOTFILE ), array( 'jquery' ), $zbs->version );
		wp_enqueue_script( 'zbswelcomewizard', plugins_url( '/js/welcome-to-zbs/wizard2' . wp_scripts_get_suffix() . '.js', ZBS_ROOTFILE ), array( 'jquery' ), $zbs->version );

		// css
		wp_enqueue_style( 'zbswelcomebootstrap', plugins_url( '/css/welcome-to-zbs/bootstrap.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomeloadstyles', plugins_url( '/css/welcome-to-zbs/loadstyles' . wp_scripts_get_suffix() . '.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomeopensans', plugins_url( '/css/welcome-to-zbs/opensans' . wp_scripts_get_suffix() . '.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomeadmin', plugins_url( '/css/welcome-to-zbs/admin.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomeexitform', plugins_url( '/css/welcome-to-zbs/zbs-exitform' . wp_scripts_get_suffix() . '.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomeactivation', plugins_url( '/css/welcome-to-zbs/activation.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
		wp_enqueue_style( 'zbswelcomewizard', plugins_url( '/css/welcome-to-zbs/wizard' . wp_scripts_get_suffix() . '.css', ZBS_ROOTFILE ), array(), $zbs->version );
		$style_handles = array( 'zbswelcomebootstrap', 'zbswelcomeloadstyles', 'zbswelcomeopensans', 'zbswelcomeadmin', 'zbswelcomeexitform', 'zbswelcomeactivation', 'zbswelcomewizard' );

	// } Image URLS
	$assetsURLI = ZEROBSCRM_URL . 'i/';

	global $zeroBSCRM_killDenied;
$zeroBSCRM_killDenied = true;
	global $zbs;
$settings      = $zbs->settings->getAll();
	$run_count = get_option( 'zbs_wizard_run', 0 );
	++$run_count;
	update_option( 'zbs_wizard_run', $run_count );
?><!DOCTYPE html>
<html lang="en-US">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="viewport" content="width=device-width">
	<title><?php esc_html_e( 'Welcome to Jetpack CRM', 'zero-bs-crm' ); ?></title>
	<style type="text/css">img.wp-smiley,img.emoji{display:inline !important;border:none !important;box-shadow:none !important;height:1em !important;width:1em !important;margin:0 .07em !important;vertical-align:-0.1em !important;background:none !important;padding:0 !important}#zbscrm-logo img{max-width:20% !important}#feedbackPage{display:none}.zbscrm-setup .zbscrm-setup-actions .button-primary{background-color:#408bc9 !important;border-color:#408bc9 !important;-webkit-box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 0 #408bc9 !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 0 #408bc9 !important;text-shadow:0 -1px 1px #408bc9,1px 0 1px #408bc9,0 1px 1px #408bc9,-1px 0 1px #408bc9 !important;float:right;margin:0;opacity:1}</style>
	<?php

		wp_print_styles( $style_handles );
		wp_print_scripts(); // wp_scripts

	?>
	<style type="text/css" media="print">#wpadminbar { display:none !important; }</style>
	<script type="text/javascript">
		var ajaxurl = '<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>';
	</script>
</head>
<body class="zbscrm-setup wp-core-ui">
			<h1 id="zbscrm-logo"><a href="https://jetpackcrm.com" target="_blank"><img src="<?php echo esc_url( jpcrm_get_logo( false ) ); ?>" alt="Jetpack CRM"></a></h1>
		<div class="zbscrm-setup-content" id="firstPage">
<div class="container">
<div class="stepwizard">
	<div class="stepwizard-row setup-panel">
		<div class="stepwizard-step">
			<a href="#step-1" class="btn btn-primary btn-circle">1</a>
			<p><?php esc_html_e( 'Essentials', 'zero-bs-crm' ); ?></p>
		</div>
		<div class="stepwizard-step">
			<a href="#step-2" class="btn btn-default btn-circle">2</a>
			<p><?php esc_html_e( 'Your Contacts', 'zero-bs-crm' ); ?></p>
		</div>
		<div class="stepwizard-step">
			<a href="#step-3" class="btn btn-default btn-circle">3</a>
			<p><?php esc_html_e( 'Which Extensions?', 'zero-bs-crm' ); ?></p>
		</div>
		<div class="stepwizard-step">
			<a href="#step-4" class="btn btn-default btn-circle">4</a>
			<p><?php esc_html_e( 'Finish', 'zero-bs-crm' ); ?></p>
		</div>
	</div>
</div>
	<div class="row setup-content" id="step-1">
		<div class="col-xs-12">
			<div class="col-md-12">
				<h3><?php esc_html_e( 'Essential Details', 'zero-bs-crm' ); ?></h3>

				<div class="wizopt">

					<label><?php esc_html_e( jpcrm_label_company() . ' Name / CRM Name:', 'zero-bs-crm' ); ?></label>
					<p style="margin-bottom:0"><?php esc_html_e( "This name will be shown at the top left of your CRM. E.g. 'Widget Co CRM'", 'zero-bs-crm' ); ?></p>
					<div style="width:90%;">
						<div style="width:50%;float:left">
							<input class='form-control' type="text" name="zbs_crm_name" id='zbs_crm_name' value="" placeholder="<?php esc_html_e( 'Name of your CRM (e.g Jetpack CRM)', 'zero-bs-crm' ); ?>" style="width:90%" onchange="zbs_crm_name_change();"/>
						</div>
					</div>

					<div class='clear'></div>
				
				</div>

				<div class="wizopt">
					
					<label><?php esc_html_e( 'What Currency should Jetpack CRM use?', 'zero-bs-crm' ); ?></label>
					<br/>
					<select class='form-control' id='zbs_crm_curr' name='zbs_crm_curr'>
						<?php

														$currSetting = '';
						if ( isset( $settings['currency'] ) && isset( $settings['currency']['strval'] ) && $settings['currency']['strval'] ) {
							$currSetting = $settings['currency']['strval'];
						}

						if ( empty( $currSetting ) ) {

															$locale = get_locale();

							if ( $locale == 'en_US' ) {
								$currSetting = 'USD';
							}
							if ( $locale == 'en_GB' ) {
								$currSetting = 'GBP';
							}
						}

														global $whwpCurrencyList;
						if ( ! isset( $whwpCurrencyList ) ) {
							require_once ZEROBSCRM_INCLUDE_PATH . 'wh.currency.lib.php';
						}

						?>
						<option value="" disabled="disabled" selected="selected"><?php esc_html_e( 'Select', 'zero-bs-crm' ); ?>...</option>
						<?php foreach ( $whwpCurrencyList as $currencyObj ) { ?>
							?><option value="<?php echo esc_attr( $currencyObj[1] ); ?>"
														<?php
														if ( $currSetting == $currencyObj[1] ) {
															echo ' selected="selected"';}
														?>
							><?php echo esc_html( $currencyObj[0] . ' (' . $currencyObj[1] . ')' ); ?></option>
						<?php } ?>
					</select>

				</div>

				<div class="wizopt">

					<label><?php esc_html_e( 'What sort of business do you do?', 'zero-bs-crm' ); ?></label>
					<select class="form-control" id="zbs_crm_type" name="zbs_crm_type" onchange="zbs_biz_select();">
						<option value="" disabled="disabled" selected="selected"><?php esc_html_e( 'Select a type...', 'zero-bs-crm' ); ?></option>
						<option value="Freelance"><?php esc_html_e( 'Freelance', 'zero-bs-crm' ); ?></option>
						<option value="FreelanceDev"><?php esc_html_e( 'Freelance (Developer)', 'zero-bs-crm' ); ?></option>
						<option value="FreelanceDes"><?php esc_html_e( 'Freelance (Design)', 'zero-bs-crm' ); ?></option>
						<option value="SmallBLocal"><?php esc_html_e( 'Small Business: Local Service (e.g. Hairdresser)', 'zero-bs-crm' ); ?></option>
						<option value="SmallBWeb"><?php esc_html_e( 'Small Business: Web Business', 'zero-bs-crm' ); ?></option>
						<option value="SmallBOther"><?php esc_html_e( 'Small Business (Other)', 'zero-bs-crm' ); ?></option>
						<option value="ecommerceWoo"><?php esc_html_e( 'eCommerce (WooCommerce)', 'zero-bs-crm' ); ?></option>
						<option value="ecommerceShopify"><?php esc_html_e( 'eCommerce (Shopify)', 'zero-bs-crm' ); ?></option>
						<option value="ecommerceOther"><?php esc_html_e( 'eCommerce (Other)', 'zero-bs-crm' ); ?></option>
						<option value="Other"><?php esc_html_e( 'Other', 'zero-bs-crm' ); ?></option>
					</select>
					<label class='hide' id='zbs_other_label'><?php esc_html_e( 'Please let us know more details about how you intend to your Jetpack CRM so we can refine the product', 'zero-bs-crm' ); ?></label>
					<textarea class='form-control' name='zbs_other_details' id='zbs_other_details'></textarea>

				</div>


				<div class="wizopt">

					<label><?php esc_html_e( 'Menu Style', 'zero-bs-crm' ); ?></label>
					<p>Jetpack CRM <?php esc_html_e( 'can override the WordPress menu, or sit nicely amongst the existing options. Which of the following best suits your use?', 'zero-bs-crm' ); ?></p>

					<div class="zbs-menu-opts">

						<div class="zbs-menu-opt" data-select="zbs-menu-opt-choice-override">

							<div class="zbs-menu-opt-porthole override">
								<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/welcome-to-zbs/zbs-menu-override.png" alt="CRM Menu" />
							</div>
							<div class="zbs-menu-opt-desc">Jetpack CRM <?php esc_html_e( 'Override', 'zero-bs-crm' ); ?></div>
							<input type="radio" name="zbs-menu-opt-choice" id="zbs-menu-opt-choice-override" value="3"/>
							<!-- menu layout ZBS only -->

						</div>

						<div class="zbs-menu-opt" data-select="zbs-menu-opt-choice-slimline">

							<div class="zbs-menu-opt-porthole slimline">
								<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/welcome-to-zbs/zbs-menu-slimline.png" alt="Slim Menu" />
							</div>
							<div class="zbs-menu-opt-desc">Jetpack CRM <?php esc_html_e( 'Slimline', 'zero-bs-crm' ); ?></div>
							<input type="radio" name="zbs-menu-opt-choice" id="zbs-menu-opt-choice-slimline" value="2" checked="checked" />
							<!-- menu layout ZBS Slimline-->

						</div>

						<div class="zbs-menu-opt" data-select="zbs-menu-opt-choice-full">

							<div class="zbs-menu-opt-porthole full">
								<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/welcome-to-zbs/zbs-menu-full.png" alt="Full WP Menu" />
							</div>
							<div class="zbs-menu-opt-desc">Jetpack CRM &amp; WordPress</div>
							<input type="radio" name="zbs-menu-opt-choice" id="zbs-menu-opt-choice-full" value="1" />
							<!-- menu layout "Full"-->

						</div>

						<div class='clear'></div>

					</div> 

					<div class="zbs-extrainfo">
						<?php esc_html_e( "Override mode clears up the admin menu and hides 'posts', 'pages', etc.", 'zero-bs-crm' ); ?><br />
						<em><strong><?php esc_html_e( 'This is super useful if you intend to use the CRM on its own domain (e.g. crm.yourdomain.com)', 'zero-bs-crm' ); ?>.</strong></em><br />
						<?php esc_html_e( 'We recommend that you try this mode - you can change it in the Jetpack CRM settings at any time', 'zero-bs-crm' ); ?>.
					</div>

				</div>


				<!-- for now keep lean, ignore b2b -->
				<div class="wizopt" style="display:none">

					<label><?php esc_html_e( 'B2B Mode', 'zero-bs-crm' ); ?></label>
					<p><?php esc_html_e( "Jetpack CRM an run in 'Business to business' (B2B) Mode, which allows you to manage 'Contacts' under '" . jpcrm_label_company( true ) . "', instead of just 'Contacts'. For most small businesses and freelancers, this isn't necessary", 'zero-bs-crm' ); ?>.</p>
					
					<div>  
						
						<div class="switchBox">
							<div class="switchBoxLabel">B2B <?php esc_html_e( 'Mode', 'zero-bs-crm' ); ?></div>
							<div class="switchCheckbox">
								<input type="checkbox" id="zbs_b2b" value="zbs_b2b" />
								<label for="zbs_b2b"></label>
							</div>
						</div>                        

					</div>

				</div>



				<div class="wizopt">

					<label for="zbs_ess"><?php esc_html_e( 'Usage Tracking', 'zero-bs-crm' ); ?></label>

					<div style="width:100%;">
						<div style="width:25%;float:left;">
							<div class='yesplsess'><p><?php esc_html_e( 'Track CRM Usage', 'zero-bs-crm' ); ?> <input type="checkbox" id="zbs_ess" value="zbs_ess"/></p></div>
						</div>
						<div style="width:75%;float:right;">
							<div class="zbs-extrainfo">
								<?php esc_html_e( 'Share CRM usage data with us. No contact or sensitive CRM data is shared. This helps us build a better CRM by understanding how our users are using it.', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( $zbs->urls['usagetrackinginfo'] ); ?>" style="color: #000000;" target="_blank" ><?php esc_html_e( 'Click here to learn more.', 'zero-bs-crm' ); ?></a>
							</div>
						</div>
						<div class='clear'></div>
					</div>

				</div>

				<hr />

				<div class='clear'></div>
				<button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
			</div>
		</div>
	</div>


	<div class="row setup-content" id="step-2" style="display:none">
		<div class="col-xs-12">
			<div class="col-md-12">

				<!-- ingest -->
				<h3 id="zbs-lead-header"><span class="zbs-nob2b-show"><?php esc_html_e( 'Getting Contacts into your CRM', 'zero-bs-crm' ); ?></span><span class="zbs-b2b-show"><?php esc_html_e( 'Getting Contacts into your CRM', 'zero-bs-crm' ); ?></span></h3>

				<p class="lead zbs-freelancer-lead">
					<?php echo wp_kses( __( "<strong>Freelancing is hard enough without having to manage a contact list as well!</strong><br />We feel your pain.<br /><br />To make life easier we've built extensions which automatically pulls through all of your contacts who've ever paid you into your CRM. If you're using PayPal or Stripe for payments, this is a HUGE timesaver.", 'zero-bs-crm' ), $zbs->acceptable_restricted_html ); ?>
				</p>
				<p class="lead zbs-smallbiz-lead">
					<?php echo wp_kses( __( "<strong>Running a small business is hard work...</strong><br />It's busy. Time passes and you forget to add a contact detail... <em>Then when you need it, it's not there!</em>. We've run businesses for years, <strong>we feel your pain</strong>.<br /><br />To make life easier we've built a few extensions which take a lot of the pain out of this. PayPal Connect &amp; WooSync automatically pull through all customers into your CRM. If you're using PayPal for payments, or WooCommerce for sales, this is a HUGE timesaver.", 'zero-bs-crm' ), $zbs->acceptable_restricted_html ); ?>
				</p>
				<p class="lead zbs-ecomm-lead">
					<?php echo wp_kses( __( "<strong>Running an ecommerce business is hard work...</strong><br />We feel your pain.<br /><br />To make life easier we've built extensions which take a lot of the pain out of this. PayPal Connect &amp; WooSync automatically pull through all customers and transactions, and then it keeps their details up to date. If you're using PayPal for payments, or WooCommerce for sales, this is a HUGE timesaver.", 'zero-bs-crm' ), $zbs->acceptable_restricted_html ); ?>
				</p>

				<div class="zbs-sync-ext">

					<div class="zbs-show-starterbundle zbs-sync-wrap">



						<div class='zbs-eb-wizard'>
							<div class='zbs-eb-callout'>
								<h3>Every extension, every update</h3>
								<p>
									The Entrepreneur Bundle will give you every current and future extension, plus ongoing updates and improvements. 
								</p>    
								<p>
									<em>Simple. Straight forward. Good value.</em>
								</p>
								<a href="<?php echo esc_url( $zbs->urls['pricing'] ); ?>" target="_blank" class="btn btn-jetpack">Connect your CRM to other services</a>
							</div>
							<div id="zbs-starterbundle-img" class="zbs-sync-img">
								<a href="<?php echo esc_url( $zbs->urls['pricing'] ); ?>" target="_blank"><img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/welcome-to-zbs/entrepreneur-bundle.png" alt="Entrepreneur Bundle" /></a>
							</div>

						</div>
					</div>
				  


					
					<div class='clear'></div>

				</div>

				<hr />


				<div class='clear'></div>
				<button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
			</div>
		</div>
	</div>

	<div class="row setup-content" id="step-3" style="display:none">
		<div class="col-xs-12">
			<div class="col-md-12">

				<h3><?php esc_html_e( 'Optional Features', 'zero-bs-crm' ); ?></h3>

				<div class="wizopt">

					<div class="switchbox-right">  
						
						<div class="switchBox">
							<div class="switchCheckbox">
								<input type="checkbox" id="zbs_quotes" value="zbs_quotes" checked="checked" />
								<label for="zbs_quotes"></label>
							</div>
						</div>

					</div>

					<label><?php esc_html_e( 'Enable Quotes', 'zero-bs-crm' ); ?></label>
					<p><?php esc_html_e( 'Quotes (or proposals) are a super powerful part of', 'zero-bs-crm' ); ?> Jetpack CRM. <?php esc_html_e( "We recommend you use this feature, but if you don't want quotes you can turn it off here.", 'zero-bs-crm' ); ?></p>
					

				</div>

				<hr />

				<div class="wizopt">

					<div class="switchbox-right">  
						
						<div class="switchBox">
							<div class="switchCheckbox">
								<input type="checkbox" id="zbs_invoicing" value="zbs_invoicing" checked="checked" />
								<label for="zbs_invoicing"></label>
							</div>
						</div>

					</div>

					<label><?php esc_html_e( 'Enable Invoices', 'zero-bs-crm' ); ?></label>
					<p><?php esc_html_e( "You can run Jetpack CRM with or without Invoicing. We recommend you use this though, as it's very useful (you can invoice online!)", 'zero-bs-crm' ); ?></p>
					<div class="zbs-extrainfo"><?php esc_html_e( 'Accept online payments with', 'zero-bs-crm' ); ?> <a href="https://jetpackcrm.com/product/invoicing-pro/?utm_content=zbsplugin_welcomewiz" target="_blank" style="color:#0073aa;">Invoicing Pro</a> <?php esc_html_e( '(Let your clients pay with Stripe or PayPal)', 'zero-bs-crm' ); ?></div>
					
				</div>

				<hr />

				<div class="wizopt">

					<div class="switchbox-right">  
						
						<div class="switchBox">
							<div class="switchCheckbox">
								<input type="checkbox" id="jpcrm_woo_module" value="jpcrm_woo_module" checked="checked" />
								<label for="jpcrm_woo_module"></label>
							</div>
						</div>

					</div>

					<label><?php esc_html_e( 'Enable WooSync', 'zero-bs-crm' ); ?></label>
					<p><?php esc_html_e( 'Automatically import all your customers, transactions, and invoices from WooCommerce, a full-featured eCommerce solution for WordPress.', 'zero-bs-crm' ); ?></p>
					<div class="zbs-extrainfo"><?php esc_html_e( 'Note that you will also need a site that has the free WooCommerce plugin installed.', 'zero-bs-crm' ); ?></div>
					

				</div>

				<hr />

				<div class="wizopt">

					<div class="zbs-extrainfo">
						<strong><?php esc_html_e( 'Hint', 'zero-bs-crm' ); ?>:</strong> <?php esc_html_e( 'You can always enable or disable these and other CRM features from the WordPress admin menu under CRM Settings → Core Modules.', 'zero-bs-crm' ); ?>
					</div>

				</div>


				<hr />

				<div class='clear'></div>

				<button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
			</div>
		</div>
	</div>



	<div class="row setup-content" id="step-4" style="display:none">
		<div class="col-xs-12">
			<div class="col-md-12 laststage">
				<?php
								global $current_user;
				wp_get_current_user();
				$fname = $current_user->user_firstname;
				$lname = $current_user->user_lastname;
				$em    = $current_user->user_email;
				?>
				<h3><?php esc_html_e( 'Leverage your new CRM! (BONUSES)', 'zero-bs-crm' ); ?></h3>
				<p style="font-size:16px;color:#000"><label><?php esc_html_e( 'Join the Jetpack CRM community today', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Gain access to exclusive bonuses and critical update notifications.', 'zero-bs-crm' ); ?></p>

				<p style="text-align:center">
					<input type="hidden" id="zbs_crm_subblogname" name="zbs_crm_subblogname" value="<?php bloginfo( 'name' ); ?>" />
					<input class='form-control' style="width:40%;margin-right:5%;display:inline-block;font-size:15px;line-height:16px;" type="text" name="zbs_crm_first_name" id="zbs_crm_first_name" value="<?php echo esc_attr( $fname ); ?>" placeholder="<?php esc_attr_e( 'Type your first name', 'zero-bs-crm' ); ?>..." />                    
					<input class='form-control' style="width:40%;margin-right:5%;display:inline-block;font-size:15px;line-height:16px;"  type="text" name="zbs_crm_email" id="zbs_crm_email" value="<?php echo esc_attr( $em ); ?>" placeholder="<?php esc_attr_e( 'Enter your best email', 'zero-bs-crm' ); ?>..." />

					<input class='form-control' style="display:none !important"  type="text" name="zbs_crm_last_name" id="zbs_crm_last_name" value="<?php echo esc_attr( $lname ); ?>" placeholder="<?php esc_attr_e( 'And your last name', 'zero-bs-crm' ); ?>..." />
				</p>

				<div class='clear'></div>
				<div class='yespls'><p style="text-align: center;margin-top: 6px;"><?php esc_html_e( 'Get updates', 'zero-bs-crm' ); ?> <input type="checkbox" id="zbs_sub" value="zbs_sub"/></p></div>



				<hr />

				<div class='clear'></div>

				<button class="btn btn-primary btn-lg pull-right zbs-gogogo" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
			</div>

			<div class="col-md-12 finishingupblock" style="display:none">
				<h3><?php esc_html_e( 'Configuring your Jetpack CRM', 'zero-bs-crm' ); ?></h3>
				<div style='text-align:center'>
				<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/go.gif" alt="Jetpack CRM" style="margin:40px">
				<p><?php esc_html_e( "Just sorting out your new Jetpack CRM setup using the information you have provided, this shouldn't take a moment", 'zero-bs-crm' ); ?>...</p>
				
				</div>
			</div>

			<div class="col-md-12 finishblock" style="display:none">
				<h3> <?php esc_html_e( 'Finished', 'zero-bs-crm' ); ?></h3>
				<div style='text-align:center'>
				<p><?php esc_html_e( 'That’s it, you’re good to go. Get cracking with using your new CRM!', 'zero-bs-crm' ); ?></p>

				</div>
				<?php
					// $loc = 'admin.php?page=zerobscrm-plugin';
					$loc = 'admin.php?page=' . $zbs->slugs['home'];
					echo '<input type="hidden" name="zbswf-ajax-nonce" id="zbswf-ajax-nonce" value="' . esc_attr( wp_create_nonce( 'zbswf-ajax-nonce' ) ) . '" />';
					echo '<input type="hidden" name="phf-finish" id="phf-finish" value="' . esc_attr( admin_url( $loc ) ) . '" />';
				?>
				<div class="text-center">
					<div style="margin:20px">
						<img src="<?php echo esc_attr( ZEROBSCRM_URL ); ?>i/welcome-to-zbs/fireworks.png">
					</div>
					<a class="btn btn-success center btn-lg zbs-finito" href="<?php echo esc_url( admin_url( $loc ) ); ?>"><?php esc_html_e( 'Finish and go to your CRM', 'zero-bs-crm' ); ?>!</a>
				</div>
			</div>
		</div>
	</div>
</div>
</div>			
</body></html><?php ##/WLREMOVE ?>
