import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { OTHER_SLUG, UNSURE_SLUG, getProvider } from '../../components/onboarding/providers';
import type { DnsRecord, SendStatus } from '../../data/types';

const HOUR_MS = 60 * 60 * 1000;

/** After this long without verifying, the records card says it is still waiting. */
export const STALLED_AFTER_MS = 48 * HOUR_MS;

/**
 * The records the domain needs, in display order. SPF is required only when there is no signing record.
 *
 * @param records - The account's records.
 * @return Required records.
 */
export function requiredRecords( records: DnsRecord[] ): DnsRecord[] {
	const hasDkim = records.some( record => record.purpose === 'dkim' );
	return records.filter( record => ! record.optional || ( record.purpose === 'spf' && ! hasDkim ) );
}

/**
 * The provider's display name, or null when we don't know where the domain is managed.
 *
 * @param status - Dashboard status.
 * @return The name, or null.
 */
export function providerName( status: SendStatus ): string | null {
	const slug = providerSlug( status );
	return slug ? getProvider( slug ).name : null;
}

/**
 * Where the domain's DNS is managed: the provider picked during setup, else the one detected.
 *
 * @param status - Dashboard status.
 * @return A named provider's slug, or null when we don't know.
 */
export function providerSlug( status: SendStatus ): string | null {
	const picked = status.onboarding.dns_provider;
	const slug = picked && picked !== UNSURE_SLUG ? picked : status.account?.dns_host?.provider;
	if ( ! slug || slug === OTHER_SLUG || slug === UNSURE_SLUG ) {
		return null;
	}
	return getProvider( slug )?.slug === slug ? slug : null;
}

/**
 * The From line, e.g. `Example Site <owner@example.com>`.
 *
 * @param status - Dashboard status.
 * @return The From line, or '' before setup.
 */
export function fromLine( status: SendStatus ): string {
	if ( ! status.account ) {
		return '';
	}
	return `${ fromName( status ) } <${ fromAddress( status ) }>`;
}

/**
 * The sender name: the one set in Settings, else the site title.
 *
 * @param status - Dashboard status.
 * @return The name.
 */
export function fromName( status: SendStatus ): string {
	return status.settings.from_name.trim() || status.site_title;
}

/**
 * The From address, e.g. `owner@example.com`.
 *
 * @param status - Dashboard status.
 * @return The address, or '' before setup.
 */
export function fromAddress( status: SendStatus ): string {
	if ( ! status.account ) {
		return '';
	}
	return `${ status.settings.from_local_part || 'wordpress' }@${ status.account.domain }`;
}

/**
 * How long the account has been waiting to verify.
 *
 * @param status - Dashboard status.
 * @param now    - Current time in ms.
 * @return Milliseconds since setup, or 0 when unknown.
 */
export function msSinceSetup( status: SendStatus, now: number ): number {
	const started = status.account ? Date.parse( status.account.provisioned_at ) : NaN;
	return isNaN( started ) ? 0 : Math.max( 0, now - started );
}

/**
 * "Last checked …" for a time in the past.
 *
 * @param when - When the last check ran.
 * @param now  - Current time in ms.
 * @return The label.
 */
export function lastCheckedLabel( when: Date, now: number ): string {
	const seconds = Math.max( 0, Math.round( ( now - when.getTime() ) / 1000 ) );
	if ( seconds < 60 ) {
		return __( 'Last checked just now', 'jetpack-send-pkg' );
	}
	const minutes = Math.floor( seconds / 60 );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d: minutes since the last check. */
			_n( 'Last checked %d min ago', 'Last checked %d min ago', minutes, 'jetpack-send-pkg' ),
			minutes
		);
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours < 48 ) {
		return sprintf(
			/* translators: %d: hours since the last check. */
			_n( 'Last checked %d hour ago', 'Last checked %d hours ago', hours, 'jetpack-send-pkg' ),
			hours
		);
	}
	return sprintf(
		/* translators: %s: date of the last check. */
		__( 'Last checked %s', 'jetpack-send-pkg' ),
		dateI18n( 'M j', when )
	);
}
