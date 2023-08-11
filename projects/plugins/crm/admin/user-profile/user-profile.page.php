<?php
/*
!
 * User Profile page (admin.php?page=your-crm-profile)
 */
defined( 'ZEROBSCRM_PATH' ) || exit;

global $zbs;

// render page
jpcrm_render_userprofile_page();

/**
 * Render the page
 */
function jpcrm_render_userprofile_page() {

	$user_wp_id = get_current_user_id();
	$user_name  = jpcrm_wp_user_name( $user_wp_id );
	$user_data  = get_userdata( $user_wp_id );

	$ava_args = array(
		'class' => '',
	);

	// card view: https://semantic-ui.com/views/card.html ?>
<div style="margin:1em">
	<div class="ui card jpcrm-user-profile centered">
		<div class="image">
		<?php echo jpcrm_get_avatar( $user_wp_id, 240, '', '...', $ava_args ); ?>
		</div>
		<div class="content">
		<a class="header"><?php echo esc_html( $user_name ); ?></a>
		<div class="meta">
			<span class="date"><?php echo esc_html( sprintf( __( 'User since %s', 'zero-bs-crm' ), date( 'F j, Y, g:i a', strtotime( $user_data->user_registered ) ) ) ); ?></span>
		</div>
		<div class="description">
			<?php

			// extra info

			// role(s)
			if ( is_array( $user_data->roles ) && count( $user_data->roles ) > 0 ) {

				foreach ( $user_data->roles as $role ) {

					?>
					<span class="ui tag label"><?php echo esc_html( $role ); ?></span>
					<?php
				}
			} else {

				esc_html_e( 'No roles detected', 'zero-bs-crm' );
			}

			?>
		</div>
		</div>
		<?php
		/*
		Later could use this to express no of contacts assigned
		*/
		?>
		<div class="extra content" style="text-align: center">
			<a href="<?php echo esc_url( get_edit_profile_url( $user_wp_id ) ); ?>" class="ui small black icon button centered"><i class="user icon"></i>&nbsp;&nbsp;<?php esc_html_e( 'Edit Your Profile', 'zero-bs-crm' ); ?></a>        
		</div> 

		<?php

			// profile hooks
			do_action( 'zbs_your_profile_cal_pro_promo' );
			do_action( 'zbs_your_profile' );

		?>
	</div>
</div>
	<?php
}

/*
* As of 7/12/21 unused:
add_action('zbs_your_profile_cal_pro_promo', 'zeroBSCRM_pages_your_profile_promo');
function zeroBSCRM_pages_your_profile_promo(){}
*/
