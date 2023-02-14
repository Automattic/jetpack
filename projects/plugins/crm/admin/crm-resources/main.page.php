<?php
/*
!
 * Main Hub Page file: This is the main file which renders the Resources view
 * Jetpack CRM - https://jetpackcrm.com
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	======================================================= */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
	/*
	======================================================
	/ Breaking Checks
	========================================================= */

// permissions check
if ( ! zeroBSCRM_permsCustomers() ) {
	wp_die( esc_html( __( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ) );
}

// render the page
jpcrm_render_hub_page();

/**
 * Render the main hub page
 * (Never shown to WL users)
 */
function jpcrm_render_hub_page() {

	global $zbs;

	// discern views
	$show_review_link  = false;
	$show_bundle_block = true;

	$share_message = __( 'I\'m trying out Jetpack CRM, a CRM that runs on WordPress!', 'zero-bs-crm' );

	// show review link for established users (otherwise don't bother new users)
	$contact_count = $zbs->DAL->contacts->getContactCount( array( 'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT ) ) );
	if ( $contact_count > 10 ) {

		$show_review_link = true;

	}

	// show bundles block for non-license holders
	if ( $zbs->has_license_key() ) {

		$show_bundle_block = false;

	}

	?>
	<div id="jpcrm-resources-page">


		<?php
		if ( $show_bundle_block ) {
			?>

			<div id="jpcrm-resources-page-bundle-block">
				<a href="<?php echo esc_url( $zbs->urls['pricing'] ); ?>" target="_blank">
					<img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>/i/jetpack-crm-bundles.png" alt="CRM Bundles" />
				</a>
			</div>

			<?php
		}
		?>

		<div class="ui three cards" id="jpcrm-resources-page-cards">

			<a class="ui card" href="<?php echo esc_url( $zbs->urls['kb'] ); ?>" target="_blank">
				<div class="content">
					<div class="header"><?php esc_html_e( 'Knowledgebase', 'zero-bs-crm' ); ?></div>
					<div class="meta">
						<span class="category"><?php esc_html_e( 'Read our Knowledgebase guides', 'zero-bs-crm' ); ?></span>
					</div>
					<div class="description">
						<p><?php esc_html_e( 'If you want to learn how to do something in Jetpack CRM, or you\'re looking for a guide on a CRM area, click here to visit the CRM knowledgebase.', 'zero-bs-crm' ); ?></p>
					</div>
				</div>
				<div class="extra content">
					<div class="right floated author">
						<i class="book icon"></i> <?php esc_html_e( 'Visit Knowledgebase', 'zero-bs-crm' ); ?>
					</div>
				</div>
			</a>

			<a class="ui card" href="<?php echo esc_url( $zbs->urls['support'] ); ?>" target="_blank">
				<div class="content">
					<div class="header"><?php esc_html_e( 'Support', 'zero-bs-crm' ); ?></div>
					<div class="meta">
						<span class="category"><?php esc_html_e( 'Want to ask something?', 'zero-bs-crm' ); ?></span>
					</div>
					<div class="description">
						<p><?php esc_html_e( 'To get help with something in Jetpack CRM you can reach out directly via our support forums. It\'s a great way to connect for more information.', 'zero-bs-crm' ); ?></p>
					</div>
				</div>
				<div class="extra content">
					<div class="right floated author">
						<i class="life ring icon"></i> <?php esc_html_e( 'Get Support', 'zero-bs-crm' ); ?>
					</div>
				</div>
			</a>


			<div class="ui card">
				<div class="content">
					<div class="header"><?php esc_html_e( 'Share Jetpack CRM', 'zero-bs-crm' ); ?></div>
					<div class="meta">
						<span class="category"><?php esc_html_e( 'Tell others about Jetpack CRM', 'zero-bs-crm' ); ?></span>
					</div>
					<div class="description">
						<p><?php esc_html_e( 'At its core, Jetpack CRM is designed for entrepreneurs and small teams. Help us grow our community of users by sharing Jetpack CRM with your peers.', 'zero-bs-crm' ); ?></p>
					</div>
				</div>
				<div class="extra content">
					<div id="jpcrm-resources-page-share-icons">

						<span><?php esc_html_e( 'Share now:', 'zero-bs-crm' ); ?></span>&nbsp;
						<a href="https://www.facebook.com/sharer/sharer.php?u=https%3A//jetpackcrm.com/" target="_blank"><i class="facebook icon"></i></a>
						<a href="https://twitter.com/intent/tweet?text=<?php echo urlencode( $share_message ); ?>%0A%0Ahttps%3A//jetpackcrm.com" target="_blank"><i class="twitter icon"></i></a>
						<a href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//jetpackcrm.com/&title=Jetpack%20CRM%20for%20Entrepreneurs&summary=<?php echo urlencode( $share_message ); ?>&source=" target="_blank"><i class="linkedin icon"></i></a>

					</div>
				</div>
			</div>

		</div>

		<?php
		if ( $show_review_link ) {
			?>
			<div class="ui horizontal divider">
				<?php echo wp_kses( sprintf( __( '<a href="%s" target="_blank">Review Jetpack CRM on WordPress.org</a>', 'zero-bs-crm' ), $zbs->urls['rateuswporg'] ), $zbs->acceptable_restricted_html ); ?>
			</div>
			<?php
		}
		?>

	</div>

	<?php
}
