import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { SearchableSelectControl } from '@wordpress/ui';
import {
	OTHER_SLUG,
	PROVIDERS,
	UNSURE_SLUG,
	getProvider,
	isNamedProvider,
	matchNameservers,
	nameserverHost,
} from '../../../components/onboarding/providers';
import type { DnsHost, ProviderSlug } from '../../../data/types';
import type { Ref } from 'react';

type Item = { value: ProviderSlug; label: string };

/**
 * The provider detection points to, whatever the user picked since.
 *
 * @param dnsHost - Detection result.
 * @return Slug, or null.
 */
export function detectedProvider( dnsHost: DnsHost | null ): ProviderSlug | null {
	if ( ! dnsHost ) {
		return null;
	}
	if ( dnsHost.provider_source === 'ns' && isNamedProvider( dnsHost.provider ) ) {
		return dnsHost.provider;
	}
	return matchNameservers( dnsHost.nameservers );
}

/**
 * "Your domain points to …" for the first nameserver.
 *
 * @param dnsHost - Detection result.
 * @return The clue, or '' without nameservers.
 */
export function pointsToClue( dnsHost: DnsHost | null ): string {
	const first = dnsHost?.nameservers?.[ 0 ];
	if ( ! first ) {
		return '';
	}
	return sprintf(
		/* translators: %s: the company a domain points to, e.g. example-host.net. */
		__( 'Your domain points to %s. That’s usually the answer.', 'jetpack-send-pkg' ),
		nameserverHost( first )
	);
}

/**
 * The warning shown when the pick doesn't match where the domain points.
 *
 * @param domain   - The sending domain.
 * @param detected - Detected provider slug.
 * @param picked   - Picked provider slug.
 * @return The warning, or '' when they agree.
 */
export function mismatchText(
	domain: string,
	detected: ProviderSlug | null,
	picked: ProviderSlug | null
): string {
	if ( ! detected || ! isNamedProvider( picked ) || picked === detected ) {
		return '';
	}
	return sprintf(
		/* translators: 1: domain name, 2: detected provider, 3: picked provider. */
		__(
			'%1$s points to %2$s. Records added at %3$s won’t work unless %3$s manages %1$s.',
			'jetpack-send-pkg'
		),
		domain,
		getProvider( detected ).name,
		getProvider( picked ).name
	);
}

type Props = {
	domain: string;
	dnsHost: DnsHost | null;
	value: ProviderSlug | null;
	onChange: ( slug: ProviderSlug ) => void;
	inputRef?: Ref< HTMLButtonElement >;
};

/**
 * "Where do you change DNS settings?": every provider by rank, then "It's not listed" and "I'm not sure".
 *
 * @param props          - Component props.
 * @param props.domain   - The sending domain.
 * @param props.dnsHost  - Detection result, for the "Detected" mark.
 * @param props.value    - Selected slug, or null.
 * @param props.onChange - Called with the picked slug.
 * @param props.inputRef - Ref to the control, for moving focus to it.
 * @return The control.
 */
const ProviderSelect = ( { domain, dnsHost, value, onChange, inputRef }: Props ) => {
	const detected = detectedProvider( dnsHost );
	const items = useMemo< Item[] >(
		() => [
			...PROVIDERS.filter( provider => provider.slug !== OTHER_SLUG ).map( provider => ( {
				value: provider.slug,
				label:
					provider.slug === detected
						? sprintf(
								/* translators: %s: provider name, e.g. Cloudflare. */
								__( '%s (Detected)', 'jetpack-send-pkg' ),
								provider.name
							)
						: provider.name,
			} ) ),
			{ value: OTHER_SLUG, label: __( 'It’s not listed', 'jetpack-send-pkg' ) },
			{ value: UNSURE_SLUG, label: __( 'I’m not sure', 'jetpack-send-pkg' ) },
		],
		[ detected ]
	);
	const selected = items.find( item => item.value === value ) ?? null;
	const onValueChange = useCallback(
		( item: Item | null ) => {
			if ( item ) {
				onChange( item.value );
			}
		},
		[ onChange ]
	);

	return (
		<SearchableSelectControl
			ref={ inputRef }
			label={ sprintf(
				/* translators: %s: domain name, e.g. example.com. */
				__( 'Where do you change DNS settings for %s?', 'jetpack-send-pkg' ),
				domain
			) }
			description={ __(
				'It’s often your web host, not always where you bought the domain.',
				'jetpack-send-pkg'
			) }
			items={ items }
			value={ selected }
			onValueChange={ onValueChange }
			searchPlaceholder={ __( 'Search', 'jetpack-send-pkg' ) }
		/>
	);
};

export default ProviderSelect;
