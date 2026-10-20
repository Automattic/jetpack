import { __ } from '@wordpress/i18n';
import { backup, bug, tool } from '@wordpress/icons';
import FeatureUpsell from '../../components/feature-upsell';
import { loadRotation, nextRotation, saveRotation } from './upsell-rotation';

type Copy = {
	heading: string;
	/** Malware scanning, one-click fixes and scan history, in that order. */
	features: [ string, string ][];
};

const ICONS = [ bug, tool, backup ];

// Keyed by the variant PHP assigns; Tracks reports clicks per key, so don't renumber.
const VARIANTS: Record< number, () => Copy > = {
	1: () => ( {
		heading: __( 'Get the rest of your site’s protection', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Find malware', 'jetpack-protect-pkg' ),
				__(
					'Every file on your site is checked daily, not just your plugin versions.',
					'jetpack-protect-pkg'
				),
			],
			[
				__( 'Fix it in one click', 'jetpack-protect-pkg' ),
				__(
					'Most threats are cleaned up for you, no code or developer needed.',
					'jetpack-protect-pkg'
				),
			],
			[
				__( 'Know what happened', 'jetpack-protect-pkg' ),
				__( 'See every threat that was found, fixed or ignored.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	2: () => ( {
		heading: __( 'Spend less time worrying about your site', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Malware scanning', 'jetpack-protect-pkg' ),
				__( 'We check every file each day, so you don’t have to.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'One-click fixes', 'jetpack-protect-pkg' ),
				__( 'Fix most threats in seconds instead of an afternoon.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Scan history', 'jetpack-protect-pkg' ),
				__( 'Answer “what happened?” without digging through files.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	3: () => ( {
		heading: __(
			'The free check only looks at your plugin and theme versions',
			'jetpack-protect-pkg'
		),
		features: [
			[
				__( 'Check every file', 'jetpack-protect-pkg' ),
				__( 'Find malicious code that a version check can’t see.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Fix threats for you', 'jetpack-protect-pkg' ),
				__( 'Most issues are cleaned up in one click.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Keep a record', 'jetpack-protect-pkg' ),
				__( 'A history of every threat and what was done about it.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	4: () => ( {
		heading: __( 'Stop problems before your visitors see them', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Spot malware early', 'jetpack-protect-pkg' ),
				__(
					'Hidden code can send spam or redirect visitors. Catch it each day.',
					'jetpack-protect-pkg'
				),
			],
			[
				__( 'Fix it fast', 'jetpack-protect-pkg' ),
				__( 'Clean most threats in one click and get back to work.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'See the full story', 'jetpack-protect-pkg' ),
				__(
					'A history of what was found and fixed, for you or your developer.',
					'jetpack-protect-pkg'
				),
			],
		],
	} ),
	5: () => ( {
		heading: __( 'Upgrade to Scan for complete protection', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Malware scanning', 'jetpack-protect-pkg' ),
				__( 'Every file, every day.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'One-click fixes', 'jetpack-protect-pkg' ),
				__( 'Most threats, fixed for you.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Scan history', 'jetpack-protect-pkg' ),
				__( 'Everything found and fixed.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	6: () => ( {
		heading: __( 'Questions only Scan can answer', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Is my site infected?', 'jetpack-protect-pkg' ),
				__( 'Scan checks every file for malware, every day.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Can I fix it myself?', 'jetpack-protect-pkg' ),
				__( 'Yes, most threats are fixed in one click.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'What happened before?', 'jetpack-protect-pkg' ),
				__( 'Your scan history shows every threat and fix.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	7: () => ( {
		heading: __(
			'You’re checking your plugins. Now protect everything else.',
			'jetpack-protect-pkg'
		),
		features: [
			[
				__( 'Your files too', 'jetpack-protect-pkg' ),
				__(
					'Scan finds malware in any file, including ones you didn’t add.',
					'jetpack-protect-pkg'
				),
			],
			[
				__( 'Fixes, not just alerts', 'jetpack-protect-pkg' ),
				__( 'Most threats come with a one-click fix.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'A record you can trust', 'jetpack-protect-pkg' ),
				__( 'See what was found, when, and how it was resolved.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
	8: () => ( {
		heading: __( 'Know your site is clean, not just up to date', 'jetpack-protect-pkg' ),
		features: [
			[
				__( 'Daily malware checks', 'jetpack-protect-pkg' ),
				__( 'Scan reads every file so nothing hides in your site.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Fixes when you need them', 'jetpack-protect-pkg' ),
				__( 'One click cleans up most threats.', 'jetpack-protect-pkg' ),
			],
			[
				__( 'Proof it’s handled', 'jetpack-protect-pkg' ),
				__( 'Your history shows each threat was dealt with.', 'jetpack-protect-pkg' ),
			],
		],
	} ),
};

const COUNT = Object.keys( VARIANTS ).length;

type Props = {
	variant?: number;
	/** Show `variant` as is, without rotating, for previews. */
	forced?: boolean;
	url: string;
};

// Picked once per page load, so returning to the tab keeps the copy and doesn't touch storage.
const picked = new Map< string, { variant: number; exposure: number } >();

/**
 * Pick this browser's copy for today, and save it.
 *
 * @param start  - The site's assigned variant.
 * @param forced - Whether to show `start` without rotating.
 * @return The variant and how many this browser has seen in the current cycle.
 */
function pickVariant( start: number, forced: boolean ) {
	const cacheKey = `${ start }:${ forced }`;
	let result = picked.get( cacheKey );
	if ( ! result ) {
		if ( forced ) {
			result = { variant: start, exposure: 0 };
		} else {
			const stored = loadRotation( COUNT );
			const rotation = nextRotation( stored, start, COUNT, Date.now() );
			if ( rotation !== stored ) {
				saveRotation( rotation );
			}
			result = { variant: rotation.variant, exposure: rotation.seen.length };
		}
		picked.set( cacheKey, result );
	}
	return result;
}

/**
 * The free plan's Scan upsell: what Scan adds, in the copy this site was assigned.
 *
 * @param props         - Component props.
 * @param props.variant - The site's assigned copy, where this browser's rotation starts.
 * @param props.forced  - Show `variant` as is, for previews.
 * @param props.url     - Where to buy Scan.
 * @return The card row.
 */
export default function ScanUpsell( { variant = 1, forced = false, url }: Props ) {
	const { variant: key, exposure } = pickVariant( VARIANTS[ variant ] ? variant : 1, forced );
	const copy = VARIANTS[ key ]();

	return (
		<FeatureUpsell
			heading={ copy.heading }
			features={ copy.features.map( ( [ title, description ], i ) => [
				ICONS[ i ],
				title,
				description,
			] ) }
			url={ url }
			event="jetpack_protect_dashboard_scan_upsell"
			eventProps={ { variant: key, exposure } }
		/>
	);
}
