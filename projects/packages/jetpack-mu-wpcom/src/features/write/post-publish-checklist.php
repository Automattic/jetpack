<?php
/**
 * Write — post-publish next-steps checklist.
 *
 * After a post is published in the Write editor, the editor redirects the author
 * to the published post with a `wpcom_write_published` marker (see view.js). On a
 * Coming Soon (private-by-default) site that post is not yet public, so we overlay
 * a short next-steps checklist — Launch your site, Share your post — onto the post.
 * This keeps "Publish" honest (it didn't make the post public) and guides the
 * author toward launching and sharing.
 *
 * The overlay only renders on the immediate post-publish navigation (the marker is
 * present), for a viewer who can actually launch the site, while the site is still
 * Coming Soon. Public sites, ordinary visitors, and later visits to the post are
 * unaffected.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Query-arg marker the Write editor appends to the published-post URL on publish.
 */
const WPCOM_WRITE_PUBLISHED_MARKER = 'wpcom_write_published';

/**
 * Whether the post-publish checklist overlay should render on the current request.
 *
 * All of the following must hold:
 *  - the request carries the Write editor's post-publish marker;
 *  - we're on a single post's front-end view;
 *  - the viewer can launch the site (`manage_options`) — which also means they
 *    bypass the Coming Soon splash and therefore see the post we overlay onto;
 *  - the site is still Coming Soon, so the post isn't publicly visible yet.
 *
 * @return bool True when the overlay should be shown.
 */
function wpcom_write_should_show_post_publish_checklist() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display-only marker; writes nothing, mirrors the coming-soon share-code read.
	if ( ! isset( $_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] ) ) {
		return false;
	}

	if ( ! is_singular( 'post' ) ) {
		return false;
	}

	// Only the author/manager who can launch the site — anyone who can't launch
	// also can't act on the checklist, and would see the Coming Soon splash here.
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	// Only while the site is private by default; a launched site needs no nudge.
	return 1 === (int) get_option( 'wpcom_public_coming_soon' );
}

/**
 * URL the "Launch your site" task links to.
 *
 * Points at Calypso's canonical launch-site flow, which takes the user through
 * domain/plan (skipped if already chosen) and flips a Coming Soon site public.
 * Unlike the launchpad, it does not depend on the site having
 * launchpad_screen='full', so it works for these sites as created today.
 *
 * @return string The launch URL for this site.
 */
function wpcom_write_post_publish_launch_url() {
	$host = wp_parse_url( home_url(), PHP_URL_HOST );

	return 'https://wordpress.com/start/launch-site?siteSlug=' . rawurlencode( (string) $host );
}

/**
 * Translated strings for the post-publish checklist overlay.
 *
 * @return array<string, string> Map of key -> translated string.
 */
function wpcom_write_get_post_publish_checklist_strings() {
	return array(
		'heading'         => __( 'Your post is saved!', 'jetpack-mu-wpcom' ),
		'description'     => __( 'Your site is still private, so only you can see this post. Launch your site to share it with the world.', 'jetpack-mu-wpcom' ),
		'launchTitle'     => __( 'Launch your site', 'jetpack-mu-wpcom' ),
		'launchDesc'      => __( 'Make your site public.', 'jetpack-mu-wpcom' ),
		'shareTitle'      => __( 'Share your post', 'jetpack-mu-wpcom' ),
		'shareDesc'       => __( 'Available after you launch.', 'jetpack-mu-wpcom' ),
		'launchCta'       => __( 'Launch your site', 'jetpack-mu-wpcom' ),
		'dismiss'         => __( 'Maybe later', 'jetpack-mu-wpcom' ),
		'close'           => __( 'Close', 'jetpack-mu-wpcom' ),
		// Inline email-verification step, swapped in when the author tries to
		// launch with an unverified email (see post-publish-checklist.js).
		'verifyTitle'     => __( 'Confirm your email to launch', 'jetpack-mu-wpcom' ),
		'verifyDesc'      => __( 'Your site can go public once your email is confirmed. Check your inbox for the confirmation link.', 'jetpack-mu-wpcom' ),
		'confirmCta'      => __( "I've confirmed — launch", 'jetpack-mu-wpcom' ),
		'resendCta'       => __( 'Resend verification email', 'jetpack-mu-wpcom' ),
		'resendSent'      => __( 'Verification email sent. Check your inbox.', 'jetpack-mu-wpcom' ),
		'resendError'     => __( 'Something went wrong. Please try again.', 'jetpack-mu-wpcom' ),
		'checking'        => __( 'Checking…', 'jetpack-mu-wpcom' ),
		'stillUnverified' => __( "We couldn't confirm your email yet. Click the link in the email, then try again.", 'jetpack-mu-wpcom' ),
	);
}

/**
 * Enqueue the overlay assets when the checklist should render.
 *
 * @return void
 */
function wpcom_write_enqueue_post_publish_checklist_assets() {
	if ( ! wpcom_write_should_show_post_publish_checklist() ) {
		return;
	}

	wp_enqueue_style(
		'wpcom-write-post-publish-checklist',
		wpcom_write_asset_url( 'post-publish-checklist.css' ),
		array(),
		WPCOM_WRITE_VERSION
	);

	wp_enqueue_script(
		'wpcom-write-post-publish-checklist',
		wpcom_write_asset_url( 'post-publish-checklist.js' ),
		array(),
		WPCOM_WRITE_VERSION,
		true
	);

	$strings = wpcom_write_get_post_publish_checklist_strings();

	wp_localize_script(
		'wpcom-write-post-publish-checklist',
		'wpcomWritePostPublishChecklist',
		array(
			'launchUrl' => wpcom_write_post_publish_launch_url(),
			'marker'    => WPCOM_WRITE_PUBLISHED_MARKER,
			// Computed server-side: a Simple site serves no REST at its own host, so
			// the overlay can't fetch this — it reads the value rendered into the page.
			// Sent as a '1'/'0' string because wp_localize_script() stringifies scalars
			// (bool true -> '1', false -> ''); the JS compares against '1'.
			'blocked'   => wpcom_write_launch_blocked_for_unverified_email() ? '1' : '0',
			// admin-ajax transport for the inline resend / re-check (a Simple site
			// serves no REST at its own host); nonce guards both actions.
			'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
			'nonce'     => wp_create_nonce( WPCOM_WRITE_EMAIL_VERIFICATION_NONCE ),
			'strings'   => array(
				'verifyTitle'     => $strings['verifyTitle'],
				'verifyDesc'      => $strings['verifyDesc'],
				'confirmCta'      => $strings['confirmCta'],
				'resendCta'       => $strings['resendCta'],
				'resendSent'      => $strings['resendSent'],
				'resendError'     => $strings['resendError'],
				'checking'        => $strings['checking'],
				'stillUnverified' => $strings['stillUnverified'],
			),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'wpcom_write_enqueue_post_publish_checklist_assets' );

/**
 * Render the post-publish checklist overlay markup in the footer.
 */
add_action( 'wp_footer', 'wpcom_write_render_post_publish_checklist' );

/**
 * Output the overlay markup.
 *
 * Plain markup wired up by post-publish-checklist.js — no Interactivity API, since
 * this renders on an arbitrary theme front-end, not the Write editor surface.
 *
 * @return void
 */
function wpcom_write_render_post_publish_checklist() {
	if ( ! wpcom_write_should_show_post_publish_checklist() ) {
		return;
	}

	$strings = wpcom_write_get_post_publish_checklist_strings();
	?>
	<div class="wpcom-write-ppc" role="dialog" aria-modal="true" aria-labelledby="wpcom-write-ppc-title" hidden>
		<div class="wpcom-write-ppc__backdrop" data-wpcom-write-ppc-dismiss></div>
		<div class="wpcom-write-ppc__card">
			<button type="button" class="wpcom-write-ppc__close" data-wpcom-write-ppc-dismiss aria-label="<?php echo esc_attr( $strings['close'] ); ?>">&times;</button>
			<div class="wpcom-write-ppc__badge" aria-hidden="true">&#10003;</div>
			<h2 id="wpcom-write-ppc-title" class="wpcom-write-ppc__title"><?php echo esc_html( $strings['heading'] ); ?></h2>
			<p class="wpcom-write-ppc__desc"><?php echo esc_html( $strings['description'] ); ?></p>
			<ul class="wpcom-write-ppc__list">
				<li class="wpcom-write-ppc__item">
					<span class="wpcom-write-ppc__bullet" aria-hidden="true"></span>
					<span class="wpcom-write-ppc__item-text">
						<span class="wpcom-write-ppc__item-title"><?php echo esc_html( $strings['launchTitle'] ); ?></span>
						<span class="wpcom-write-ppc__item-desc"><?php echo esc_html( $strings['launchDesc'] ); ?></span>
					</span>
				</li>
				<li class="wpcom-write-ppc__item is-disabled" aria-disabled="true">
					<span class="wpcom-write-ppc__bullet" aria-hidden="true"></span>
					<span class="wpcom-write-ppc__item-text">
						<span class="wpcom-write-ppc__item-title"><?php echo esc_html( $strings['shareTitle'] ); ?></span>
						<span class="wpcom-write-ppc__item-desc"><?php echo esc_html( $strings['shareDesc'] ); ?></span>
					</span>
				</li>
			</ul>
			<button type="button" class="wpcom-write-ppc__launch" data-wpcom-write-ppc-launch><?php echo esc_html( $strings['launchCta'] ); ?></button>
			<button type="button" class="wpcom-write-ppc__dismiss" data-wpcom-write-ppc-dismiss><?php echo esc_html( $strings['dismiss'] ); ?></button>
		</div>
	</div>
	<?php
}
