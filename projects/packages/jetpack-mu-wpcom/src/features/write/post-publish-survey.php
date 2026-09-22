<?php
/**
 * Write — one-question survey after a writer's first Write publish.
 *
 * Shown once per user on the published post the editor redirects to, tagged with
 * WPCOM_WRITE_PUBLISHED_MARKER. Writers who arrived through the write-first signup
 * flow have no earlier WordPress.com editor to compare against, so they get a
 * plain "how was it" instead of the comparison. See CM-892.
 *
 * The choice goes to Tracks so responses segment against the wpcom_write_editor_*
 * funnel; the choice and any free text go to `marketing_survey_responses`, both
 * carrying one response ID so the halves can be rejoined.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Survey ID under which responses are stored in `marketing_survey_responses`.
 *
 * Must be registered in wpcom's Survey_Helper: an unregistered ID stores fine
 * but analyses as nothing.
 */
const WPCOM_WRITE_SURVEY_ID = 'write-first-publish';

/**
 * User meta recording that the survey has been shown, so it appears only once.
 *
 * Written when the card is actually revealed, not when it renders: on a Coming
 * Soon site the checklist owns the screen first, and its launch CTA navigates
 * away without dismissing, so a render is no evidence the writer saw anything.
 */
const WPCOM_WRITE_SURVEY_SHOWN_META = '_wpcom_write_first_publish_survey_shown';

/**
 * User meta recording that a response has been stored.
 *
 * The authoritative record of "asked and answered". The shown meta above is a
 * best-effort ping that can be lost to a dropped request, which would otherwise
 * let the same writer be surveyed — and stored — twice.
 */
const WPCOM_WRITE_SURVEY_SUBMITTED_META = '_wpcom_write_first_publish_survey_submitted';

/**
 * Nonce action guarding the survey submission.
 */
const WPCOM_WRITE_SURVEY_NONCE = 'wpcom_write_survey';

/**
 * Maximum length of the optional free-text answer, in characters.
 *
 * Ours to enforce: wpcom's 50,000-character cap lives on the unauthenticated
 * feedback-survey endpoint, which neither storage path goes through.
 */
const WPCOM_WRITE_SURVEY_MAX_COMMENT_LENGTH = 2000;

/**
 * Maximum length of the stored entry-point token.
 *
 * `sanitize_key()` bounds the character set but not the length, and the value
 * round-trips through the client, so it needs a cap of its own.
 */
const WPCOM_WRITE_SURVEY_MAX_SOURCE_LENGTH = 50;

/**
 * Whether the current user arrived through the write-first signup flow.
 *
 * `site_creation_flow` is set to the flow name at site creation, so a site born
 * from `/setup/write-on` carries `write-on` for good.
 *
 * @return bool True when this site was created by the write-first flow.
 */
function wpcom_write_is_write_first_site() {
	return 'write-on' === get_option( 'site_creation_flow' );
}

/**
 * Whether the survey should render on the current request.
 *
 * All of the following must hold:
 *  - the request carries the Write editor's post-publish marker;
 *  - we're on a single post's front-end view;
 *  - the viewer has `manage_options`, which the wpcom survey endpoint requires
 *    of the submitter anyway;
 *  - the user has not already been shown the survey.
 *
 * @return bool True when the survey should be shown.
 */
function wpcom_write_should_show_post_publish_survey() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display-only marker; mirrors the post-publish checklist's read.
	if ( ! isset( $_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] ) ) {
		return false;
	}

	if ( ! is_singular( 'post' ) ) {
		return false;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	$user_id = get_current_user_id();

	if ( get_user_meta( $user_id, WPCOM_WRITE_SURVEY_SHOWN_META, true ) ) {
		return false;
	}

	// Also honoured here, so a lost shown-ping doesn't re-offer a card whose
	// submission would then be rejected with nothing to show for it.
	if ( get_user_meta( $user_id, WPCOM_WRITE_SURVEY_SUBMITTED_META, true ) ) {
		return false;
	}

	return true;
}

/**
 * The entry point the writer came from, as tagged onto the post-publish redirect.
 *
 * Mirrors the `source` on `wpcom_write_editor_open` so responses segment the same
 * way the funnel does.
 *
 * @return string Sanitized source token, or '' when absent.
 */
function wpcom_write_survey_source() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only attribution parameter, no state change.
	if ( empty( $_GET['source'] ) || ! is_scalar( $_GET['source'] ) ) {
		return '';
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return sanitize_key( wp_unslash( $_GET['source'] ) );
}

/**
 * The answer options for a variant, as slug => label.
 *
 * Slugs are stored verbatim as the preset answer key, so they must stay stable
 * once responses exist.
 *
 * @param bool $is_write_first Whether to return the write-first variant.
 * @return array<string, string> Map of answer slug to translated label.
 */
function wpcom_write_get_survey_answers( $is_write_first ) {
	if ( $is_write_first ) {
		return array(
			'easy'        => __( 'Easy', 'jetpack-mu-wpcom' ),
			'fine'        => __( 'Fine', 'jetpack-mu-wpcom' ),
			'frustrating' => __( 'Frustrating', 'jetpack-mu-wpcom' ),
		);
	}

	return array(
		'easier'     => __( 'Easier', 'jetpack-mu-wpcom' ),
		'about_same' => __( 'About the same', 'jetpack-mu-wpcom' ),
		'harder'     => __( 'Harder', 'jetpack-mu-wpcom' ),
		'first_post' => __( 'This was my first post', 'jetpack-mu-wpcom' ),
	);
}

/**
 * Translated strings for the survey card.
 *
 * On a Coming Soon site publishing lands a private post, so the heading says
 * "saved" rather than the untrue "live" — as the post-publish checklist does.
 *
 * @param bool $is_write_first Whether to return the write-first variant.
 * @return array<string, string> Map of key -> translated string.
 */
function wpcom_write_get_survey_strings( $is_write_first ) {
	$is_coming_soon = 1 === (int) get_option( 'wpcom_public_coming_soon' );

	return array(
		'heading'      => $is_coming_soon
			? __( 'Your post is saved.', 'jetpack-mu-wpcom' )
			: __( 'Your post is live.', 'jetpack-mu-wpcom' ),
		'question'     => $is_write_first
			? __( 'How was it?', 'jetpack-mu-wpcom' )
			: __( "How did writing this compare to the WordPress.com editor you've used before?", 'jetpack-mu-wpcom' ),
		'commentLabel' => $is_write_first
			? __( 'What almost stopped you?', 'jetpack-mu-wpcom' )
			: __( 'What worked, and what got in your way?', 'jetpack-mu-wpcom' ),
		'commentHint'  => __( 'Optional', 'jetpack-mu-wpcom' ),
		'send'         => __( 'Send', 'jetpack-mu-wpcom' ),
		'skip'         => __( 'No thanks', 'jetpack-mu-wpcom' ),
		'close'        => __( 'Close', 'jetpack-mu-wpcom' ),
		'thanks'       => __( 'Thank you — this helps.', 'jetpack-mu-wpcom' ),
	);
}

/**
 * Enqueue the survey assets when it should render.
 *
 * @return void
 */
function wpcom_write_enqueue_post_publish_survey_assets() {
	if ( ! wpcom_write_should_show_post_publish_survey() ) {
		return;
	}

	wp_enqueue_style(
		'wpcom-write-post-publish-survey',
		wpcom_write_asset_url( 'post-publish-survey.css' ),
		array(),
		WPCOM_WRITE_VERSION
	);

	wp_enqueue_script(
		'wpcom-write-post-publish-survey',
		wpcom_write_asset_url( 'post-publish-survey.js' ),
		array(),
		WPCOM_WRITE_VERSION,
		true
	);

	$is_write_first = wpcom_write_is_write_first_site();

	wp_localize_script(
		'wpcom-write-post-publish-survey',
		'wpcomWritePostPublishSurvey',
		array(
			// admin-ajax because a Simple site serves no REST API at its own hostname.
			'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
			'nonce'      => wp_create_nonce( WPCOM_WRITE_SURVEY_NONCE ),
			// Shared with the stored response so the two halves can be rejoined.
			'responseId' => wp_generate_uuid4(),
			'variant'    => $is_write_first ? 'write_first' : 'returning',
			'source'     => wpcom_write_survey_source(),
			'blogId'     => wpcom_write_survey_blog_id(),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'wpcom_write_enqueue_post_publish_survey_assets' );

/**
 * Output the survey card markup in the footer.
 *
 * Plain markup wired up by post-publish-survey.js — no Interactivity API, since
 * this renders on an arbitrary theme front-end, not the Write editor surface.
 *
 * @return void
 */
function wpcom_write_render_post_publish_survey() {
	if ( ! wpcom_write_should_show_post_publish_survey() ) {
		return;
	}

	$is_write_first = wpcom_write_is_write_first_site();
	$strings        = wpcom_write_get_survey_strings( $is_write_first );
	$answers        = wpcom_write_get_survey_answers( $is_write_first );

	?>
	<div class="wpcom-write-pps" role="dialog" aria-modal="true" aria-labelledby="wpcom-write-pps-question" hidden>
		<div class="wpcom-write-pps__backdrop" data-wpcom-write-pps-dismiss></div>
		<div class="wpcom-write-pps__card">
			<button type="button" class="wpcom-write-pps__close" data-wpcom-write-pps-dismiss aria-label="<?php echo esc_attr( $strings['close'] ); ?>">&times;</button>
			<p class="wpcom-write-pps__heading"><?php echo esc_html( $strings['heading'] ); ?></p>
			<h2 id="wpcom-write-pps-question" class="wpcom-write-pps__question"><?php echo esc_html( $strings['question'] ); ?></h2>
			<div class="wpcom-write-pps__answers">
				<?php foreach ( $answers as $slug => $label ) : ?>
					<button type="button" class="wpcom-write-pps__answer" aria-pressed="false" data-wpcom-write-pps-answer="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></button>
				<?php endforeach; ?>
			</div>
			<div class="wpcom-write-pps__comment" hidden>
				<label class="wpcom-write-pps__comment-label" for="wpcom-write-pps-comment">
					<?php echo esc_html( $strings['commentLabel'] ); ?>
					<span class="wpcom-write-pps__comment-hint"><?php echo esc_html( $strings['commentHint'] ); ?></span>
				</label>
				<textarea
					id="wpcom-write-pps-comment"
					class="wpcom-write-pps__comment-input"
					rows="3"
					maxlength="<?php echo esc_attr( (string) WPCOM_WRITE_SURVEY_MAX_COMMENT_LENGTH ); ?>"
				></textarea>
				<button type="button" class="wpcom-write-pps__send" data-wpcom-write-pps-send><?php echo esc_html( $strings['send'] ); ?></button>
			</div>
			<button type="button" class="wpcom-write-pps__skip" data-wpcom-write-pps-dismiss><?php echo esc_html( $strings['skip'] ); ?></button>
			<p class="wpcom-write-pps__thanks" role="status" aria-live="polite" hidden><?php echo esc_html( $strings['thanks'] ); ?></p>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', 'wpcom_write_render_post_publish_survey' );

/**
 * The wpcom blog ID, which Atomic's local `get_current_blog_id()` is not.
 *
 * @return int Blog ID, or 0 when the site has no wpcom identity.
 */
function wpcom_write_survey_blog_id() {
	if ( ! class_exists( Connection_Manager::class ) ) {
		return 0;
	}

	return (int) Connection_Manager::get_site_id( true );
}

/**
 * Store a survey response in wpcom's central `marketing_survey_responses` table.
 *
 * Host-dependent transport, mirroring Common\wpcom_record_tracks_event(): Simple
 * loads the lib in-process, Atomic has no `require_lib()` and goes out through the
 * connection client. The endpoint is not site-specific, hence the `site_id` param.
 *
 * @param array $responses Map of question key to answer (preset slug or array with 'text').
 * @return bool True when the response was handed to the store.
 */
function wpcom_write_store_survey_response( $responses ) {
	if ( function_exists( 'require_lib' ) ) {
		require_lib( 'marketing/survey' );

		if ( class_exists( 'Marketing_Survey' ) ) {
			$result = \Marketing_Survey::submit_survey( get_current_blog_id(), get_current_user_id(), WPCOM_WRITE_SURVEY_ID, $responses );

			return ! empty( $result['success'] );
		}
	}

	// The endpoint keys both its capability check and the stored row off `site_id`,
	// and Atomic's local blog ID is 1 — it has to be the wpcom one.
	$blog_id = wpcom_write_survey_blog_id();

	if ( ! class_exists( Client::class ) || ! $blog_id ) {
		return false;
	}

	$response = Client::wpcom_json_api_request_as_user(
		'/marketing/survey',
		'v2',
		array( 'method' => 'POST' ),
		array(
			'site_id'          => $blog_id,
			'survey_id'        => WPCOM_WRITE_SURVEY_ID,
			'survey_responses' => $responses,
		),
		'wpcom'
	);

	return ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response );
}

/**
 * Record that the survey card was revealed to this user.
 *
 * Fired by the card on reveal so the once-per-user gate closes on a card the
 * writer actually saw. Best-effort: a dropped request costs one repeat showing,
 * which is the better failure.
 *
 * @return void
 */
function wpcom_write_ajax_mark_survey_shown() {
	check_ajax_referer( WPCOM_WRITE_SURVEY_NONCE, 'nonce' );

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'reason' => 'forbidden' ), 403, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	update_user_meta( get_current_user_id(), WPCOM_WRITE_SURVEY_SHOWN_META, time() );

	wp_send_json_success( null, 200, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
}
add_action( 'wp_ajax_wpcom_write_survey_shown', 'wpcom_write_ajax_mark_survey_shown' );

/**
 * Neutralize a leading spreadsheet-formula character in free text.
 *
 * The stored responses are exported to CSV downstream, where a cell beginning
 * `=`, `+`, `-`, `@`, tab or CR is evaluated as a formula by spreadsheet apps.
 * Prefixing with an apostrophe is the standard defence and is reversible — a
 * consumer that doesn't need it can strip the leading quote.
 *
 * Byte-wise on purpose: a multi-byte leading character starts with a byte above
 * 0x7F and can never collide with these ASCII triggers.
 *
 * @param string $text Sanitized free text.
 * @return string Text safe to place in a CSV cell.
 */
function wpcom_write_neutralize_csv_formula( $text ) {
	if ( '' === $text ) {
		return $text;
	}

	$triggers = array( '=', '+', '-', '@', "\t", "\r" );

	return in_array( $text[0], $triggers, true ) ? "'" . $text : $text;
}

/**
 * Build the response payload stored against the survey.
 *
 * Answers are stored as a preset slug, or array( 'text' => … ) for prose — the
 * shape wpcom's response formatter reads. The trailing keys are metadata, stored
 * alongside the answers the way calypso-remove-purchase stores its own.
 *
 * Every field is bounded here, because neither storage path passes through the
 * endpoint that enforces wpcom's response-size cap. All of them arrive from the
 * client, including the ID we minted and handed out at render.
 *
 * @param string $answer         Validated answer slug.
 * @param string $comment        Optional free-text answer, already sanitized.
 * @param string $response_id    Shared ID linking this row to its Tracks event.
 * @param string $source         Entry point the writer came from.
 * @param bool   $is_write_first Whether this is the write-first variant.
 * @return array<string, mixed> Payload for Marketing_Survey::submit_survey().
 */
function wpcom_write_build_survey_response( $answer, $comment, $response_id, $source, $is_write_first ) {
	$responses = array(
		'experience'  => $answer,
		'variant'     => $is_write_first ? 'write_first' : 'returning',
		'entry_point' => substr( $source, 0, WPCOM_WRITE_SURVEY_MAX_SOURCE_LENGTH ),
		// Only ever a uuid4 we generated; anything else is discarded rather than stored.
		'response_id' => wp_is_uuid( $response_id ) ? $response_id : '',
	);

	$comment = mb_substr( $comment, 0, WPCOM_WRITE_SURVEY_MAX_COMMENT_LENGTH );

	if ( '' !== $comment ) {
		// Capped first, so the escape prefix is never what gets truncated away.
		$responses['comment'] = array( 'text' => wpcom_write_neutralize_csv_formula( $comment ) );
	}

	return $responses;
}

/**
 * Handle a survey submission from the card.
 *
 * Logged-in only (`wp_ajax_`, not `wp_ajax_nopriv_`): the card only ever renders
 * to an authenticated author.
 *
 * @return void
 */
function wpcom_write_ajax_submit_survey() {
	check_ajax_referer( WPCOM_WRITE_SURVEY_NONCE, 'nonce' );

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'reason' => 'forbidden' ), 403, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	$is_write_first = wpcom_write_is_write_first_site();
	$valid_answers  = array_keys( wpcom_write_get_survey_answers( $is_write_first ) );
	$answer         = isset( $_POST['answer'] ) ? sanitize_key( wp_unslash( $_POST['answer'] ) ) : '';

	if ( ! in_array( $answer, $valid_answers, true ) ) {
		wp_send_json_error( array( 'reason' => 'invalid_answer' ), 400, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	$comment     = isset( $_POST['comment'] ) ? sanitize_textarea_field( wp_unslash( $_POST['comment'] ) ) : '';
	$response_id = isset( $_POST['response_id'] ) ? sanitize_text_field( wp_unslash( $_POST['response_id'] ) ) : '';
	$source      = isset( $_POST['source'] ) ? sanitize_key( wp_unslash( $_POST['source'] ) ) : '';

	// Once per user is enforced here, not only on the render path: nonces replay
	// for their full lifetime, and a lost shown-ping can re-offer the card.
	if ( get_user_meta( get_current_user_id(), WPCOM_WRITE_SURVEY_SUBMITTED_META, true ) ) {
		wp_send_json_error( array( 'reason' => 'already_submitted' ), 409, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	$responses = wpcom_write_build_survey_response( $answer, $comment, $response_id, $source, $is_write_first );

	if ( ! wpcom_write_store_survey_response( $responses ) ) {
		// Recorded here rather than from the card: the browser learns of the failure
		// only once the request resolves, by which point the writer may well be gone.
		if ( function_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event' ) ) {
			Common\wpcom_record_tracks_event(
				'wpcom_write_first_publish_survey_store_failed',
				array(
					'reason'      => 'store',
					'response_id' => $responses['response_id'],
					'entry_point' => $responses['entry_point'],
					'variant'     => $responses['variant'],
					'blog_id'     => wpcom_write_survey_blog_id(),
				)
			);
		}

		wp_send_json_error( array( 'reason' => 'store_failed' ), 500, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	update_user_meta( get_current_user_id(), WPCOM_WRITE_SURVEY_SUBMITTED_META, time() );

	wp_send_json_success( null, 200, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
}
add_action( 'wp_ajax_wpcom_write_submit_survey', 'wpcom_write_ajax_submit_survey' );
