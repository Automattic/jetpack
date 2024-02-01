<div class="wpsc-card">
<?php
echo '<a name="trackingparameters"></a><fieldset class="options"><h4>' . __( 'Tracking Parameters', 'wp-super-cache' ) . '</h4>';
echo '<form name="edit_tracking_parameters" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#trackingparameters' ) . '" method="post">';
echo "<p>" . __( 'Tracking parameters to ignore when caching. Visitors from Facebook, Twitter and elsewhere to your website will go to a URL with tracking parameters added. This setting allows the plugin to ignore those parameters and show an already cached page. Any actual tracking by Google Analytics or other Javascript based code should still work as the URL of the page is not modified.', 'wp-super-cache' ) . "</p>\n";
echo '<textarea name="tracking_parameters" cols="20" rows="10" style="width: 50%; font-size: 12px;" class="code">';
foreach ( $wpsc_tracking_parameters as $parameter) {
	echo esc_html( $parameter ) . "\n";
}
echo '</textarea> ';
echo "<p><label><input type='checkbox' name='wpsc_ignore_tracking_parameters' value='1' " . checked( 1, $wpsc_ignore_tracking_parameters, false ) . " /> " . __( 'Enable', 'wp-super-cache' ) . "</label></p>";
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
?>
</div>
