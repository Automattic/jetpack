/**
 * External dependencies
 */
import { type StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import { type Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
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
			label: __( 'Post', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				if ( ! item.link ) {
					return <>{ item.label }</>;
				}

				return (
					<a
						className={ styles.postLink }
						href={ item.link }
						target="_blank"
						rel="noopener noreferrer"
					>
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
			label: __( 'Subscribers', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.followers,
			render: ( { item } ) => <>{ item.followers.toLocaleString() }</>,
		},
	];
}
