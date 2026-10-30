import { __ } from '@wordpress/i18n';
import { CardRow, Stat } from '../../components/card';
import formatNumber from '../../components/format-number';
import type { FirewallBlocks } from './types';

/**
 * A count shortened like "1.2K", with the exact figure on hover.
 *
 * @param props       - Component props.
 * @param props.count - The count, or null when the WAF package isn't loaded.
 * @return The count.
 */
function Count( { count }: { count: number | null } ) {
	if ( typeof count !== 'number' ) {
		return <>—</>;
	}
	return (
		<span title={ formatNumber( count ) }>
			{ formatNumber( count, { notation: 'compact', maximumFractionDigits: 1 } ) }
		</span>
	);
}

/**
 * Blocked requests over the last 30 days and all time.
 *
 * @param props        - Component props.
 * @param props.blocks - The block counts.
 * @return The row.
 */
export default function BlocksSummary( { blocks }: { blocks: FirewallBlocks } ) {
	return (
		<CardRow className="jp-protect-firewall-summary">
			<Stat
				label={ __( 'Last 30 days blocked requests', 'jetpack-protect-pkg' ) }
				value={ <Count count={ blocks.blockedLast30Days } /> }
			/>
			<Stat
				label={ __( 'All-time blocked requests', 'jetpack-protect-pkg' ) }
				value={ <Count count={ blocks.blockedCount } /> }
			/>
		</CardRow>
	);
}
