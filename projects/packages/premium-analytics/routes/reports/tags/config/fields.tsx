/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import { category, tag as tagGlyph } from '@wordpress/icons';
import { Icon, Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { StatsTagsItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

const rowGlyph = ( labelIcon: string ) => ( labelIcon === 'folder' ? category : tagGlyph );

/**
 * Render the label cell for a Tags report row.
 *
 * @param root0      - Component props.
 * @param root0.item - The Tags report item.
 * @return The label cell.
 */
function TagLabel( { item }: { item: StatsTagsItem } ) {
	const labelIcon = item.label[ 0 ]?.labelIcon ?? '';
	const href = safeHttpUrl( item.link );

	return (
		<span className={ styles.tagLabel }>
			<Icon icon={ rowGlyph( labelIcon ) } size={ 20 } className={ styles.tagIcon } />
			{ href ? (
				<Link
					href={ href }
					variant="unstyled"
					openInNewTab
					title={ item.labelText }
					className={ styles.tagText }
				>
					{ item.labelText }
				</Link>
			) : (
				<span title={ item.labelText } className={ styles.tagText }>
					{ item.labelText }
				</span>
			) }
		</span>
	);
}

/**
 * DataViews field config for the Tags & categories records table.
 *
 * @return The field config.
 */
export function getTagsFields(): Field< StatsTagsItem >[] {
	return [
		{
			id: 'label',
			label: __( 'Tag or category', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.labelText,
			render: ( { item } ) => <TagLabel item={ item } />,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.value,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.value, 'number', { decimals: 0, useMultipliers: false } ) }</>
			),
		},
	];
}
