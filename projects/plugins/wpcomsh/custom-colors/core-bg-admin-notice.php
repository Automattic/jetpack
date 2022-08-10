<?php
// This is loaded inside the static context of class Colors_Manager

// Don't bother if the theme doesn't have annotations.
if ( ! self::has_annotations() ) {
	return;
}

$url = admin_url( 'customize.php' );
// move into preview mode for un-upgraded users
if ( ! CustomDesign::is_upgrade_active() ) {
	$url = add_query_arg(
		array(
			'action'   => 'custom-design-preview',
			'state'    => 'on',
			'source'   => 'custom-background',
			'_wpnonce' => wp_create_nonce( 'custom-design-preview' ),
		),
		$url
	);
}
// add hash to open colors section
$url .= '#colors';

$img = sprintf(
	'<a href="%s"><img src="%s" alt="%s" /></a>',
	$url,
	plugins_url( '/images/colors-screenshot.png', __FILE__ ),
	esc_attr__( 'Custom Colors interface' )
);


if ( CustomDesign::is_upgrade_active() ) {
	$message = __( 'You can do far more than just customize your background color and image as part of your Custom Design upgrade. Choose from great palettes and background patterns. <a href="%s">Check it out!</a>' );
} else {
	$message = __( 'Did you know that you can do far more than just set your background color and image in the Colors tool in our Custom Design, part of the Premium Plan? <a href="%s">Preview it now!</a>' );
}

$message = sprintf( $message, $url );

?>
<div class="color-admin-notice hidden">
	<p><?php echo $img . ' ' . $message; ?></p>
</div>
<script>
jQuery(document).ready(function($){
	$( '.color-admin-notice' ).insertAfter( '.wrap > h2' ).removeClass( 'hidden' );
});
</script>
