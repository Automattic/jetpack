import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import Countdown from '../../components/countdown';
import { getCheckedCounts } from './labels';
import { getNextCheck, useHasPassed } from './scan-button';
import type { ScanState } from './types';
import type { CSSProperties } from 'react';

const SHIELD_PATH =
	'M61.365 0L0 27.273v40.909C0 106.023 26.182 141.409 61.365 150c35.183-8.591 61.365-43.977 61.365-81.818v-40.91L61.365 0z';

// Twelve particles around the shield, alternating size, colour and reach so the ring looks uneven.
const PARTICLES = Array.from( { length: 12 }, ( _, i ) => {
	const angle = ( i / 12 ) * 2 * Math.PI - Math.PI / 2;
	const reach = 130 + ( i % 3 ) * 20;
	return {
		r: i % 2 ? 9 : 6,
		fill: i % 2 ? '#b8e6bf' : '#069e08',
		style: {
			'--jp-protect-dx': `${ Math.round( Math.cos( angle ) * reach ) }px`,
			'--jp-protect-dy': `${ Math.round( Math.sin( angle ) * reach ) }px`,
		} as CSSProperties,
	};
} );

/**
 * The green shield; right after a scan it pops in and bursts particles.
 *
 * @param props             - Component props.
 * @param props.justScanned - Whether a scan finished while the page was open.
 * @param props.width       - The shield's width in pixels; its height follows.
 * @return The shield.
 */
export const SafeShield = ( {
	justScanned = false,
	width = 80,
}: {
	justScanned?: boolean;
	width?: number;
} ) => (
	<svg
		className={ `jp-protect-safe__shield${ justScanned ? ' is-bursting' : '' }` }
		width={ width }
		height={ Math.round( ( width * 150 ) / 123 ) }
		viewBox="0 0 123 150"
		aria-hidden="true"
		focusable="false"
	>
		{ justScanned &&
			PARTICLES.map( ( { r, fill, style }, i ) => (
				<circle
					key={ i }
					className="jp-protect-safe__particle"
					cx="61.4"
					cy="75"
					r={ r }
					fill={ fill }
					style={ style }
				/>
			) ) }
		<g className="jp-protect-safe__badge">
			<path d={ SHIELD_PATH } fill="#069e08" />
			<path
				className="jp-protect-safe__check"
				d="M27.4 77.744l22.966 22.897 50.387-50.457"
				fill="none"
				stroke="#fff"
				strokeWidth="14"
			/>
		</g>
	</svg>
);

type Props = {
	scan: ScanState;
	justScanned?: boolean;
};

/**
 * Shown in place of the vulnerability list when the last scan found nothing; scans start from the page header.
 *
 * @param props             - Component props.
 * @param props.scan        - The latest report.
 * @param props.justScanned - Whether a scan finished while the page was open.
 * @return The empty state.
 */
export default function SafeState( { scan, justScanned = false }: Props ) {
	const counts = getCheckedCounts( scan );
	// Paid Scan has no daily limit, and the API gives no next-scan time, so only the free check counts down.
	const nextCheck = scan.hasPlan ? null : getNextCheck( scan.lastChecked );
	// No margin, so the countdown gives way as it reaches zero.
	const nextScan = useHasPassed( nextCheck, 0 ) ? null : nextCheck;

	// The free check only compares versions with known vulnerabilities, so it can't call the site safe.
	const copy = scan.hasPlan
		? {
				title: __( 'No threats found', 'jetpack-protect-pkg' ),
				details: sprintf(
					/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
					__( 'No issues were found after scanning %1$s and %2$s.', 'jetpack-protect-pkg' ),
					counts.plugins,
					counts.themes
				),
				next: __( 'Your site is scanned automatically every day.', 'jetpack-protect-pkg' ),
			}
		: {
				title: __( 'No vulnerabilities found', 'jetpack-protect-pkg' ),
				details: sprintf(
					/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
					__(
						'No issues were found after checking %1$s and %2$s for known vulnerabilities.',
						'jetpack-protect-pkg'
					),
					counts.plugins,
					counts.themes
				),
				next: __( 'Vulnerabilities are checked automatically every day.', 'jetpack-protect-pkg' ),
			};

	return (
		<Stack
			className={ `jp-protect-safe${ justScanned ? ' is-celebrating' : '' }` }
			direction="column"
			align="center"
			gap="lg"
		>
			<SafeShield justScanned={ justScanned } width={ 39 } />
			<Stack direction="column" align="center" gap="sm">
				<Text variant="heading-lg" render={ <h3 /> }>
					{ copy.title }
				</Text>
				<Text variant="body-md" className="jp-protect-safe__details">
					{ copy.details }
				</Text>
				{ nextScan ? (
					<Stack direction="row" gap="sm" align="baseline">
						<Text variant="body-md" className="jp-protect-safe__details">
							{ __( 'Next check in:', 'jetpack-protect-pkg' ) }
						</Text>
						<Countdown to={ nextScan } />
					</Stack>
				) : (
					<Text variant="body-md" className="jp-protect-safe__details">
						{ copy.next }
					</Text>
				) }
			</Stack>
		</Stack>
	);
}
