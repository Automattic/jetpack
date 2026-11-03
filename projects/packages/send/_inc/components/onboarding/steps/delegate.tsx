import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink, Stack } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { CopyValueButton } from '../../copy-button';
import { OTHER_SLUG, blankHostLabel, fillAllSteps, formatHost, valueLabel } from '../providers';
import { recordPurposeLabel } from './checklist';
import type { DnsRecord } from '../../../data/types';
import type { Provider } from '../providers';

export type DelegateProps = {
	domain: string;
	provider: Provider;
	records: DnsRecord[];
};

/**
 * The delegate view's title.
 *
 * @param domain - The sending domain.
 * @return The title.
 */
export function delegateTitle( domain: string ): string {
	/* translators: %s: domain name, e.g. example.com. */
	return sprintf( __( 'Send these steps to whoever manages %s', 'jetpack-send-pkg' ), domain );
}

/**
 * Plain-text instructions for someone else: what the records are for, both records, and the steps.
 *
 * @param domain   - The sending domain.
 * @param provider - Where the records go.
 * @param records  - Required records.
 * @return The text.
 */
export function delegateText( domain: string, provider: Provider, records: DnsRecord[] ): string {
	const known = provider.slug !== OTHER_SLUG;
	const lines: string[] = [
		known
			? sprintf(
					/* translators: 1: domain name, 2: provider name, e.g. Cloudflare. */
					__( 'Could you add two records for %1$s at %2$s?', 'jetpack-send-pkg' ),
					domain,
					provider.name
				)
			: sprintf(
					/* translators: %s: domain name, e.g. example.com. */
					__( 'Could you add two records for %s where the domain is managed?', 'jetpack-send-pkg' ),
					domain
				),
		sprintf(
			/* translators: %s: domain name, e.g. example.com. */
			__(
				'They let the website send its emails from %s through Jetpack, so they reach the inbox instead of spam. Nothing else changes.',
				'jetpack-send-pkg'
			),
			domain
		),
	];

	records.forEach( ( record, i ) => {
		const host = formatHost( record, provider );
		lines.push(
			'',
			sprintf(
				/* translators: 1: record number, 1 or 2, 2: what the record does. */
				__( 'Record %1$d: %2$s', 'jetpack-send-pkg' ),
				i + 1,
				recordPurposeLabel( record.purpose, domain )
			),
			`${ provider.fieldLabels.type }: ${ record.type }`,
			`${ provider.fieldLabels.host }: ${ host === '' ? blankHostLabel() : host }`,
			/* translators: %s: full record name, e.g. _mailchannels.example.com. */
			sprintf( __( 'Full name: %s', 'jetpack-send-pkg' ), record.name ),
			`${ valueLabel( record, provider ) }: ${ record.value }`
		);
	} );

	if ( records.length ) {
		lines.push(
			'',
			known
				? /* translators: %s: provider name, e.g. Cloudflare. */
					sprintf( __( 'Steps in %s:', 'jetpack-send-pkg' ), provider.name )
				: __( 'Steps:', 'jetpack-send-pkg' ),
			...fillAllSteps( provider, records, domain ).map( ( step, i ) => `${ i + 1 }. ${ step }` )
		);
	}
	return lines.join( '\n' );
}

const Delegate = ( { domain, provider, records }: DelegateProps ) => {
	const text = delegateText( domain, provider, records );
	const mailto = addQueryArgs( 'mailto:', {
		/* translators: %s: domain name, e.g. example.com. */
		subject: sprintf( __( 'Two records to add for %s', 'jetpack-send-pkg' ), domain ),
		body: text,
	} );

	return (
		<Stack direction="row" gap="sm" wrap="wrap">
			<CopyValueButton
				text={ text }
				label={ __( 'Copy steps', 'jetpack-send-pkg' ) }
				announcement={ __( 'Copied. Paste it into an email or chat.', 'jetpack-send-pkg' ) }
				size="default"
			>
				{ __( 'Copy steps', 'jetpack-send-pkg' ) }
			</CopyValueButton>
			<ButtonLink variant="outline" tone="neutral" href={ mailto }>
				{ __( 'Email steps', 'jetpack-send-pkg' ) }
			</ButtonLink>
		</Stack>
	);
};

export default Delegate;
