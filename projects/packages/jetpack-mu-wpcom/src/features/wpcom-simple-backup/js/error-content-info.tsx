import { Card, CardBody, CardDivider, CardHeader, ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Stack, Text } from '@wordpress/ui';
import { Fragment } from 'react';
import type { TransferError } from './types.ts';
import type { ReactNode } from 'react';

/** Eligibility error codes this page has copy for. */
const EligibilityErrors = {
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
	IS_STAGING_SITE: 'is_staging_site',
} as const;

type BlockingMessage = {
	code: string;
	message: string;
	intent: 'error' | 'info';
	supportUrl?: string;
};

/**
 * Errors that stop the transfer outright, shown as a single notice.
 *
 * @return The messages, built at call time so they are translated.
 */
function getBlockingMessages(): Record< string, BlockingMessage > {
	return {
		[ EligibilityErrors.BLOCKED_ATOMIC_TRANSFER ]: {
			code: EligibilityErrors.BLOCKED_ATOMIC_TRANSFER,
			message: __(
				'This site is not currently eligible to activate backups. Please contact our support team for help.',
				'jetpack-mu-wpcom'
			),
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
}

type HoldingMessage = {
	code: string;
	title: string;
	description: string;
	supportUrl?: string;
};

/**
 * Errors the reader can clear themselves, listed as steps to take.
 *
 * @return The messages, built at call time so they are translated.
 */
function getHoldingMessages(): Record< string, HoldingMessage > {
	return {
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
}

/**
 * An Atomic site below the Business plan reports both `transfer_already_exists`
 * and `no_business_plan`. The first would render a "setup in progress" notice
 * for a transfer that is not running, so suppress it and prompt to upgrade.
 *
 * @param errors - Eligibility errors.
 * @return Whether both codes are present.
 */
function isAtomicSiteWithoutBusinessPlan( errors: TransferError[] ) {
	return [ EligibilityErrors.TRANSFER_ALREADY_EXISTS, EligibilityErrors.NO_BUSINESS_PLAN ].every(
		code => errors.some( error => error.code === code )
	);
}

/**
 * The first error that stops the transfer outright, if any.
 *
 * @param errors - Eligibility errors.
 * @return The matching message, or null.
 */
function findFirstBlockingError( errors: TransferError[] ) {
	const messages = getBlockingMessages();
	const error = errors.find( err => err.code in messages );

	return error ? messages[ error.code ] : null;
}

/**
 * The errors the reader can clear themselves.
 *
 * @param errors - Eligibility errors.
 * @return The matching messages, in the order the API returned them.
 */
function findHoldingErrors( errors: TransferError[] ) {
	const messages = getHoldingMessages();

	return errors.reduce( ( acc: HoldingMessage[], err ) => {
		if ( messages[ err.code ] ) {
			acc.push( messages[ err.code ] );
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
 * Whether the errors include a given code.
 *
 * @param errors - Eligibility errors.
 * @param code   - The code to look for.
 * @return Whether the code is present.
 */
export function hasHoldingError( errors: TransferError[], code: string ) {
	return errors.some( error => error.code === code );
}

/**
 * Whether the site needs a plan upgrade before it can be transferred.
 *
 * @param errors - Eligibility errors.
 * @return Whether the plan is the only thing in the way.
 */
export function needsPlanUpgrade( errors: TransferError[] ) {
	return hasHoldingError( errors, EligibilityErrors.NO_BUSINESS_PLAN );
}

/**
 * "Learn more", appended to a message that has somewhere to point.
 *
 * @param props            - Component props.
 * @param props.supportUrl - Documentation for the error.
 * @return The rendered link.
 */
function LearnMore( { supportUrl }: { supportUrl: string } ): ReactNode {
	return (
		<>
			{ ' ' }
			<ExternalLink href={ supportUrl }>{ __( 'Learn more', 'jetpack-mu-wpcom' ) }</ExternalLink>
		</>
	);
}

/**
 * Why the transfer cannot start: one notice for blocking errors, and a list of
 * steps for the ones the reader can clear themselves.
 *
 * Ported from the dashboard's `ErrorContentInfo`
 * (`client/dashboard/sites/hosting-feature-activation-modal/error-content-info.tsx`).
 *
 * @param props        - Component props.
 * @param props.errors - Eligibility errors.
 * @return The rendered errors.
 */
export function ErrorContentInfo( { errors }: { errors: TransferError[] } ) {
	const blocking = ! isAtomicSiteWithoutBusinessPlan( errors ) && findFirstBlockingError( errors );
	const holds = findHoldingErrors( errors );

	return (
		<Stack direction="column" gap="sm">
			{ blocking && (
				<Notice.Root intent={ blocking.intent }>
					<Notice.Description>
						{ blocking.message }
						{ blocking.supportUrl && <LearnMore supportUrl={ blocking.supportUrl } /> }
					</Notice.Description>
				</Notice.Root>
			) }
			{ holds.length > 0 && (
				<Card size="small">
					<CardHeader>
						<Text variant="heading-sm" render={ <h2 /> }>
							{ __( 'To activate backups you’ll need to:', 'jetpack-mu-wpcom' ) }
						</Text>
					</CardHeader>
					{ holds.map( ( hold, index ) => (
						<Fragment key={ hold.code }>
							<CardBody>
								<Stack direction="column" gap="sm">
									<Text variant="heading-sm" render={ <h3 /> }>
										{ hold.title }
									</Text>
									<Text render={ <p /> }>
										{ hold.description }
										{ hold.supportUrl && <LearnMore supportUrl={ hold.supportUrl } /> }
									</Text>
								</Stack>
							</CardBody>
							{ index < holds.length - 1 && <CardDivider /> }
						</Fragment>
					) ) }
				</Card>
			) }
		</Stack>
	);
}
