<?php
/**
 * Front-end preview of a proposal.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use WP_Query;

/**
 * Shows a logged-in reviewer the site with a proposal's changes overlaid. Approval happens in the agent chat.
 */
class Proposals_Preview {

	/**
	 * The proposal being previewed.
	 *
	 * @var array|null
	 */
	private static $proposal = null;

	/**
	 * Whether the live site changed after the proposal was made.
	 *
	 * @var bool
	 */
	private static $outdated = false;

	/**
	 * Handlers overlaying this preview, by type.
	 *
	 * @var array<string, Proposal_Handler>
	 */
	private static $handlers = array();

	/**
	 * Route a front-end request carrying the proposal query var. Runs on parse_request.
	 */
	public static function boot(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing; nothing changes here.
		$uuid = sanitize_text_field( wp_unslash( $_GET[ Proposals::QUERY_VAR ] ?? '' ) );

		// Never let a page cache store or serve a preview.
		if ( function_exists( 'batcache_cancel' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Optional Batcache API, guarded above.
			batcache_cancel();
		}
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		nocache_headers();

		if ( ! wp_is_uuid( $uuid, 4 ) ) {
			return;
		}

		if ( ! is_user_logged_in() ) {
			auth_redirect();
			return;
		}

		$proposal = Proposals::get_by_uuid( $uuid );
		if ( ! $proposal || ! Proposals::current_user_can_review( $proposal ) ) {
			wp_die( esc_html__( 'This proposal does not exist, or you do not have access to it.', 'jetpack-mu-wpcom' ), '', array( 'response' => 404 ) );
		}

		self::$proposal = $proposal;
		self::start_preview();
		add_action( 'wp_body_open', array( __CLASS__, 'render_bar' ), 1 );
		add_action( 'wp_footer', array( __CLASS__, 'render_bar_fallback' ), 999 );
	}

	/**
	 * What this request is previewing, for tests and debugging.
	 *
	 * @return array{proposal: ?array, outdated: bool, handlers: array<string, Proposal_Handler>}
	 */
	public static function state(): array {
		return array(
			'proposal' => self::$proposal,
			'outdated' => self::$outdated,
			'handlers' => self::$handlers,
		);
	}

	/**
	 * Code that skips stats, sharing or canonical redirects in core previews does the same here.
	 *
	 * @param WP_Query $query Query.
	 */
	public static function mark_main_query_as_preview( WP_Query $query ): void {
		if ( $query->is_main_query() ) {
			$query->is_preview = true;
		}
	}

	/**
	 * Show the bar in the footer on themes without wp_body_open.
	 */
	public static function render_bar_fallback(): void {
		if ( ! did_action( 'wp_body_open' ) ) {
			self::render_bar();
		}
	}

	/**
	 * The preview bar: what is shown, and how to leave.
	 */
	public static function render_bar(): void {
		$proposal = self::$proposal;
		if ( ! $proposal ) {
			return;
		}
		$live_url = remove_query_arg( Proposals::QUERY_VAR );

		if ( self::$outdated ) {
			$notice = __( 'This proposal is out of date because the live site changed. You are seeing the live site.', 'jetpack-mu-wpcom' );
		} elseif ( 'pending' === $proposal['status'] ) {
			$notice = __( 'Previewing the proposed changes on this page only. Other pages show the live site. Approve or reject the proposal in your chat.', 'jetpack-mu-wpcom' );
		} else {
			/* translators: %s: proposal status, such as applied or rejected. */
			$notice = sprintf( __( 'This proposal is %s. You are seeing the live site.', 'jetpack-mu-wpcom' ), $proposal['status'] );
		}
		?>
		<style id="jetpack-proposal-bar-styles">
			.jetpack-proposal-bar { position: fixed; inset-inline: 16px; inset-block-end: 16px; z-index: 100000; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; background: #1e1e1e; color: #f0f0f0; font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
			.jetpack-proposal-bar__label { flex: 1 1 240px; min-width: 0; }
			.jetpack-proposal-bar__notice { display: block; font-size: 12px; opacity: .8; }
			.jetpack-proposal-bar__title { font-weight: 600; color: #fff; }
			.jetpack-proposal-bar__live { display: inline-block; padding: 8px 14px; border-radius: 4px; font-weight: 600; text-decoration: none; color: #f0f0f0; border: 1px solid rgba(255,255,255,.3); }
			body { padding-block-end: 96px; }
		</style>
		<div class="jetpack-proposal-bar" role="region" aria-label="<?php esc_attr_e( 'Proposal preview', 'jetpack-mu-wpcom' ); ?>">
			<div class="jetpack-proposal-bar__label">
				<span class="jetpack-proposal-bar__title"><?php echo esc_html( $proposal['title'] ); ?></span>
				<span class="jetpack-proposal-bar__notice"><?php echo esc_html( $notice ); ?></span>
			</div>
			<a class="jetpack-proposal-bar__live" href="<?php echo esc_url( $live_url ); ?>"><?php esc_html_e( 'View live page', 'jetpack-mu-wpcom' ); ?></a>
		</div>
		<?php
	}

	/**
	 * Hand the items to their handlers. An outdated proposal shows the live site, so a preview never hides live edits.
	 */
	private static function start_preview(): void {
		$proposal = self::$proposal;
		if ( ! $proposal || 'pending' !== $proposal['status'] ) {
			return;
		}
		// Checked before the overlay, whose filters would report the proposed values as live.
		self::$outdated = (bool) Proposals::find_conflicts( $proposal );
		if ( self::$outdated ) {
			return;
		}

		$by_type = array();
		foreach ( $proposal['items'] as $item ) {
			$by_type[ $item['type'] ][] = $item;
		}
		$handlers = Proposals::handlers();
		foreach ( $by_type as $type => $items ) {
			$handlers[ $type ]->start_preview( $items );
			self::$handlers[ $type ] = $handlers[ $type ];
		}
		add_action( 'parse_query', array( __CLASS__, 'mark_main_query_as_preview' ) );
	}
}
