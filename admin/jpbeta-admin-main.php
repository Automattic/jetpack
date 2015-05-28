<?php
$releases_and_branches = get_jp_versions_and_branches();

$releases_array = $releases_and_branches['version'];
$branches_array = $releases_and_branches['branch'];

$releases = array_keys( $releases_array );

$recent_release = reset( $releases );

$option_release = get_option( 'jp_beta_which' );
$version_or_branch = get_option('jp_beta_version_or_branch');

?>

<h2>Jetpack Beta Settings</h2>
<strong>Current selection: <?php echo $version_or_branch; if($option_release) { echo '('.$option_release.')'; } ?></strong>

<h4>Most Recent Release:</h4>
<form method="post" id="jp_beta_choose_recent">
	<input type="hidden" value="most_recent" name="jp_beta_recent_release"/>
	<input class="button-primary" type="submit" value="Choose most recent release" name="submit">
	<?php wp_nonce_field( 'jp_beta_recent_save' , 'jp_beta_recent_save_nonce' ); ?>
</form>


<h4>Choose a specific release:</h4>
<select name="jp_beta_release" form="jp_beta_choose_release">
	<option value=""></option>
	<?php
	foreach ( $releases_array as $release => $info ) : ?>
		<option value="<?php echo $release ?>" <?php selected( $option_release, $release ) ?>>
			<?php echo $release;?>
		</option>
	<?php endforeach; ?>
</select>

<form method="post" id="jp_beta_choose_release">
	<input class="button-primary" type="submit" value="Choose Release" name="submit" >
	<?php wp_nonce_field( 'jp_beta_release_save' , 'jp_beta_release_save_nonce' ); ?>
</form>


<h4>Choose a branch:</h4>
<select name="jp_beta_branch" form="jp_beta_choose_branch">
	<option value=""></option>
	<?php
	foreach ( $branches_array as $branch => $info ) : ?>
		<option value="<?php echo $branch ?>" <?php selected( $option_branch, $branch ) ?>>
			<?php echo $branch;?>
		</option>
	<?php endforeach; ?>
</select>

<form method="post" id="jp_beta_choose_branch">
	<input class="button-primary" type="submit" value="Choose Branch" name="submit">
	<?php wp_nonce_field( 'jp_beta_branch_save' , 'jp_beta_branch_save_nonce' ); ?>
</form>