<?php
/*
!
 * Admin Page Partial: Settings: Title Block
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

?>
<?php
// optional right-floated notice
if ( is_array( $settings_rightfloated_notice ) ) {
	?>
	<div class="ui <?php echo esc_attr( $settings_rightfloated_notice['colour'] ); ?> right floated label"><i class="<?php echo esc_attr( $settings_rightfloated_notice['icon'] ); ?> icon link"></i> <?php echo $settings_rightfloated_notice['body']; ?></div>
	<?php
}
?>
<h1 class="ui header blue" style="margin-top: 0;"><?php echo esc_html( $title ); ?></h1>
