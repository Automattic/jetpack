import { siteScanQuery } from '@automattic/jetpack-scan-page/src/js/data/query-options';
import { useQuery } from '@tanstack/react-query';
import { Button, Spinner } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { modulesQuery, readScan } from './data';
import type { ProtectTab } from './index';
import type { FC, ReactNode } from 'react';

type Tone = 'safe' | 'warning' | 'danger';

const SHIELD_COLORS: Record< Tone, string > = {
	safe: '#069e08',
	warning: '#dba617',
	danger: '#d63638',
};

/**
 * Shield with a check mark (safe) or an exclamation mark.
 *
 * @param props      - Component props.
 * @param props.tone - Which state the shield shows.
 * @return The icon.
 */
const Shield: FC< { tone: Tone } > = ( { tone } ) => (
	<svg className="jp-protect-status__shield" viewBox="0 0 48 56" aria-hidden="true">
		<path
			fill={ SHIELD_COLORS[ tone ] }
			d="M24 0 48 9v17c0 15.2-10.2 26.2-24 30C10.2 52.2 0 41.2 0 26V9L24 0Z"
		/>
		{ tone === 'safe' ? (
			<path
				fill="none"
				stroke="#fff"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m13 28 8 8 15-16"
			/>
		) : (
			<>
				<path stroke="#fff" strokeWidth="5" strokeLinecap="round" d="M24 14v16" />
				<circle fill="#fff" cx="24" cy="39" r="3" />
			</>
		) }
	</svg>
);

/**
 * "3 hours ago" style text for an ISO date.
 *
 * @param iso - The date.
 * @return Relative time.
 */
export function timeAgo( iso: string ): string {
	const seconds = ( new Date( iso ).getTime() - Date.now() ) / 1000;
	const units: [ Intl.RelativeTimeFormatUnit, number ][] = [
		[ 'year', 31536000 ],
		[ 'month', 2592000 ],
		[ 'day', 86400 ],
		[ 'hour', 3600 ],
		[ 'minute', 60 ],
	];
	if ( Math.abs( seconds ) < 60 ) {
		return __( 'just now', 'jetpack' );
	}
	const format = new Intl.RelativeTimeFormat( undefined, { numeric: 'auto' } );
	for ( const [ unit, size ] of units ) {
		if ( Math.abs( seconds ) >= size ) {
			return format.format( Math.round( seconds / size ), unit );
		}
	}
	return format.format( Math.round( seconds / 60 ), 'minute' );
}

type Props = {
	onNavigate?: ( tab: ProtectTab ) => void;
};

/**
 * Answers "is my site safe?" from the scan result, or from the protections when there's no Scan.
 *
 * @param props            - Component props.
 * @param props.onNavigate - Switches the dashboard tab.
 * @return The status panel.
 */
const SiteStatus: FC< Props > = ( { onNavigate } ) => {
	const scan = useQuery( { ...siteScanQuery(), retry: false } );
	const { data: modules } = useQuery( modulesQuery() );
	const reviewThreats = useCallback( () => onNavigate?.( 'scanner' ), [ onNavigate ] );

	if ( scan.isLoading || ! modules ) {
		return (
			<section className="jp-protect-status">
				<Spinner />
			</section>
		);
	}

	const data = scan.data;
	const hasScan = ! scan.isError && !! data && data.state !== 'unavailable';
	const threats = data?.threats?.length ?? 0;
	const { lastScan, scanning, progress } = readScan( data );

	let tone: Tone;
	let title: string;
	let body: ReactNode;
	let action: ReactNode = null;

	if ( hasScan && scanning ) {
		tone = 'safe';
		title = __( 'Scanning your site…', 'jetpack' );
		body = sprintf(
			/* translators: %d is the scan progress percentage. */
			__( 'Jetpack is checking your plugins, themes and files. %d%% done.', 'jetpack' ),
			progress
		);
	} else if ( hasScan && threats > 0 ) {
		tone = 'danger';
		title = __( 'Your site needs attention', 'jetpack' );
		body = sprintf(
			/* translators: %d is the number of active threats. */
			_n(
				'Jetpack found %d threat on your site. Review it to keep your site safe.',
				'Jetpack found %d threats on your site. Review them to keep your site safe.',
				threats,
				'jetpack'
			),
			threats
		);
		if ( onNavigate ) {
			action = (
				<Button variant="secondary" onClick={ reviewThreats }>
					{ __( 'Review threats', 'jetpack' ) }
				</Button>
			);
		}
	} else if ( hasScan ) {
		tone = 'safe';
		title = __( 'Don’t worry about a thing', 'jetpack' );
		body = lastScan
			? createInterpolateElement(
					sprintf(
						/* translators: %s is a relative time, e.g. "19 hours ago". */
						__(
							'The last Jetpack scan ran <strong>%s</strong> and everything looked great. Jetpack will scan your site again later today.',
							'jetpack'
						),
						timeAgo( lastScan )
					),
					{ strong: <strong /> }
				)
			: __( 'Jetpack will run its first scan of your site shortly.', 'jetpack' );
	} else {
		// No Scan: answer from the protections that are on.
		const firewall = !! modules.waf?.activated;
		const bruteForce = !! modules.protect?.activated;
		tone = firewall && bruteForce ? 'safe' : 'warning';
		title =
			tone === 'safe'
				? __( 'Your site is protected from attacks', 'jetpack' )
				: __( 'Your site is only partly protected', 'jetpack' );
		body =
			tone === 'safe'
				? __(
						'The firewall and brute force protection are on. Add Scan to also check your plugins, themes and files for malware every day.',
						'jetpack'
					)
				: __(
						'Turn on the firewall and brute force protection below to block attacks. Add Scan to check for malware every day.',
						'jetpack'
					);
	}

	return (
		<section className={ `jp-protect-status is-${ tone }` }>
			<Shield tone={ tone } />
			<div className="jp-protect-status__content">
				<h2 className="jp-protect-status__title">{ title }</h2>
				<p className="jp-protect-status__body">{ body }</p>
				{ action }
			</div>
		</section>
	);
};

export default SiteStatus;
