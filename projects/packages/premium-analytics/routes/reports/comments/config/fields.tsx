/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { PostDetailLink } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { CommentsReportTabId } from './tabs';
import type { CommentReportRow } from './use-report-records';
import type { Field } from '@jetpack-premium-analytics/externals';

/**
 * Render the label cell for a Comments report row.
 *
 * @param props               - Component props.
 * @param props.row           - The Comments report row.
 * @param props.originSection - The active Comments report tab.
 * @return The label cell.
 */
function CommentLabel( {
	row,
	originSection,
}: {
	row: CommentReportRow;
	originSection: CommentsReportTabId;
} ) {
	let content = (
		<span title={ row.label } className={ styles.text }>
			{ row.label }
		</span>
	);

	if ( row.postId ) {
		content = (
			<PostDetailLink
				postId={ row.postId }
				report="comments"
				originSection={ originSection }
				title={ row.label }
				className={ styles.text }
			>
				{ row.label }
			</PostDetailLink>
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
 * @param originSection - The active Comments report tab.
 * @return The field config.
 */
export function getCommentsFields(
	originSection: CommentsReportTabId
): Field< CommentReportRow >[] {
	return [
		{
			id: 'label',
			label: __( 'Name', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => <CommentLabel row={ item } originSection={ originSection } />,
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
