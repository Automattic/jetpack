<?php

$jp_beta_type = get_option( 'jp_beta_type' );
$jp_beta_autoupdate = get_option( 'jp_beta_autoupdate' );

$testing_checklist = jpbeta_get_testing_list();

?>

<h2 title="<?php _e('Jetpack Beta Settings', 'jpbeta'); ?>"><?php _e('Jetpack Beta Settings', 'jpbeta'); ?></h2>
<h3 title="<?php _e('Use Jetpack Version', 'jpbeta'); ?>"><?php _e('Use Jetpack Version', 'jpbeta'); ?>:</h3>

<form method="post" id="jp_beta_choose_type">
	<ul>
		<li><input type="radio" name="version_type" value="latest" <?php echo ( $jp_beta_type == 'rc_only' ? '' : 'checked="checked"' ); ?>> <strong><?php _e('Latest Beta', 'jpbeta'); ?></strong> (<?php _e('this might be updated anywhere from once a week to multiple times a day', 'jpbeta'); ?>)</li>
		<li><input type="radio" name="version_type" value="rc_only" <?php echo ( $jp_beta_type == 'rc_only' ? 'checked="checked"' : '' ); ?>> <strong><?php _e('Release Candidates Only', 'jpbeta'); ?></strong> (<?php _e('these are our tagged pre-releases, and there are generally 2-3 per Jetpack version', 'jpbeta'); ?>)</li>
	</ul>
	<ul>
    	<li><input type="checkbox" name="auto_update" value="1" <?php echo ( $jp_beta_autoupdate == 'no' ? '' : 'checked="checked"' ); ?>> <strong><?php _e('Auto-Update Jetpack when new betas are available', 'jpbeta'); ?></strong> (<?php _e('this only runs every 12 hours, so you might want to manually update sooner', 'jpbeta'); ?>)</li>
    </ul>
	<input class="button-primary" type="submit" value="<?php _e('Save my choice', 'jpbeta'); ?>" name="submit">
	<?php wp_nonce_field( 'jp_beta_recent_save' , 'jp_beta_recent_save_nonce' ); ?>
</form>

<div class="card">
<?php echo $testing_checklist; ?>

<h3 title="Submit Your Feedback"><a href="http://jetpack.me/contact-support/"><?php _e('Submit Your Feedback', 'jpbeta'); ?></a></h3>
</div>