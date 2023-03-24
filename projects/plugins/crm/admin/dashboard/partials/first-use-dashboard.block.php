<?php
/*
!
 * Admin Page Partial: Dashboard: First use dashboard
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

##WLREMOVE

global $zbs;

// Define videos to show
$learn_from_mike_videos = array(

	'youtube-preview-1'     => array(

		'url'   => $zbs->urls['youtube_intro_to_crm'],
		'img'   => 'youtube-preview-1-intro-to-crm.png',
		'title' => __( 'Introduction to CRM contact management', 'zero-bs-crm' ),

	),

	/*
	... can include this, however I found that youtube-preview-4 might be more relevant to users for now
	... and there is only space for 3
			'youtube-preview-2' => array(
				'url' => $zbs->urls['youtube_intro_to_forms'],
			'img' => 'youtube-preview-2-all-about-forms.png',
			'title' => __( "All about using forms  in Jetpack CRM", 'zero-bs-crm' )
			),
		 */

		'youtube-preview-3' => array(

			'url'   => $zbs->urls['youtube_intro_to_tags'],
			'img'   => 'youtube-preview-3-intro-to-tags.png',
			'title' => __( 'Introduction to  tags and segments', 'zero-bs-crm' ),

		),

	'youtube-preview-4'     => array(

		'url'   => $zbs->urls['youtube_intro_to_modules'],
		'img'   => 'youtube-preview-4-core-modules.png',
		'title' => __( 'Introduction to CRM Core Modules', 'zero-bs-crm' ),

	),

);

?>

<div class="ui large modal" id="jpcrm-first-use-dash">
	<div class="jpcrm-modal-close"></div>
	<div class="content">
	<div class="jpcrm-modal-body ui grid">
		<div class="jpcrm-modal-cta-group eight wide column middle aligned" id="jpcrm-modal-cta-group">
		<div class="jpcrm-modal-mobile-only">
			<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/first-use-dash-stylized-ui-activity-log.png" alt="<?php esc_attr_e( 'Add a contact', 'zero-bs-crm' ); ?>" />
		</div>
		<div class="jpcrm-modal-title"><?php esc_html_e( 'Add Your Contacts', 'zero-bs-crm' ); ?></div>
		<div class="jpcrm-modal-paragraph"><?php esc_html_e( 'Your CRM starts with your contacts. Start collecting your contact information all in one place and use it to nurture your relationships.', 'zero-bs-crm' ); ?></div>
		<div class="jpcrm-modal-actions">
			<a href="<?php echo jpcrm_esc_link( 'create', -1, ZBS_TYPE_CONTACT ); ?>" class="ui black button jpcrm-modal-action-add"><?php esc_html_e( 'Add a contact', 'zero-bs-crm' ); ?></a>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['csvlite'] ) ); ?>" class="ui white button jpcrm-modal-action-import"><?php esc_html_e( 'Import contacts (CSV)', 'zero-bs-crm' ); ?></a>
		</div>
		</div>
		<div class="jpcrm-modal-mobile-only jpcrm-modal-mobile-watch-videos-link">
		<a href="<?php echo esc_url( $zbs->urls['youtube_intro_playlist'] ); ?>" target="_blank"><?php esc_html_e( 'Watch tutorials on YouTube', 'zero-bs-crm' ); ?></a>
		</div>
		<div class="jpcrm-modal-illustration eight wide column">
		<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/first-use-dash-stylized-ui-activity-log.png" alt="<?php esc_attr_e( 'Add a contact', 'zero-bs-crm' ); ?>" />
		</div>
	</div>
	</div>

	<div class="jpcrm-modal-footer">

		<div class="ui grid">

			<div class="seven wide column">

			<div class="jpcrm-modal-learn-footer">
				<div class="jpcrm-modal-learn-footer-title">
				<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/learn-more-from-mike.jpeg" alt="<?php esc_attr_e( 'Learn from Mike', 'zero-bs-crm' ); ?>" />
				&nbsp;&nbsp;<?php esc_html_e( 'Learn more from Mike', 'zero-bs-crm' ); ?>
				</div>
				<div class="jpcrm-modal-learn-footer-paragraph"><?php esc_html_e( 'Mike is one of the team behind Jetpack CRM. Through these videos he will help you use Jetpack CRM to its full potential.', 'zero-bs-crm' ); ?></div>
				<div class="jpcrm-modal-learn-footer-actions">
				<a href="<?php echo esc_url( $zbs->urls['youtube_intro_playlist'] ); ?>" target="_blank"><img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/first-use-dash-learn-video-ico.png" alt="<?php esc_attr_e( 'Learn from Mike', 'zero-bs-crm' ); ?>" /> <?php esc_html_e( 'Get Started Playlist', 'zero-bs-crm' ); ?></a>
				</div>
			</div>

			</div>
			<div class="nine wide column">

			<div class="ui grid jpcrm-modal-learn-footer-videos">
				<?php

				foreach ( $learn_from_mike_videos as $video_key => $video_info ) {

					?>
					<div class="five wide column jpcrm-modal-learn-footer-video">
					<a href="<?php echo esc_url( $video_info['url'] ); ?>" target="_blank"><img src="<?php echo esc_url( ZEROBSCRM_URL . 'i/' . $video_info['img'] ); ?>" alt="<?php echo esc_attr( $video_info['title'] ); ?>" /></a>
					<br>
					<a href="<?php echo esc_url( $video_info['url'] ); ?>" target="_blank"><?php echo esc_html( $video_info['title'] ); ?></a>
					</div>
					<?php

				}

				?>

			</div>

			</div>


		</div>

	</div>
</div>
<script>var jpcrm_show_first_use_dash = true;</script>
<?php

##/WLREMOVE
