<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


/* ======================================================
   Front end Form Funcs
   ====================================================== */

// forms iframes, moved to templates as of 29/10/19

// include endpoint
function zeroBSCRM_forms_includeEndpoint(){

	// add our iframe endpoint
	add_rewrite_endpoint( 'crmforms', EP_ROOT );

	// add action to catch on template redirect
	add_action( 'template_redirect', 'zeroBSCRM_forms_templateRedirect' );

}
//add_action( 'init', 'zeroBSCRM_forms_includeEndpoint');

// catch template redirect if on forms
function zeroBSCRM_forms_templateRedirect() {

	// hard typed form types
	$acceptableFormTypes = array('simple','naked','content');
	$potentialForm = get_query_var('crmforms');

	if (isset($potentialForm) && !empty($potentialForm) && in_array($potentialForm, $acceptableFormTypes)){

		// require template
		require_once( ZEROBSCRM_PATH . 'public/forms/form-'.$potentialForm.'.php' ); 
		exit();

	}

}

// shortcode - e.g. [jetpackcrm_form id="26633" style="naked"]
function zeroBSCRM_forms_shortcode($atts){

	// retrieve attr
	extract( shortcode_atts( array(
		'id' => 'true',
		'style' => 'simple'
	), $atts ) );

	// force enquement
	zeroBSCRM_forms_enqueuements();
	zeroBSCRM_exposePID();

	// return the form html
	return zeroBSCRM_forms_build_form_html($atts['id'],$atts['style'],__('CRM Forms: You have not entered a style in your form shortcode','zero-bs-crm'));

}
add_shortcode('jetpackcrm_form','zeroBSCRM_forms_shortcode');
add_shortcode('zbs_form','zeroBSCRM_forms_shortcode');

function zeroBSCRM_forms_enqueuements(){

    #} Assets we need specifically here
    
        // js
        wp_enqueue_script("jquery");
        wp_enqueue_script('zbsfrontendformsjs');
        
        // css
        wp_enqueue_style('zbsfrontendformscss');

}

// Register Forms widget
class ZBS_Form_Widget extends WP_Widget {
 
    /**
     * Register widget with WordPress.
     */
    public function __construct() {
        parent::__construct(
            'zbs_form_widget', // Base ID
            'Jetpack CRM Forms', // Name
            array( 'description' => __( 'Embed a lead capture form to your website', 'zero-bs-crm' ), ) // Args
        );
    }
 
    /**
     * Front-end display of widget.
     *
     * @see WP_Widget::widget()
     *
     * @param array $args     Widget arguments.
     * @param array $instance Saved values from database.
     */
    public function widget( $args, $instance ) {
		
		zeroBSCRM_forms_enqueuements();
		
        extract( $args );
        $title = apply_filters( 'widget_title', $instance['title'] );
 		$style = $instance['style'];
 		$id = $instance['id'];

        echo $before_widget;
        if ( ! empty( $title ) ) {
            echo $before_title . $title . $after_title;
        }
        if ( ! empty( $style) && ! empty($id)) {

        	echo zeroBSCRM_forms_build_form_html($id,$style,__('You have not entered a style or ID in the form shortcode','zero-bs-crm'));

        }
        echo $after_widget;
    }
 
    /**
     * Back-end widget form.
     *
     * @see WP_Widget::form()
     *
     * @param array $instance Previously saved values from database.
     */
    public function form( $instance ) {
        if ( isset( $instance[ 'title' ] ) ) {
            $title = $instance[ 'title' ];
        }
        else {
            $title = __( 'Contact us', 'zero-bs-crm' );
        }
        if ( isset( $instance[ 'style' ] ) ) {
            $style = $instance[ 'style' ];
        }
        else {
            $style = __( 'Simple', 'zero-bs-crm' );
        }
        if ( isset( $instance[ 'id' ] ) ) {
            $id = $instance[ 'id' ];
        }
        else {
            $id = 0;
        }
        ?>
        <p>
        <label for="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'zero-bs-crm' ); ?></label>
        <input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
        </p>

		<p>
	      <label for="<?php echo esc_attr( $this->get_field_id('text') ); ?>">Style: 
	        <select class='widefat' id="<?php echo esc_attr( $this->get_field_id('style') ); ?>"
	                name="<?php echo esc_attr( $this->get_field_name('style') ); ?>" type="text">
	          <option value='naked'<?php echo ($style=='naked')?'selected':''; ?>>
	            Naked
	          </option>
	          <option value='simple'<?php echo ($style=='simple')?'selected':''; ?>>
	            Simple
	          </option>
	          <option value='content'<?php echo ($style=='content')?'selected':''; ?>>
	            Content
	          </option>
	        </select>
	      </label>
	     </p>

        <p>
        <label for="<?php echo esc_attr( $this->get_field_name( 'id' ) ); ?>"><?php esc_html_e( 'Form ID:', 'zero-bs-crm' ); ?></label>
        <input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'id' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'id' ) ); ?>" type="text" value="<?php echo esc_attr( $id ); ?>" />
        </p>

        <?php
    }
 
    /**
     * Sanitize widget form values as they are saved.
     *
     * @see WP_Widget::update()
     *
     * @param array $new_instance Values just sent to be saved.
     * @param array $old_instance Previously saved values from database.
     *
     * @return array Updated safe values to be saved.
     */
    public function update( $new_instance, $old_instance ) {
        $instance = array();
        $instance['title'] = ( !empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['style'] = ( !empty( $new_instance['style'] ) ) ? strip_tags( $new_instance['style'] ) : '';
	 	$instance['id'] = ( !empty( $new_instance['id'] ) ) ? strip_tags( $new_instance['id'] ) : '';
        return $instance;
    }
}
add_action( 'widgets_init', function() { register_widget( 'ZBS_Form_Widget' ); } );

// header func - anything here will get added to front-end header for form
// (Recaptcha)
function zeroBSCRM_forms_formHTMLHeader(){

	$reCaptcha = zeroBSCRM_getSetting('usegcaptcha');
	$reCaptchaKey = zeroBSCRM_getSetting('gcaptchasitekey');
	$reCaptchaSecret = zeroBSCRM_getSetting('gcaptchasitesecret');

	if ($reCaptcha && !empty($reCaptchaKey) && !empty($reCaptchaSecret)){

		#} if reCaptcha include (not available in wp_enqueue_script as at 30/10/19 - https://developer.wordpress.org/reference/functions/wp_enqueue_script/)
		echo "<script src='https://www.google.com/recaptcha/api.js'></script>";

		#} And set this global var for easy check in js
		echo '<script type="text/javascript">var zbscrmReCaptcha = true;</script>';

	}

}
add_action('wp_head', 'zeroBSCRM_forms_formHTMLHeader');

// return html of form
function zeroBSCRM_forms_build_form_html($formID=-1, $formStyle='content', $fallbackMessage=''){

	// check form ID & style
	if ($formID > 0 && in_array($formStyle,array('naked','content','simple','cgrab'))){

		// 'cgrab' was original 'content'
		if ($formStyle === 'cgrab') $formStyle = 'content';

		// retrieve Form
		$form = zeroBS_getForm($formID);

		#} This checks it found something
		if (is_array($form)){

			return call_user_func( 'jpcrm_' . $formStyle . '_form_html', $formID, $form );

		}

	}

	return $fallbackMessage;
}

// return HTML for ReCaptcha (if using)
function zeroBSCRM_forms_getRecaptcha(){

	#} reCaptcha addition
	$reCaptcha = zeroBSCRM_getSetting('usegcaptcha');
	$reCaptchaKey = zeroBSCRM_getSetting('gcaptchasitekey');
	if ($reCaptcha && !empty($reCaptchaKey)) return '<div class="zbscrmReCaptcha"><div class="g-recaptcha" data-sitekey="'.$reCaptchaKey.'"></div></div>';

	return '';

}


// v3 form HTML builder (simple style)
function jpcrm_simple_form_html( $formid = -1, $formObject = array() ) {

	// build $content
	ob_start();

	?>
		<div class="zbscrmFrontEndForm" id="zbs_form_<?php echo esc_attr( $formid ); ?>">
			<div id="zbs_form_ajax_action" data-zbsformajax="<?php echo esc_url( admin_url('admin-ajax.php') ); ?>"></div>
			<div class="embed">
				<div class="simple" style="border:0px !important">
					<div class="content">
						<h1><?php echo !empty($formObject['label_header']) ? esc_html( $formObject['label_header'] ) : esc_html__("Want to find out more?",'zero-bs-crm'); ?></h1>
						<h3><?php echo !empty($formObject['label_subheader']) ? esc_html( $formObject['label_subheader'] ) : esc_html__("Drop us a line. We follow up on all contacts",'zero-bs-crm'); ?></h3>
						<div class="form-wrapper zbsFormWrap">
							<input class="input" type="text" id="zbs_email" name="zbs_email" placeholder="<?php echo !empty($formObject['label_email']) ? esc_attr( $formObject['label_email'] ) : esc_attr__("Email Address",'zero-bs-crm'); ?>" value=""/>
							<input class="input" type="hidden" id="zbs_hpot_email" name="zbs_hpot_email" value=""/>
							<input class="input" type="hidden" class="zbs_form_view_id" id="zbs_form_view_id" name="zbs_form_id" value="<?php echo esc_attr( $formid ); ?>" />
							<input class="input" type="hidden" id="zbs_form_style" name="zbs_form_style" value="zbs_simple" />
							<input type="hidden" name="action" value="zbs_lead_form">
							<?php echo zeroBSCRM_forms_getRecaptcha(); ?>
							<input class="send" type="submit" value="<?php echo !empty($formObject['label_button']) ? esc_attr( $formObject['label_button'] ) : esc_attr__("Submit",'zero-bs-crm'); ?>"/>
							<div class="clear"></div>
							<div class="trailer"><?php echo !empty($formObject['label_spammsg']) ? esc_html( $formObject['label_spammsg'] ) : esc_html__("We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)",'zero-bs-crm'); ?></div>
						</div>
						<div class="zbsForm_success"><?php echo !empty($formObject['label_successmsg']) ? esc_html( $formObject['label_successmsg'] ) : esc_html__("Thanks. We will be in touch.",'zero-bs-crm'); ?></div>
						<?php
							##WLREMOVE
							global $zbs;
							$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;
							if( $showpoweredby_public ) {
								?><div class="zbs_poweredby" style="font-size:11px;">Powered by <a href="<?php echo esc_url( $zbs->urls['home'] ); ?>" target="_blank">Jetpack CRM</a></div><?php
							}
							##/WLREMOVE
						?>
					</div>
				</div>
			</div>
		</div>
	<?php 

	$content = ob_get_contents();
	ob_end_clean();

	return $content;
}


// v3 form HTML builder (naked style)
function jpcrm_naked_form_html( $formid = -1, $formObject = array() ) {

	// build $content
	ob_start();

	?>
		<div class="zbscrmFrontEndForm" id="zbs_form_<?php echo esc_attr( $formid ); ?>">
			<div id="zbs_form_ajax_action" data-zbsformajax="<?php echo esc_url( admin_url('admin-ajax.php') ); ?>"></div>
			<div class="embed">
				<div class="naked" style="border:0px !important">
					<div class="content">
						<div class="form-wrapper zbsFormWrap">
							<input class="input" type="text" id="zbs_fname" name="zbs_fname" placeholder="<?php echo !empty($formObject['label_firstname']) ? esc_attr( $formObject['label_firstname'] ) : esc_attr__("First Name",'zero-bs-crm'); ?>" value=""/>
							<input class="input" type="text" id="zbs_email" name="zbs_email" placeholder="<?php echo !empty($formObject['label_email']) ? esc_attr( $formObject['label_email'] ) : esc_attr__("Email Address",'zero-bs-crm'); ?>" value=""/>
							<input class="input" type="hidden" id="zbs_hpot_email" name="zbs_hpot_email" value=""/>
							<input class="input" type="hidden" class="zbs_form_view_id" id="zbs_form_view_id" name="zbs_form_id" value="<?php echo esc_attr( $formid ); ?>" />
							<input class="input" type="hidden" id="zbs_form_style" name="zbs_form_style" value="zbs_naked" />
							<input type="hidden" name="action" value="zbs_lead_form">
							<?php echo zeroBSCRM_forms_getRecaptcha(); ?>
							<input class="send" type="submit" value="<?php echo !empty($formObject['label_button']) ? esc_attr( $formObject['label_button'] ) : esc_attr__("Submit",'zero-bs-crm'); ?>"/>
							<div class="clear"></div>
							<div class="trailer"><?php echo !empty($formObject['label_spammsg']) ? esc_html( $formObject['label_spammsg'] ) : esc_html__("We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)",'zero-bs-crm'); ?></div>
						</div>
						<div class="zbsForm_success"><?php echo !empty($formObject['label_successmsg']) ? esc_html( $formObject['label_successmsg'] ) : esc_html__("Thanks. We will be in touch.",'zero-bs-crm'); ?></div>
						<?php
							##WLREMOVE
							global $zbs;
							$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;
							if( $showpoweredby_public ) {
								?><div class="zbs_poweredby" style="font-size:11px;">Powered by <a href="<?php echo esc_url( $zbs->urls['home'] ); ?>" target="_blank">Jetpack CRM</a></div><?php
							}
							##/WLREMOVE
						?>
					</div>
				</div>
			</div>
		</div>
	<?php 

	$content = ob_get_contents();
	ob_end_clean();

	return $content;
}

// v3 form HTML builder (content grab style)
function jpcrm_content_form_html( $formid = -1, $formObject = array() ) {

	// build $content
	ob_start();

	?>
		<div class="zbscrmFrontEndForm" id="zbs_form_<?php echo esc_attr( $formid ); ?>">
			<div id="zbs_form_ajax_action" data-zbsformajax="<?php echo esc_url( admin_url('admin-ajax.php') ); ?>"></div>
			<div class="embed">
				<div class="cgrab" style="border:0px !important">
					<div class="content">
						<h1><?php echo !empty($formObject['label_header']) ? esc_html( $formObject['label_header'] ) : esc_html__("Want to find out more?",'zero-bs-crm'); ?></h1>
						<h3><?php echo !empty($formObject['label_subheader']) ? esc_html( $formObject['label_subheader'] ) : esc_html__("Drop us a line. We follow up on all contacts",'zero-bs-crm'); ?></h3>
						<div class="form-wrapper zbsFormWrap">
							<input class="input" type="text" id="zbs_fname" name="zbs_fname" placeholder="<?php echo !empty($formObject['label_firstname']) ? esc_attr( $formObject['label_firstname'] ) : esc_attr__("First Name",'zero-bs-crm'); ?>" value=""/>
							<input class="input" type="text" id="zbs_lname" name="zbs_lname" placeholder="<?php echo !empty($formObject['label_lastname']) ? esc_attr( $formObject['label_lastname'] ) : esc_attr__("Last Name",'zero-bs-crm'); ?>" value=""/>
							<input class="input" type="text" id="zbs_email" name="zbs_email" placeholder="<?php echo !empty($formObject['label_email']) ? esc_attr( $formObject['label_email'] ) : esc_attr__("Email Address",'zero-bs-crm'); ?>" value=""/>
							<textarea class="textarea" id="zbs_notes" name="zbs_notes" placeholder="<?php echo !empty($formObject['label_message']) ? esc_attr( $formObject['label_message'] ) : esc_attr__("Your Message",'zero-bs-crm'); ?>"></textarea>
							<input class="input" type="hidden" id="zbs_hpot_email" name="zbs_hpot_email" value=""/>
							<input class="input" type="hidden" class="zbs_form_view_id" id="zbs_form_view_id" name="zbs_form_id" value="<?php echo esc_attr( $formid ); ?>" />
							<input class="input" type="hidden" id="zbs_form_style" name="zbs_form_style" value="zbs_cgrab" />
							<input type="hidden" name="action" value="zbs_lead_form">
							<?php echo zeroBSCRM_forms_getRecaptcha(); ?>
							<input class="send" type="submit" value="<?php echo !empty($formObject['label_button']) ? esc_attr( $formObject['label_button'] ) : esc_attr__("Submit",'zero-bs-crm'); ?>"/>
							<div class="clear"></div>
							<div class="trailer"><?php echo !empty($formObject['label_spammsg']) ? esc_html( $formObject['label_spammsg'] ) : esc_html__("We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)",'zero-bs-crm'); ?></div>
						</div>
						<div class="zbsForm_success"><?php echo !empty($formObject['label_successmsg']) ? esc_html( $formObject['label_successmsg'] ) : esc_html__("Thanks. We will be in touch.",'zero-bs-crm'); ?></div>
						<?php
							##WLREMOVE
							global $zbs;
							$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;
							if( $showpoweredby_public ) {
								?><div class="zbs_poweredby" style="font-size:11px;">Powered by <a href="<?php echo esc_url( $zbs->urls['home'] ); ?>" target="_blank">Jetpack CRM</a></div><?php
							}
							##/WLREMOVE
						?>
					</div>
				</div>
			</div>
		</div>
	<?php 

	$content = ob_get_contents();
	ob_end_clean();

	return $content;
}

// legacy - used elsewhere (extensions?) otherwise safe to remove
function zeroBSCRM_exposePID() {}

/* ======================================================
   / Front end Form Funcs
   ====================================================== */
