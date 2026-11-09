import { __, sprintf } from '@wordpress/i18n';
import { dayLabel } from './dates';
import type { FailureDetail, FailureOwner, FailureReason, HostReason, LogRow } from './types';

export type { FailureReason, FailureOwner, HostReason };

/** Where people go when the problem is on our side. */
export const SUPPORT_URL = 'https://jetpack.com/contact-support/';

/** Who can fix each reason. Must match the server's list (both are tested against one fixture). */
const OWNERS: Record< FailureReason, FailureOwner > = {
	unsupported: 'none',
	too_large: 'email',
	attachment_missing: 'email',
	attachment_blocked: 'email',
	bad_address: 'recipient',
	lockdown: 'records',
	dkim: 'records',
	spf: 'records',
	sender_domain: 'records',
	unverified: 'ours',
	account: 'ours',
	limit: 'ours',
	paused: 'ours',
	busy: 'retry',
	service_down: 'ours',
	no_answer: 'retry',
	unclear: 'ours',
	blocked_by_site: 'site',
	cant_find: 'server',
	cant_connect: 'server',
	insecure: 'server',
	content: 'email',
	virus: 'email',
	suppressed: 'recipient',
	rejected: 'recipient',
	bad_list: 'ours',
	unknown: 'ours',
};

/** Every reason the server stores, in the catalogue's order. */
export const FAILURE_REASONS = Object.keys( OWNERS ) as FailureReason[];

/** What a notice can offer: `resend_other` opens the resend dialog on "Someone else". */
export type FailureAction =
	| 'check_records'
	| 'open_advanced'
	| 'contact_support'
	| 'resend'
	| 'resend_other'
	| 'copy_details';

/** A row, or anything else with an error and maybe a stored reason, like a test's result. */
export type FailureInput = Partial< Pick< LogRow, 'error' | 'status' | 'source' > > & {
	reason?: string;
};

export type FailureContext = {
	/** The sending domain; '' when unknown. */
	domain: string;
	/** The plugin that sent it (`origin_label`); "the plugin that sent it" when absent. */
	plugin?: string;
	/** Accounts come from the local development provisioner. */
	devMode?: boolean;
	/** A test email: test wording, and no resend actions. */
	isTest?: boolean;
	/** A host-sent row: only Check your records, Open Advanced settings and Contact support stay. */
	fallback?: boolean;
	/** The day the plan's count starts again, site-local `Y-m-d`, for `limit`. */
	resetsOn?: string;
	/** False drops the resend actions (the entry's `resend.allowed`); absent keeps them. */
	canResend?: boolean;
};

export type FailureCopy = { headline: string; step: string; actions: FailureAction[] };

export type FailureOptions = {
	/** Accounts come from the local development provisioner. */
	devMode?: boolean;
	/** A test email. */
	isTest?: boolean;
	/** The plugin that sent it. */
	plugin?: string;
};

const UNVERIFIED = /\bverified (?:e-?mail )?(?:address|recipient)/i;

// Older rows have no stored reason, so their error text is read; the HTTP status decides first.
const HTTP_STATUS: [ FailureReason, RegExp ][] = [
	[ 'account', /\bhttp (?:status )?(?:401|402|403|429)\b/i ],
	[ 'service_down', /\bhttp (?:status )?5\d\d\b/i ],
];

// Checked in order: a "550 … lockdown" rejection is a records problem, not an account one.
const PATTERNS: [ FailureReason, RegExp[] ][] = [
	[
		'lockdown',
		[ /lock\s?down/i, /_mailchannels/i, /not (?:authori[sz]ed|permitted|allowed) to send/i ],
	],
	[ 'dkim', [ /\bdkim\b/i, /_domainkey/i ] ],
	[
		'account',
		[
			/\bunauthori[sz]ed\b/i,
			/\bforbidden\b/i,
			/\bauthenticat/i,
			/\bapi[ -]?key\b/i,
			/\bsuspend/i,
			/\baccount\b.*\b(?:disabled|deactivated|inactive|closed|blocked|locked)\b/i,
			/\b(?:limit|quota)\b.*\b(?:reached|exceeded|hit)\b/i,
			/\b(?:reached|exceeded)\b.*\b(?:limit|quota)\b/i,
			/too many requests|rate.?limit/i,
			/payment required|\bbilling\b|\b(?:upgrade|current|trial|free|your) plan\b/i,
		],
	],
	[
		'unsupported',
		[ /features Send does not support/i, /attachments are larger/i, /no valid recipient/i ],
	],
	[ 'content', [ /\[cs\]/i, /content (?:filter|scan|polic)/i, /\bspam\b/i, /\bflagged\b/i ] ],
	[
		'rejected',
		[
			/\breject(?:ed|s)?\b/i,
			/user unknown|no such (?:user|mailbox)|mailbox (?:unavailable|not found|full)/i,
			/\b5\.1\.[0-9]\b/,
		],
	],
	[
		'service_down',
		[
			/time[sd]?\s?out/i,
			/curl error/i,
			/(?:could ?n[o']t|unable to) (?:resolve|connect)/i,
			/connection (?:refused|reset|failed)/i,
			/service unavailable|bad gateway|internal server error|gateway time-?out/i,
		],
	],
];

/**
 * Whether a value is one of the reasons the server stores.
 *
 * @param value - Anything.
 * @return True for a known key.
 */
export function isFailureReason( value: unknown ): value is FailureReason {
	return typeof value === 'string' && Object.prototype.hasOwnProperty.call( OWNERS, value );
}

/**
 * Read an older row's error text, which has no stored reason.
 *
 * @param error - The raw error.
 * @return The reason.
 */
function legacyReason( error: string ): FailureReason {
	if ( ! error ) {
		return 'unknown';
	}
	// The verified-address refusal comes as a 403 too, but it has its own words in development.
	if ( UNVERIFIED.test( error ) ) {
		return 'unverified';
	}
	const status = HTTP_STATUS.find( ( [ , pattern ] ) => pattern.test( error ) );
	if ( status ) {
		return status[ 0 ];
	}
	const match = PATTERNS.find( ( [ , patterns ] ) =>
		patterns.some( pattern => pattern.test( error ) )
	);
	return match ? match[ 0 ] : 'unknown';
}

/**
 * Why an email failed: the stored reason when the row has one, else a reading of its error text.
 *
 * @param input - A row (or test result), or an older row's error text.
 * @return The reason.
 */
export function failureReason( input: FailureInput | string ): FailureReason {
	if ( typeof input === 'string' ) {
		return legacyReason( input );
	}
	if ( isFailureReason( input?.reason ) ) {
		return input.reason;
	}
	return legacyReason( typeof input?.error === 'string' ? input.error : '' );
}

/**
 * Who can fix a reason.
 *
 * @param reason - The reason.
 * @return The owner.
 */
export function failureOwner( reason: FailureReason ): FailureOwner {
	return OWNERS[ reason ] ?? 'ours';
}

/**
 * Pick the sentence with the plugin's name, or the one without.
 *
 * @param plugin  - The plugin's name, if known.
 * @param named   - Builds the sentence with the name.
 * @param unnamed - The sentence without it.
 * @return The sentence.
 */
const withPlugin = (
	plugin: string | undefined,
	named: ( name: string ) => string,
	unnamed: string
): string => ( plugin ? named( plugin ) : unnamed );

const OUR_SIDE = () => __( 'The problem is on our side, not your site.', 'jetpack-send-pkg' );
const NOTHING_TO_CHANGE = () =>
	__(
		'You don’t need to change anything. If it keeps happening, contact support.',
		'jetpack-send-pkg'
	);
const CHECK_BEFORE_RESEND = () =>
	__( 'Check with the person before you resend it.', 'jetpack-send-pkg' );
const CHECK_INBOX = () =>
	__( 'Check your inbox in a minute. If it isn’t there, send another test.', 'jetpack-send-pkg' );
const CHECK_PROFILE = () =>
	__( 'Check the email address on your profile, then send another test.', 'jetpack-send-pkg' );

/** Tests can't be resent, so their steps say to send another one. */
const TEST_STEPS: Partial< Record< FailureReason, () => string > > = {
	bad_address: CHECK_PROFILE,
	rejected: CHECK_PROFILE,
	busy: () => __( 'Wait a few minutes, then send another test.', 'jetpack-send-pkg' ),
	service_down: () =>
		__( 'Send another test. If it keeps happening, contact support.', 'jetpack-send-pkg' ),
	no_answer: CHECK_INBOX,
	unclear: CHECK_INBOX,
	cant_find: () =>
		__(
			'Send another test. If it keeps happening, copy the details and ask your host.',
			'jetpack-send-pkg'
		),
};

/**
 * The headline, one next step and the actions for a reason, in plain words. Never names the
 * sending service or uses technical words; those live in Technical details.
 *
 * @param reason - The reason.
 * @param ctx    - The email's context.
 * @return Headline, step (may be ''), and at most two actions.
 */
export function failureCopy( reason: FailureReason, ctx: FailureContext ): FailureCopy {
	const { domain, plugin, devMode = false, isTest = false, resetsOn } = ctx;
	let copy: FailureCopy;
	switch ( reason ) {
		case 'unsupported':
			copy = {
				headline: __(
					'Jetpack Send can’t handle something in this email yet.',
					'jetpack-send-pkg'
				),
				step: __( 'Nothing to do. Your host’s mail sends emails like this.', 'jetpack-send-pkg' ),
				actions: [],
			};
			break;
		case 'too_large':
			copy = {
				headline: __(
					'This email is too big. Its files add up to more than 20 MB.',
					'jetpack-send-pkg'
				),
				step: withPlugin(
					plugin,
					name =>
						sprintf(
							/* translators: %s: the name of the plugin that sent the email. */
							__(
								'Send a link to the file instead. You can change this in %s.',
								'jetpack-send-pkg'
							),
							name
						),
					__(
						'Send a link to the file instead. You can change this in the plugin that sent it.',
						'jetpack-send-pkg'
					)
				),
				actions: [],
			};
			break;
		case 'attachment_missing':
			copy = {
				headline: __( 'A file this email should attach is missing.', 'jetpack-send-pkg' ),
				step: withPlugin(
					plugin,
					name =>
						sprintf(
							/* translators: %s: the name of the plugin that sent the email. */
							__(
								'%s pointed to a file that isn’t there. Ask its support team.',
								'jetpack-send-pkg'
							),
							name
						),
					__(
						'The plugin that sent it pointed to a file that isn’t there. Ask its support team.',
						'jetpack-send-pkg'
					)
				),
				actions: [],
			};
			break;
		case 'attachment_blocked':
			copy = {
				headline: __(
					'It has a type of file Jetpack Send can’t send, like a program file.',
					'jetpack-send-pkg'
				),
				step: __( 'Share files like this as a link instead.', 'jetpack-send-pkg' ),
				actions: [],
			};
			break;
		case 'bad_address':
			copy = {
				headline: __(
					'The address it was going to isn’t a real email address.',
					'jetpack-send-pkg'
				),
				step: __( 'Check the address, then resend it to the right one.', 'jetpack-send-pkg' ),
				actions: [ 'resend_other' ],
			};
			break;
		case 'lockdown':
			copy = {
				headline: domain
					? sprintf(
							/* translators: %s: the sending domain, e.g. example.com. */
							__(
								'%s hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.',
								'jetpack-send-pkg'
							),
							domain
						)
					: __(
							'Your domain hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.',
							'jetpack-send-pkg'
						),
				step: __(
					'Check your records. It can take up to an hour after you add them.',
					'jetpack-send-pkg'
				),
				actions: [ 'check_records' ],
			};
			break;
		case 'dkim':
			copy = {
				headline: __(
					'Your signing record doesn’t match what Jetpack needs. Check record 2.',
					'jetpack-send-pkg'
				),
				step: __(
					'Copy record 2 again and make sure nothing was added to it.',
					'jetpack-send-pkg'
				),
				actions: [ 'check_records' ],
			};
			break;
		case 'spf':
			copy = {
				headline: __(
					'Your domain’s sender list doesn’t include Jetpack, so this was blocked.',
					'jetpack-send-pkg'
				),
				step: __(
					'Add Jetpack to it. The record is in Settings, under Advanced.',
					'jetpack-send-pkg'
				),
				actions: [ 'open_advanced' ],
			};
			break;
		case 'sender_domain':
			copy = {
				headline: domain
					? sprintf(
							/* translators: %s: the sending domain, e.g. example.com. */
							__( '%s needs a website or mail record before it can send.', 'jetpack-send-pkg' ),
							domain
						)
					: __(
							'Your domain needs a website or mail record before it can send.',
							'jetpack-send-pkg'
						),
				step: __( 'Ask whoever runs your domain to point it at your website.', 'jetpack-send-pkg' ),
				actions: [ 'copy_details' ],
			};
			break;
		case 'unverified':
			copy = devMode
				? {
						headline: __(
							'This sending account can only email verified addresses.',
							'jetpack-send-pkg'
						),
						step: '',
						actions: [],
					}
				: { headline: OUR_SIDE(), step: NOTHING_TO_CHANGE(), actions: [ 'contact_support' ] };
			break;
		case 'account':
			copy = { headline: OUR_SIDE(), step: NOTHING_TO_CHANGE(), actions: [ 'contact_support' ] };
			break;
		case 'limit':
			copy = {
				headline: __( 'Your site reached its email limit for now.', 'jetpack-send-pkg' ),
				step: resetsOn
					? sprintf(
							/* translators: %s: the day the count starts again, e.g. "Nov 1". */
							__(
								'Emails go out again when it resets on %s. Contact support if you need more.',
								'jetpack-send-pkg'
							),
							dayLabel( resetsOn ) || resetsOn
						)
					: __(
							'Emails go out again when it resets. Contact support if you need more.',
							'jetpack-send-pkg'
						),
				actions: [ 'contact_support' ],
			};
			break;
		case 'paused':
			copy = {
				headline: __( 'Our email service paused sending for your site.', 'jetpack-send-pkg' ),
				step: __( 'Contact support so we can look into it.', 'jetpack-send-pkg' ),
				actions: [ 'contact_support' ],
			};
			break;
		case 'busy':
			copy = {
				headline: __(
					'Your site sent a lot of email at once, so it was slowed down.',
					'jetpack-send-pkg'
				),
				step: __( 'Wait a few minutes, then resend it.', 'jetpack-send-pkg' ),
				actions: [ 'resend' ],
			};
			break;
		case 'service_down':
			copy = {
				headline: __(
					'The problem is on our side, not your site. Our email service had a hiccup.',
					'jetpack-send-pkg'
				),
				step: __( 'Resend it. If it keeps happening, contact support.', 'jetpack-send-pkg' ),
				actions: [ 'resend', 'contact_support' ],
			};
			break;
		case 'no_answer':
			copy = {
				headline: __( 'We didn’t hear back in time, so it may still arrive.', 'jetpack-send-pkg' ),
				step: CHECK_BEFORE_RESEND(),
				actions: [ 'resend' ],
			};
			break;
		case 'unclear':
			copy = {
				headline: __( 'We couldn’t read the answer, so it may have gone out.', 'jetpack-send-pkg' ),
				step: CHECK_BEFORE_RESEND(),
				actions: [ 'resend', 'contact_support' ],
			};
			break;
		case 'blocked_by_site':
			copy = {
				headline: __(
					'Your site’s settings stop it from connecting to our email service.',
					'jetpack-send-pkg'
				),
				step: __(
					'Whoever looks after your site’s code can allow it. Copy the details for them.',
					'jetpack-send-pkg'
				),
				actions: [ 'copy_details' ],
			};
			break;
		case 'cant_find':
			copy = {
				headline: __( 'Your server couldn’t find our email service.', 'jetpack-send-pkg' ),
				step: __(
					'Resend it. If it keeps happening, copy the details and ask your host.',
					'jetpack-send-pkg'
				),
				actions: [ 'resend', 'copy_details' ],
			};
			break;
		case 'cant_connect':
			copy = {
				headline: __( 'Your server couldn’t connect to our email service.', 'jetpack-send-pkg' ),
				step: __(
					'Your host may block these connections. Copy the details and ask them to allow it.',
					'jetpack-send-pkg'
				),
				actions: [ 'copy_details' ],
			};
			break;
		case 'insecure':
			copy = {
				headline: __(
					'Your server couldn’t make a safe connection to our email service.',
					'jetpack-send-pkg'
				),
				step: __(
					'Ask your host to update your server’s security certificates.',
					'jetpack-send-pkg'
				),
				actions: [ 'copy_details' ],
			};
			break;
		case 'content':
			copy = isTest
				? {
						headline: __(
							'It was flagged as spam. That’s rare for a test, so try again.',
							'jetpack-send-pkg'
						),
						step: __(
							'If it happens again, contact support so we can check it.',
							'jetpack-send-pkg'
						),
						actions: [ 'contact_support' ],
					}
				: {
						headline: __( 'It was flagged as spam.', 'jetpack-send-pkg' ),
						step: withPlugin(
							plugin,
							name =>
								sprintf(
									/* translators: %s: the name of the plugin that sent the email. */
									__(
										'If it’s a normal email from %s, contact support so we can check it.',
										'jetpack-send-pkg'
									),
									name
								),
							__(
								'If it’s a normal email from the plugin that sent it, contact support so we can check it.',
								'jetpack-send-pkg'
							)
						),
						actions: [ 'contact_support' ],
					};
			break;
		case 'virus':
			copy = {
				headline: __( 'Our scanner thought it had a virus.', 'jetpack-send-pkg' ),
				step: withPlugin(
					plugin,
					name =>
						sprintf(
							/* translators: %s: the name of the plugin that sent the email. */
							__(
								'Check the files %s attaches. If they’re safe, contact support.',
								'jetpack-send-pkg'
							),
							name
						),
					__( 'Check the files it attaches. If they’re safe, contact support.', 'jetpack-send-pkg' )
				),
				actions: [ 'contact_support' ],
			};
			break;
		case 'suppressed':
			copy = {
				headline: __(
					'This address can’t get email from your site right now.',
					'jetpack-send-pkg'
				),
				step: __(
					'It bounced before, or the person asked to stop. Check the address. If it’s right, contact support to unblock it.',
					'jetpack-send-pkg'
				),
				actions: [ 'contact_support' ],
			};
			break;
		case 'rejected':
			copy = {
				headline: __( 'The receiving mail server turned it down.', 'jetpack-send-pkg' ),
				step: __( 'Check the address is right, then resend it.', 'jetpack-send-pkg' ),
				actions: [ 'resend_other' ],
			};
			break;
		case 'bad_list':
			copy = {
				headline: __(
					'Many emails from your site went to addresses that don’t exist, so sending is limited.',
					'jetpack-send-pkg'
				),
				step: __(
					'This often means fake sign-ups. Turn on spam protection for your forms, then contact support.',
					'jetpack-send-pkg'
				),
				actions: [ 'contact_support' ],
			};
			break;
		default:
			copy = isTest
				? {
						headline: __( 'Something went wrong. Try again in a minute.', 'jetpack-send-pkg' ),
						step: __(
							'If it fails again, contact support and paste the details.',
							'jetpack-send-pkg'
						),
						actions: [ 'contact_support' ],
					}
				: {
						headline: __( 'We couldn’t tell why.', 'jetpack-send-pkg' ),
						step: __(
							'Resend it. If it fails again, contact support and paste the details.',
							'jetpack-send-pkg'
						),
						actions: [ 'resend', 'contact_support' ],
					};
	}
	const testStep = isTest ? TEST_STEPS[ reason ] : undefined;
	return {
		...copy,
		step: testStep ? testStep() : copy.step,
		actions: allowedActions( copy.actions, ctx ),
	};
}

/**
 * Drop the actions an email can't use: no resend for tests or emails that can't be resent, and
 * only the fix-it actions on host-sent rows (it went out).
 *
 * @param actions - The catalogue's actions.
 * @param ctx     - The email's context.
 * @return The actions to show.
 */
function allowedActions( actions: FailureAction[], ctx: FailureContext ): FailureAction[] {
	return actions.filter( action => {
		const resend = action === 'resend' || action === 'resend_other';
		if ( resend && ( ctx.isTest || ctx.canResend === false ) ) {
			return false;
		}
		return (
			! ctx.fallback ||
			action === 'check_records' ||
			action === 'open_advanced' ||
			action === 'contact_support'
		);
	} );
}

/** What the host's mail did when it failed too: the second line, and its action if any. */
const HOST_OUTCOMES: Record< HostReason, () => { line: string; action: FailureAction | null } > = {
	host_off: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either. Ask your host to turn on email for your site.',
			'jetpack-send-pkg'
		),
		action: 'copy_details',
	} ),
	host_login: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either. Check the password in the plugin you use for mail.',
			'jetpack-send-pkg'
		),
		action: null,
	} ),
	host_unreachable: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either. Check the settings of the plugin you use for mail, or ask your host.',
			'jetpack-send-pkg'
		),
		action: 'copy_details',
	} ),
	host_refused: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either. Their reply is in Technical details.',
			'jetpack-send-pkg'
		),
		action: 'copy_details',
	} ),
	host_failed: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either. Its reply is in Technical details.',
			'jetpack-send-pkg'
		),
		action: 'copy_details',
	} ),
	bad_address: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either, because the address isn’t a real email address.',
			'jetpack-send-pkg'
		),
		action: null,
	} ),
	attachment_missing: () => ( {
		line: __(
			'Your host’s mail couldn’t send it either, because a file it should attach is missing.',
			'jetpack-send-pkg'
		),
		action: null,
	} ),
};

/**
 * The host's outcome when it failed after a hand-off; null otherwise.
 *
 * @param detail - The row's detail.
 * @return The outcome.
 */
function hostFailure( detail: FailureDetail | null ) {
	if ( detail?.host?.result !== 'failed' ) {
		return null;
	}
	const reason = detail.host.reason;
	return (
		reason && HOST_OUTCOMES[ reason ] ? HOST_OUTCOMES[ reason ] : HOST_OUTCOMES.host_failed
	)();
}

/**
 * The line about the host's mail that follows Send's headline: what happened to a host-sent email,
 * or why the host's mail failed too. '' when the host's mail had no part in it.
 *
 * @param status - The row's status.
 * @param detail - The row's detail; null on older rows.
 * @param reason - Send's reason.
 * @return The line.
 */
export function hostLine(
	status: LogRow[ 'status' ],
	detail: FailureDetail | null,
	reason: FailureReason
): string {
	if ( status === 'fallback' ) {
		if ( ! detail ) {
			return __( 'Your host sent it instead.', 'jetpack-send-pkg' );
		}
		if ( detail.host?.result === 'accepted' ) {
			return reason === 'no_answer' || reason === 'unclear'
				? __( 'Your host’s mail sent it too, so it may arrive twice.', 'jetpack-send-pkg' )
				: __( 'Your host’s mail sent it instead.', 'jetpack-send-pkg' );
		}
		return __( 'We handed it to your host’s mail.', 'jetpack-send-pkg' );
	}
	return status === 'failed' ? ( hostFailure( detail )?.line ?? '' ) : '';
}

/**
 * The host outcome's action, used only when Send's reason offers none.
 *
 * @param detail - The row's detail.
 * @return At most one action.
 */
export function hostActions( detail: FailureDetail | null ): FailureAction[] {
	const action = hostFailure( detail )?.action;
	return action ? [ action ] : [];
}

/**
 * The headline for a reason, as one plain sentence or two.
 *
 * @param reason          - The reason.
 * @param domain          - The sending domain.
 * @param options         - Options.
 * @param options.devMode - Development accounts can say what their own limit is.
 * @param options.isTest  - Test wording.
 * @param options.plugin  - The plugin that sent it.
 * @return The headline.
 */
export function failureMessage(
	reason: FailureReason,
	domain: string,
	{ devMode = false, isTest = false, plugin }: FailureOptions = {}
): string {
	return failureCopy( reason, { domain, devMode, isTest, plugin } ).headline;
}

/**
 * What a failed or host-sent email says in a tooltip: what happened, then the headline.
 *
 * @param input   - A row, or an older row's error text.
 * @param domain  - The sending domain.
 * @param options - As `failureMessage()`.
 * @return The summary.
 */
export function failureSummary(
	input: FailureInput | string,
	domain: string,
	options: FailureOptions = {}
): string {
	const isTest = options.isTest ?? ( typeof input !== 'string' && input?.source === 'test' );
	const reason = failureReason( input );
	const message = failureMessage( reason, domain, { ...options, isTest } );
	return `${ failureTitle( reason, false ) } ${ message }`;
}

/**
 * Whether Send can't tell if the email went out: no answer in time, or an answer it couldn't read.
 *
 * @param reason - The reason.
 * @return True for `no_answer` and `unclear`.
 */
export function isUnsure( reason: FailureReason ): boolean {
	return reason === 'no_answer' || reason === 'unclear';
}

/**
 * The first sentence about an email that didn't go out through Send. When Send can't tell, it
 * doesn't say the email wasn't sent, because the next sentence says it may still arrive.
 *
 * @param reason - The reason.
 * @param isTest - A test email.
 * @return The sentence.
 */
export function failureTitle( reason: FailureReason, isTest: boolean ): string {
	if ( isUnsure( reason ) ) {
		return isTest
			? __( 'Jetpack Send isn’t sure this test went out.', 'jetpack-send-pkg' )
			: __( 'Jetpack Send isn’t sure this went out.', 'jetpack-send-pkg' );
	}
	return isTest
		? __( 'This test didn’t go through.', 'jetpack-send-pkg' )
		: __( 'Jetpack Send couldn’t send this.', 'jetpack-send-pkg' );
}

/**
 * Whether the domain's records are where the fix is.
 *
 * @param reason - The reason.
 * @return True for `lockdown`, `dkim`, `spf` and `sender_domain`.
 */
export function isRecordsProblem( reason: FailureReason ): boolean {
	return failureOwner( reason ) === 'records';
}

/**
 * Whether nothing on the site can fix it: the account behind Send, its limits, or the service.
 *
 * @param reason - The reason.
 * @return True when the owner is us.
 */
export function isOurSide( reason: FailureReason ): boolean {
	return failureOwner( reason ) === 'ours';
}

/**
 * Whether to offer the support link, as the catalogue does. The development account's own limit
 * only its developer sees, so it gets none.
 *
 * @param reason  - The reason.
 * @param devMode - Accounts come from the local development provisioner.
 * @return True to show it.
 */
export function offersSupport( reason: FailureReason, devMode = false ): boolean {
	return failureCopy( reason, { domain: '', devMode } ).actions.includes( 'contact_support' );
}
