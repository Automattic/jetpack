<?php
/*
 *   Display the configuration options for AtD
 */

/*
 *   A convienence function to display the HTML for an AtD option
 */
function AtD_print_option( $name, $value, $options ) {
	// Attribute-safe version of $name
	$attr_name = sanitize_title($name); // Using sanitize_title since there's no comparable function for attributes
?>
   <input type="checkbox" id="atd_<?php echo esc_attr( $attr_name ) ?>" name="<?php echo esc_attr( $options['name'] ); ?>[<?php echo esc_attr( $name ); ?>]" value="1" <?php checked( '1', isset( $options[$name] ) ? $options[$name] : false ); ?>> <label for="atd_<?php echo esc_attr( $attr_name ); ?>"><?php echo esc_html( $value ); ?></label>
<?php
}

/*
 *  Save AtD options
 */
function AtD_process_options_update() {

	$user = wp_get_current_user();

	if ( ! $user || $user->ID == 0 )
		return;

	AtD_update_options( $user->ID, 'AtD_options' );
	AtD_update_options( $user->ID, 'AtD_check_when' );
	AtD_update_options( $user->ID, 'AtD_guess_lang' );
}

/*
 *  Display the various AtD options
 */
function AtD_display_options_form() {

	/* grab our user and validate their existence */
	$user = wp_get_current_user();
	if ( ! $user || $user->ID == 0 )
		return;

	$options_show_types = AtD_get_options( $user->ID, 'AtD_options' );
	$options_check_when = AtD_get_options( $user->ID, 'AtD_check_when' );
	$options_guess_lang = AtD_get_options( $user->ID, 'AtD_guess_lang' );
?>
   <table class="form-table">
      <tr valign="top">
         <th scope="row"> <a id="atd"></a> <?php _e( 'Proofreading', 'jetpack' ); ?></th>
		 <td>
   <p><?php _e( 'Automatically proofread content when:', 'jetpack' ); ?>

   <p><?php
		AtD_print_option( 'onpublish', __('a post or page is first published', 'jetpack'), $options_check_when );
		echo '<br />';
		AtD_print_option( 'onupdate', __('a post or page is updated', 'jetpack'), $options_check_when );
   ?></p>

   <p style="font-weight: bold"><?php _e('English Options', 'jetpack'); ?></p>

   <p><?php _e('Enable proofreading for the following grammar and style rules when writing posts and pages:', 'jetpack'); ?></p>

   <p><?php
		AtD_print_option( 'Bias Language', __('Bias Language', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Cliches', __('Clich&eacute;s', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Complex Expression', __('Complex Phrases', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Diacritical Marks', __('Diacritical Marks', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Double Negative', __('Double Negatives', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Hidden Verbs', __('Hidden Verbs', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Jargon Language', __('Jargon', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Passive voice', __('Passive Voice', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Phrases to Avoid', __('Phrases to Avoid', 'jetpack'), $options_show_types );
		echo '<br />';
		AtD_print_option( 'Redundant Expression', __('Redundant Phrases', 'jetpack'), $options_show_types );
   ?></p>
   <p><?php printf( __( '<a href="%s" target="_blank">Learn more</a> about these options.', 'jetpack' ), 'http://support.wordpress.com/proofreading/' );
?></p>

   <p style="font-weight: bold"><?php _e( 'Language', 'jetpack' ); ?></p>

   <p><?php
	_e( 'The proofreader supports English, French, German, Portuguese, and Spanish. Your user interface language (see above) is the default proofreading language.', 'jetpack' );
	 ?></p>

   <p><?php
	AtD_print_option( 'true', __('Use automatically detected language to proofread posts and pages', 'jetpack' ), $options_guess_lang );
   ?></p>

<?php
}

/*
 *  Returns an array of AtD user options specified by $name
 */
function AtD_get_options( $user_id, $name ) {
	$options_raw = AtD_get_setting( $user_id, $name, 'single' );

	$options = array();
	$options['name'] = $name;

	if ( $options_raw )
		foreach ( explode( ',', $options_raw ) as $option )
			$options[ $option ] = 1;

	return $options;
}

/*
 *  Saves set of user options specified by $name from POST data
 */
function AtD_update_options( $user_id, $name ) {
	/* We should probably run $_POST[name] through an esc_*() function... */
	if ( isset( $_POST[$name] ) && is_array( $_POST[$name] ) ) {
		$copy = array_map( 'strip_tags', array_keys( $_POST[$name] ) );
		AtD_update_setting( $user_id, AtD_sanitize( $name ), implode( ',', $copy )  );
	} else {
		AtD_update_setting( $user_id, AtD_sanitize( $name ), '');
	}

	return;
}
