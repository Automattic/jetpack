/**
 * External dependencies
 */
import { LeaderboardLabel, MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@wordpress/dataviews';

/**
 * A flattened referrer group, source, or domain shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	parentId?: string;
	label: string;
	views: number;
	previousValue?: number;
	link?: string;
	icon?: string;
	hasChildren?: boolean;
};

/**
 * Return a URL only when it parses with an HTTP or HTTPS scheme.
 *
 * @param url - The candidate URL.
 * @return The safe HTTP(S) URL, or null when it is missing, unparseable, or uses another scheme.
 */
function safeHttpUrl( url: string | undefined ): string | null {
	if ( ! url ) {
		return null;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

/**
 * DataViews field config for the Referrers records table.
 *
 * @return The field config.
 */
export function getReferrerFields(): Field< ReferrerRecord >[] {
	return [
		{
			id: 'referrer',
			label: __( 'Referrer', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const labelContent = (
					<LeaderboardLabel
						label={ item.label }
						imageUrl={ item.icon }
						imageAlt=""
						imageFallback="hidden"
						imageClassName={ styles.referrerIcon }
					/>
				);
				const label = item.hasChildren ? (
					<div className={ styles.groupLabel }>{ labelContent }</div>
				) : (
					labelContent
				);
				const safeUrl = safeHttpUrl( item.link );

				// Match the widget's hierarchy: group/source rows represent child
				// collections and are never outbound links; only leaves link away.
				if ( item.hasChildren || ! safeUrl ) {
					return label;
				}

				return (
					<a href={ safeUrl } target="_blank" rel="noopener noreferrer">
						{ label }
					</a>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ item.previousValue }
					dataFormat={ {
						type: 'number',
						options: { decimals: 0, useMultipliers: false },
					} }
					fontSize="md"
				/>
			),
		},
	];
}
