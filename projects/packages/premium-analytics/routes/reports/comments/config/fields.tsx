/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { CommentReportRow } from './use-report-records';
import type { Field } from '@wordpress/dataviews';

/**
 * Render the label cell for a Comments report row.
 *
 * @param root0     - Component props.
 * @param root0.row - The Comments report row.
 * @return The label cell.
 */
function CommentLabel( { row }: { row: CommentReportRow } ) {
	return (
		<span className={ styles.label }>
			{ row.avatarUrl ? <img src={ row.avatarUrl } alt="" className={ styles.avatar } /> : null }
			{ row.link ? (
				<Link
					href={ row.link }
					variant="unstyled"
					openInNewTab
					title={ row.label }
					className={ styles.text }
				>
					{ row.label }
				</Link>
			) : (
				<span title={ row.label } className={ styles.text }>
					{ row.label }
				</span>
			) }
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
			label: __( 'Name', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => <CommentLabel row={ item } />,
		},
		{
			id: 'comments',
			label: __( 'Comments', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.value,
			render: ( { item } ) => <>{ item.value.toLocaleString() }</>,
		},
	];
}
