import { __, sprintf } from '@wordpress/i18n';
import type { TransferError } from './types.ts';

/** Eligibility error codes this page has copy for. */
export const EligibilityErrors = {
	BLOCKED_ATOMIC_TRANSFER: 'blocked_atomic_transfer',
	TRANSFER_ALREADY_EXISTS: 'transfer_already_exists',
	NO_BUSINESS_PLAN: 'no_business_plan',
	NO_JETPACK_SITES: 'no_jetpack_sites',
	NO_VIP_SITES: 'no_vip_sites',
	SITE_GRAYLISTED: 'site_graylisted',
	NON_ADMIN_USER: 'non_admin_user',
	NOT_RESOLVING_TO_WPCOM: 'not_resolving_to_wpcom',
	NO_SSL_CERTIFICATE: 'no_ssl_certificate',
	EMAIL_UNVERIFIED: 'email_unverified',
	EXCESSIVE_DISK_SPACE: 'excessive_disk_space',
	// wpcom builds this one from a literal rather than its own constant, and says "blog".
	IS_STAGING_SITE: 'is_staging_blog',
} as const;

export type EligibilityErrorCode = ( typeof EligibilityErrors )[ keyof typeof EligibilityErrors ];

export type BlockingMessage = {
	code: string;
	message: string;
	intent: 'error' | 'info';
	supportUrl?: string;
};

export type HoldingMessage = {
	code: string;
	title: string;
	description: string;
	supportUrl?: string;
};

type MessageMap< T > = Partial< Record< EligibilityErrorCode, T > >;

let blockingMessages: MessageMap< BlockingMessage > | null = null;
let holdingMessages: MessageMap< HoldingMessage > | null = null;

/**
 * Last-resort copy for an error the API sent with no message of its own.
 *
 * @return The message.
 */
function getGenericBlockingMessage(): string {
	return __(
		'This site is not currently eligible to activate backups. Please contact our support team for help.',
		'jetpack-mu-wpcom'
	);
}

/**
 * Errors that stop the transfer outright, shown as a single notice.
 *
 * Built on first call rather than at module scope so `__()` runs once the locale
 * data is loaded, then cached because every lookup below rebuilds it otherwise.
 *
 * @return The messages, keyed by error code.
 */
function getBlockingMessages(): MessageMap< BlockingMessage > {
	blockingMessages ||= {
		[ EligibilityErrors.BLOCKED_ATOMIC_TRANSFER ]: {
			code: EligibilityErrors.BLOCKED_ATOMIC_TRANSFER,
			message: getGenericBlockingMessage(),
			intent: 'error',
		},
		[ EligibilityErrors.TRANSFER_ALREADY_EXISTS ]: {
			code: EligibilityErrors.TRANSFER_ALREADY_EXISTS,
			message: __(
				'Setup in progress. Just a minute! Please wait until it is finished, then try again.',
				'jetpack-mu-wpcom'
			),
			intent: 'info',
		},
		[ EligibilityErrors.NO_JETPACK_SITES ]: {
			code: EligibilityErrors.NO_JETPACK_SITES,
			message: __( 'Try using a different site.', 'jetpack-mu-wpcom' ),
			intent: 'error',
		},
		[ EligibilityErrors.NO_VIP_SITES ]: {
			code: EligibilityErrors.NO_VIP_SITES,
			message: __( 'Try using a different site.', 'jetpack-mu-wpcom' ),
			intent: 'error',
		},
		[ EligibilityErrors.SITE_GRAYLISTED ]: {
			code: EligibilityErrors.SITE_GRAYLISTED,
			message: __(
				'There’s an ongoing site dispute. Contact us to review your site’s standing and resolve the dispute.',
				'jetpack-mu-wpcom'
			),
			intent: 'error',
			supportUrl: 'https://wordpress.com/support/suspended-blogs/',
		},
		[ EligibilityErrors.NO_SSL_CERTIFICATE ]: {
			code: EligibilityErrors.NO_SSL_CERTIFICATE,
			message: __(
				'Certificate installation in progress. Hold tight! We are setting up a digital certificate to allow secure browsing on your site using "HTTPS".',
				'jetpack-mu-wpcom'
			),
			intent: 'info',
		},
	};

	return blockingMessages;
}

/**
 * Errors the reader can clear themselves, listed as steps to take.
 *
 * @return The messages, keyed by error code.
 */
function getHoldingMessages(): MessageMap< HoldingMessage > {
	holdingMessages ||= {
		[ EligibilityErrors.NO_BUSINESS_PLAN ]: {
			code: EligibilityErrors.NO_BUSINESS_PLAN,
			title: sprintf(
				/* translators: %s is a WordPress.com plan name, e.g. "Business". */
				__( '%s plan required', 'jetpack-mu-wpcom' ),
				'Business'
			),
			description: __(
				'You’ll also get to install custom themes, plugins, and have more storage.',
				'jetpack-mu-wpcom'
			),
		},
		[ EligibilityErrors.NON_ADMIN_USER ]: {
			code: EligibilityErrors.NON_ADMIN_USER,
			title: __( 'Site administrator only', 'jetpack-mu-wpcom' ),
			description: __( 'Only the site administrators can use this feature.', 'jetpack-mu-wpcom' ),
			supportUrl: 'https://wordpress.com/support/user-roles/',
		},
		[ EligibilityErrors.NOT_RESOLVING_TO_WPCOM ]: {
			code: EligibilityErrors.NOT_RESOLVING_TO_WPCOM,
			title: __( 'Domain pointing to a different site', 'jetpack-mu-wpcom' ),
			description: __(
				'Your domain is not properly set up to point to your site. Reset your domain’s A records in the Domains section to fix this.',
				'jetpack-mu-wpcom'
			),
			supportUrl: 'https://wordpress.com/support/move-domain/setting-custom-a-records/',
		},
		[ EligibilityErrors.EMAIL_UNVERIFIED ]: {
			code: EligibilityErrors.EMAIL_UNVERIFIED,
			title: __( 'Confirm your email address', 'jetpack-mu-wpcom' ),
			description: __(
				'Check your email for a message we sent you when you signed up. Click the link inside to confirm your email address. You may have to check your email client’s spam folder.',
				'jetpack-mu-wpcom'
			),
		},
		[ EligibilityErrors.EXCESSIVE_DISK_SPACE ]: {
			code: EligibilityErrors.EXCESSIVE_DISK_SPACE,
			title: __( 'Increase storage space', 'jetpack-mu-wpcom' ),
			description: __(
				'Your site does not have enough available storage space. Please purchase a plan with additional storage or contact our support team for help.',
				'jetpack-mu-wpcom'
			),
		},
		[ EligibilityErrors.IS_STAGING_SITE ]: {
			code: EligibilityErrors.IS_STAGING_SITE,
			title: __( 'Create a new staging site', 'jetpack-mu-wpcom' ),
			description: __(
				'Backups cannot be activated for a staging site. Create a new staging site to continue.',
				'jetpack-mu-wpcom'
			),
		},
	};

	return holdingMessages;
}

/**
 * Look a code up without matching inherited `Object.prototype` keys.
 *
 * @param messages - The message map to search.
 * @param code     - The error code, which may be any string the API sends.
 * @return The message, or undefined.
 */
function lookUp< T >( messages: MessageMap< T >, code: string ): T | undefined {
	return Object.hasOwn( messages, code ) ? messages[ code as EligibilityErrorCode ] : undefined;
}

/**
 * An Atomic site below the Business plan reports both `transfer_already_exists`
 * and `no_business_plan`. The first would render a "setup in progress" notice
 * for a transfer that is not running, so suppress it and prompt to upgrade.
 *
 * @param errors - Eligibility errors.
 * @return Whether both codes are present.
 */
export function isAtomicSiteWithoutBusinessPlan( errors: TransferError[] ) {
	return [ EligibilityErrors.TRANSFER_ALREADY_EXISTS, EligibilityErrors.NO_BUSINESS_PLAN ].every(
		code => errors.some( error => error.code === code )
	);
}

/**
 * The first error that stops the transfer outright, if any.
 *
 * A code with no copy here still has to explain itself, so it falls back to the
 * API's own message and then to a generic line — never to an empty modal.
 *
 * @param errors - Eligibility errors.
 * @return The matching message, or null.
 */
export function findFirstBlockingError( errors: TransferError[] ): BlockingMessage | null {
	const messages = getBlockingMessages();
	const known = errors.find( error => lookUp( messages, error.code ) );

	if ( known ) {
		return lookUp( messages, known.code ) ?? null;
	}

	// Holds render as their own list below, so they are not a gap to fill here.
	const holds = getHoldingMessages();
	const uncovered = errors.find( error => ! lookUp( holds, error.code ) );

	if ( ! uncovered ) {
		return null;
	}

	return {
		code: uncovered.code,
		message: uncovered.message || getGenericBlockingMessage(),
		intent: 'error',
	};
}

/**
 * The errors the reader can clear themselves.
 *
 * @param errors - Eligibility errors.
 * @return The matching messages, in the order the API returned them.
 */
export function findHoldingErrors( errors: TransferError[] ) {
	const messages = getHoldingMessages();

	return errors.reduce( ( acc: HoldingMessage[], err ) => {
		const message = lookUp( messages, err.code );

		if ( message ) {
			acc.push( message );
		}

		return acc;
	}, [] );
}

/**
 * Whether any error stops the transfer outright.
 *
 * @param errors - Eligibility errors.
 * @return Whether a blocking error is present.
 */
export function hasAnyBlockingError( errors: TransferError[] ) {
	return findFirstBlockingError( errors ) !== null;
}

/**
 * Whether the site needs a plan upgrade before it can be transferred.
 *
 * @param errors - Eligibility errors.
 * @return Whether the plan is the only thing in the way.
 */
export function needsPlanUpgrade( errors: TransferError[] ) {
	return errors.some( error => error.code === EligibilityErrors.NO_BUSINESS_PLAN );
}

/**
 * Whether the confirmation modal has anything to say before the transfer starts.
 *
 * @param isEligible - Whether the site passed every transfer check.
 * @param errors     - Eligibility errors.
 * @param warnings   - Non-blocking transfer warnings.
 * @return Whether the reader has to see the modal first.
 */
export function needsConfirmation(
	isEligible: boolean,
	errors: TransferError[],
	warnings: unknown[]
) {
	return ! isEligible || errors.length > 0 || warnings.length > 0;
}

/**
 * Whether the reader can start the transfer. The plan is bought inside the
 * flow, so a missing one is not a reason to hold them here.
 *
 * @param isEligible - Whether the site passed every transfer check.
 * @param errors     - Eligibility errors.
 * @return Whether the call to action is actionable.
 */
export function canProceed( isEligible: boolean, errors: TransferError[] ) {
	return isEligible || needsPlanUpgrade( errors );
}
