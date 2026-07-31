/**
 * External dependencies
 */
import { type StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { type Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import { Link } from '@wordpress/route';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';

/**
 * DataViews field config for the Comments Subscribers records table.
 *
 * Built as a getter so labels resolve after the i18n locale data has loaded,
 * matching the other report-page field definitions.
 *
 * @return The field config.
 */
export function getCommentFollowersFields(): Field< StatsCommentFollowersItem >[] {
	return [
		{
			id: 'post',
			label: __( 'Post', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				// Posts with an ID drill into the post detail page, which carries its
				// own link out to the live post. Rows without one (the endpoint omits
				// the ID for some entries) keep the external link as the fallback.
				if ( item.id ) {
					return (
						<Link to="/post/$postId" params={ { postId: String( item.id ) } as unknown as never }>
							{ item.label }
						</Link>
					);
				}

				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return <>{ item.label }</>;
				}

				return (
					<a className={ styles.postLink } href={ href } target="_blank" rel="noopener noreferrer">
						{ item.label }
						{ item.labelIcon === 'external' ? (
							<Icon className={ styles.externalIcon } icon={ external } size={ 16 } />
						) : null }
					</a>
				);
			},
		},
		{
			id: 'subscribers',
			label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.followers,
			render: ( { item } ) => (
				<>
					{ formatMetricValue( item.followers, 'number', {
						decimals: 0,
						useMultipliers: false,
					} ) }
				</>
			),
		},
	];
}
