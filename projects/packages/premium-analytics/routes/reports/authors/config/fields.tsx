/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { DrilldownLeafCell } from '@jetpack-premium-analytics/ui';
import {
	MetricWithComparison,
	PostDetailLink,
	getAuthorName,
	type AuthorRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { SyntheticEvent } from 'react';

const DEFAULT_AVATAR_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="%23e5e7eb"/></svg>';
const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * Replace an unavailable author avatar with the neutral fallback.
 *
 * @param event - The avatar image error event.
 */
function handleAvatarError( event: SyntheticEvent< HTMLImageElement > ): void {
	event.currentTarget.src = DEFAULT_AVATAR_URL;
}

/**
 * DataViews field config for the Authors records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getAuthorsFields( withComparison = false ): Field< AuthorRow >[] {
	return [
		{
			id: 'author',
			label: __( 'Author', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => ( item.isGroup ? getAuthorName( item.label ) : item.label ),
			render: ( { item } ) => {
				if ( ! item.isGroup ) {
					return (
						<DrilldownLeafCell groupLabel={ getAuthorName( item.parentName ?? '' ) }>
							<span>
								{ item.postId ? (
									<PostDetailLink postId={ item.postId } report="authors">
										{ item.label }
									</PostDetailLink>
								) : (
									item.label
								) }
							</span>
						</DrilldownLeafCell>
					);
				}

				const name = getAuthorName( item.label );

				return (
					<Stack direction="row" gap="sm" align="center">
						<img
							src={ item.avatarUrl || DEFAULT_AVATAR_URL }
							onError={ handleAvatarError }
							alt={ sprintf(
								/* translators: %s is the author name */
								__( 'Avatar of %s', 'jetpack-premium-analytics-pkg' ),
								name
							) }
							className={ styles.avatar }
						/>
						<span className={ styles.name }>{ name }</span>
					</Stack>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
