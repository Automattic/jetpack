<?php
$releases_and_branches = get_jp_versions_and_branches();

$releases_array = $releases_and_branches['versions'];
$branches_array = $releases_and_branches['branches'];

$releases = array_keys( $releases_array );

$recent_release = reset( $releases );

?>

<h2>Jetpack Alpha Settings</h2>

<h4>Most Recent Release:</h4>
<form method="post" id="jp_alpha_choose_recent">
	<input type="hidden" value="<?php echo $recent_release; ?>" name="jp_alpha_recent_release"/>
	<input class="button-primary" type="submit" value="Choose most recent release" name="submit">
	<?php wp_nonce_field( 'jp_alpha_recent_save' , 'jp_alpha_recent_save_nonce' ); ?>
</form>


<h4>Choose a specific release:</h4>
<select name="jp_alpha_release" form="jp_alpha_choose_release">
	<option value=""></option>
	<?php
	$option_release = get_option( 'jp_alpha_release_or_branch' );
	foreach ( $releases_array as $release => $info ) : ?>
		<option value="<?php echo $release ?>" <?php selected( $option_release, $release ) ?>>
			<?php echo $release;?>
		</option>
	<?php endforeach; ?>
</select>

<form method="post" id="jp_alpha_choose_release">
	<input class="button-primary" type="submit" value="Choose Release" name="submit" >
	<?php wp_nonce_field( 'jp_alpha_release_save' , 'jp_alpha_release_save_nonce' ); ?>
</form>


<h4>Choose a branch:</h4>
<select name="jp_alpha_branch" form="jp_alpha_choose_branch">
	<option value=""></option>
	<?php
	$option_branch = get_option( 'jp_alpha_release_or_branch' );
	foreach ( $branches_array as $branch => $info ) : ?>
		<option value="<?php echo $branch ?>" <?php selected( $option_branch, $branch ) ?>>
			<?php echo $branch;?>
		</option>
	<?php endforeach; ?>
</select>

<form method="post" id="jp_alpha_choose_branch">
	<input class="button-primary" type="submit" value="Choose Branch" name="submit">
	<?php wp_nonce_field( 'jp_alpha_branch_save' , 'jp_alpha_branch_save_nonce' ); ?>
</form>