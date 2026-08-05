/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { CommentReportRow } from './use-report-records';
import type { Field } from '@jetpack-premium-analytics/externals';

/**
 * Render the label cell for a Comments report row.
 *
 * @param root0     - Component props.
 * @param root0.row - The Comments report row.
 * @return The label cell.
 */
function CommentLabel( { row }: { row: CommentReportRow } ) {
	let content = (
		<span title={ row.label } className={ styles.text }>
			{ row.label }
		</span>
	);

	if ( row.postId ) {
		content = (
			<RouteLink
				to="/post/$postId"
				params={ { postId: row.postId } as unknown as never }
				title={ row.label }
				className={ styles.text }
			>
				{ row.label }
			</RouteLink>
		);
	} else if ( row.link ) {
		content = (
			<UiLink
				href={ row.link }
				variant="unstyled"
				openInNewTab
				title={ row.label }
				className={ styles.text }
			>
				{ row.label }
			</UiLink>
		);
	}

	return (
		<span className={ styles.label }>
			{ row.avatarUrl ? <img src={ row.avatarUrl } alt="" className={ styles.avatar } /> : null }
			{ content }
		</span>
	);
}

/**
 * DataViews field config for the Comments records table.
 *
 * @return The field config.
 */
export function getCommentsFields(): Field< CommentReportRow >[] {
	return [
		{
			id: 'label',
			label: __( 'Name', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => <CommentLabel row={ item } />,
		},
		{
			id: 'comments',
			label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.value,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.value, 'number', { decimals: 0, useMultipliers: false } ) }</>
			),
		},
	];
}
