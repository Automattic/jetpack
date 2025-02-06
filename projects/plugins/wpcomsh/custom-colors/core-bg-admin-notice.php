<?php // phpcs:ignore Squiz.Commenting.FileComment.MissingPackageTag
/**
 * This is loaded inside the static context of class Colors_Manager
 */

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
	esc_url( $url ),
	esc_url( plugins_url( '/images/colors-screenshot.png', __FILE__ ) ),
	esc_attr__( 'Custom Colors interface', 'wpcomsh' )
);

if ( CustomDesign::is_upgrade_active() ) {
	$message  = esc_html__( 'You can do far more than just customize your background color and image as part of your Custom Design upgrade. Choose from great palettes and background patterns.', 'wpcomsh' );
	$message .= ' <a href="' . esc_url( $url ) . '">' . esc_html__( 'Check it out!', 'wpcomsh' ) . '</a>';
} else {
	$message  = __( 'Did you know that you can do far more than just set your background color and image in the Colors tool in our Custom Design, part of the Premium Plan?', 'wpcomsh' );
	$message .= ' <a href="' . esc_url( $url ) . '">' . esc_html__( 'Preview it now!', 'wpcomsh' ) . '</a>';
}

?>
<div class="color-admin-notice hidden">
	<p><?php echo $img . ' ' . $message; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Both vars have HTML that is escaped above. */ ?></p>
</div>
<script>
jQuery(document).ready(function($){
	$( '.color-admin-notice' ).insertAfter( '.wrap > h2' ).removeClass( 'hidden' );
});
</script>
