/**
 * External dependencies
 */
import { LeaderboardLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { AuthorRow } from './aggregate';
import type { Field } from '@wordpress/dataviews';

const UNTRACKED_AUTHORS_SENTINEL = 'Untracked Authors';

/**
 * Resolve the author name shown and searched in the table.
 *
 * @param author - The aggregate author row.
 * @return The localized author display name.
 */
function getAuthorName( author: AuthorRow ): string {
	if ( ! author.name || author.name === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics' );
	}

	return author.name;
}

/**
 * DataViews field config for the Authors records table.
 *
 * @return The field config.
 */
export function getAuthorsFields(): Field< AuthorRow >[] {
	return [
		{
			id: 'author',
			label: __( 'Author', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getAuthorName( item ),
			render: ( { item } ) => {
				const name = getAuthorName( item );

				return (
					<LeaderboardLabel
						label={ name }
						imageUrl={ item.avatarUrl ?? undefined }
						imageAlt={ sprintf(
							/* translators: %s is the author name */
							__( 'Avatar of %s', 'jetpack-premium-analytics' ),
							name
						) }
						imageClassName={ styles.avatar }
					/>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}
