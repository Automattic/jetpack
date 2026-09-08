<?php
/**
 * Wp-admin banner notice for plans approaching expiry, in grace, or post-grace.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner;

/**
 * Resolve the data needed to render the banner, or null if it shouldn't show.
 * Shared by the enqueue and render hooks, and by the block-editor notice.
 *
 * Memoized: each read costs a user-meta lookup, a site-slug resolution, and
 * post-grace a sticker lookup, and three hooks ask per pageview.
 *
 * `urls` is null when the viewer cannot renew.
 *
 * @param bool $flush Drop the memo. For tests, which move the fixture or the
 *                    screen under a process that has already answered once.
 * @return array{state:array,is_early_warning:bool,is_dismissible:bool,is_owner:bool,urls:array|null}|null
 */
function wpcom_expiry_notices_admin_banner_data( bool $flush = false ): ?array {
	// Distinct from null, which is a real answer worth remembering.
	static $memo = false;

	if ( $flush ) {
		$memo = false;
		return null;
	}

	if ( false !== $memo ) {
		return $memo;
	}

	$memo  = null;
	$state = wpcom_expiry_notices_eligible_state();
	if ( null === $state ) {
		return $memo;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return $memo;
	}

	// Scope progression: the gentle pre-window reminder shows on the Dashboard
	// only; every other visible state — final 7 days, grace, post-grace — shows
	// on all wp-admin screens.
	$is_early_warning = wpcom_expiry_notices_is_early_warning( $state );
	if ( $is_early_warning ) {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'dashboard' !== $screen->id ) {
			return $memo;
		}
	}

	$is_owner = Expiry_Owner::current_user_is_owner( $state );

	$memo = array(
		'state'            => $state,
		'is_early_warning' => $is_early_warning,
		'is_dismissible'   => Expiry_Notice_Dismiss::is_dismissible( $state ),
		'is_owner'         => $is_owner,
		'urls'             => $is_owner ? wpcom_expiry_notices_banner_urls( $state, wpcom_expiry_notices_current_admin_url() ) : null,
	);

	return $memo;
}

/**
 * Enqueue + localize the banner's JS/CSS on admin_enqueue_scripts so the
 * stylesheet lands in <head>.
 *
 * Not on block-editor screens: core hides the banner there, the editor notice
 * carries its message, and the script would still count an impression.
 */
function wpcom_expiry_notices_enqueue_admin_banner_assets() {
	if ( wpcom_expiry_notices_is_block_editor_screen() ) {
		return;
	}

	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'expiry-notices-admin-banner', array( 'js', 'css' ) );
	// Without this the banner's events are recorded on Simple and dropped on
	// Atomic, where nothing else in wp-admin loads the Tracks transport and
	// `window._tkq` stays an ordinary array.
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts( $asset_handle );
	wp_localize_script(
		$asset_handle,
		'wpcomExpiryBanner',
		array(
			'metaKey'    => Expiry_Notice_Dismiss::META_BANNER,
			'trackProps' => wpcom_expiry_notices_track_props( $data['state'], $data['is_owner'] ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_expiry_notices_enqueue_admin_banner_assets' );

/**
 * Render the banner markup on admin_notices.
 */
function wpcom_expiry_notices_render_admin_banner() {
	if ( wpcom_expiry_notices_is_block_editor_screen() ) {
		return;
	}

	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}

	wpcom_expiry_notices_render_admin_banner_html(
		$data['state'],
		$data['urls'],
		$data['is_early_warning'],
		$data['is_dismissible']
	);
}
add_action( 'admin_notices', 'wpcom_expiry_notices_render_admin_banner' );

/**
 * Render the banner DOM.
 *
 * @param array<string,mixed>      $state            Expiry state.
 * @param array<string,array>|null $urls             CTA URLs from Expiry_Data::get_cta_urls(), or null when
 *                                                   the viewer cannot renew.
 * @param bool                     $is_early_warning Whether this is the pre-final-week reminder.
 * @param bool                     $is_dismissible   Whether the notice can be dismissed.
 */
function wpcom_expiry_notices_render_admin_banner_html( array $state, ?array $urls, bool $is_early_warning, bool $is_dismissible ): void {
	$notice_class = $is_early_warning ? 'notice-warning' : 'notice-error';
	$is_grace     = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	?>
	<div id="wpcom-expiry-banner" class="notice <?php echo esc_attr( $notice_class ); ?>">
		<p><strong><?php echo esc_html( wpcom_expiry_notices_admin_banner_heading( $state ) ); ?></strong></p>
		<p><?php echo esc_html( wpcom_expiry_notices_banner_body( $state, null !== $urls ) ); ?></p>
		<?php if ( null !== $urls || $is_dismissible ) : ?>
			<p class="wpcom-expiry-banner__actions">
				<?php if ( null !== $urls ) : ?>
					<?php // The message turns this into a Help Center opener; the href stays as what a click falls back to. ?>
					<a
						class="button button-primary"
						href="<?php echo esc_url( $urls['primary']['url'] ); ?>"
						<?php if ( isset( $urls['primary']['message'] ) ) : ?>
							data-support-message="<?php echo esc_attr( $urls['primary']['message'] ); ?>"
						<?php endif; ?>
					>
						<?php echo esc_html( $urls['primary']['label'] ); ?>
					</a>
					<?php if ( $is_grace ) : ?>
						<a class="button" href="<?php echo esc_url( $urls['secondary']['url'] ); ?>">
							<?php echo esc_html( $urls['secondary']['label'] ); ?>
						</a>
					<?php endif; ?>
				<?php endif; ?>
				<?php if ( $is_dismissible ) : ?>
					<button type="button" class="button wpcom-expiry-banner__dismiss">
						<?php esc_html_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>
					</button>
				<?php endif; ?>
			</p>
		<?php endif; ?>
	</div>
	<?php
}
