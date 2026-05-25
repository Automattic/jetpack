import Gravatar from '@automattic/jetpack-components/gravatar';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Badge, Card, Link, Stack, Text } from '@wordpress/ui';
import * as React from 'react';
import { useLatestResponses } from './hooks/use-latest-responses';
import { getAllResponsesUrl } from './lib/get-all-responses-url';
import { getUrlPath } from './lib/get-url-path';
import styles from './style.module.css';
import type { LatestResponseRow } from './hooks/use-latest-responses';
import type { Field, View } from '@wordpress/dataviews';

const defaultView: View = {
	type: 'table',
	page: 1,
	perPage: 10,
	fields: [ 'from', 'date', 'source' ],
};

const defaultLayouts = {
	table: {
		density: 'compact',
	},
};

/**
 * Styles an element with bold font weight when it represents an unread item.
 *
 * @param element  - The element to style.
 * @param isUnread - Whether the item is unread.
 * @return The styled element.
 */
function styleUnreadValue( element: React.ReactNode, isUnread: boolean ): React.ReactNode {
	if ( ! isUnread ) {
		return element;
	}

	if ( typeof element === 'string' ) {
		return <span style={ { fontWeight: 600 } }>{ element }</span>;
	}

	if ( React.isValidElement( element ) ) {
		return React.cloneElement( element, {
			style: { ...( element.props.style || {} ), fontWeight: 600 },
		} as React.HTMLAttributes< HTMLElement > );
	}

	return <span style={ { fontWeight: 600 } }>{ element }</span>;
}

/**
 * Return a stable id for DataViews row keys.
 *
 * @param item - Response row.
 * @return Stable DataViews item id.
 */
function getLatestResponseItemId( item: LatestResponseRow ): string {
	return item.id;
}

/**
 * Widget body: latest form responses in a compact DataViews table.
 *
 * @return Widget content.
 */
export default function LatestResponsesWidget(): JSX.Element {
	const { data, isLoading } = useLatestResponses();
	const [ view, setView ] = useState< View >( defaultView );
	const dateSettings = getDateSettings();

	const fields = useMemo< Field< LatestResponseRow >[] >(
		() => [
			{
				id: 'from',
				type: 'text',
				label: __( 'From', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ( { item } ) => {
					const displayName = decodeEntities(
						item.author_name ||
							item.author_email ||
							item.author_url ||
							item.ip ||
							__( 'Anonymous', 'jetpack-forms' )
					);
					const showEmail =
						item.author_email && displayName !== decodeEntities( item.author_email );
					const gravatarName = item.author_name
						? decodeEntities( item.author_name )
						: item.author_email?.split( '@' )[ 0 ];
					const defaultImage = gravatarName ? 'initials' : 'mp';

					return (
						<Stack align="center" gap="sm">
							{ item.is_unread && (
								<span
									style={ {
										color: '#d63638',
										fontSize: '8px',
										position: 'absolute',
										marginLeft: '-12px',
									} }
									aria-label={ __( '(Unread form response)', 'jetpack-forms' ) }
								>
									●
								</span>
							) }
							<Gravatar
								email={ item.author_email || item.ip || '' }
								defaultImage={ defaultImage }
								displayName={ gravatarName }
								size={ 32 }
								useHovercard={ false }
							/>
							{ styleUnreadValue(
								<Stack direction="column" gap="2xs">
									<Stack direction="row" align="center" gap="xs">
										<Text variant="body-sm" className={ styles.fromDisplayName }>
											{ displayName }
										</Text>
										{ item.is_test && (
											<Badge intent="none" aria-label={ __( 'Test response', 'jetpack-forms' ) }>
												{ __( 'Test', 'jetpack-forms' ) }
											</Badge>
										) }
									</Stack>
									{ showEmail && (
										<Text variant="body-sm" className={ styles.fromEmail }>
											{ item.author_email }
										</Text>
									) }
								</Stack>,
								!! item.is_unread
							) }
						</Stack>
					);
				},
				getValue: ( { item } ) =>
					item.author_name || item.author_email || item.author_url || item.ip || 'Anonymous',
			},
			{
				id: 'date',
				type: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.date,
				render: ( { item } ) =>
					item.date ? dateI18n( dateSettings.formats.datetime, item.date ) : '—',
			},
			{
				id: 'source',
				type: 'text',
				label: __( 'Source', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ( { item } ) => {
					if ( item.is_test ) {
						const previewLabel = __( 'Form preview', 'jetpack-forms' );
						if ( item.preview_url ) {
							return styleUnreadValue(
								<Link openInNewTab href={ item.preview_url }>
									{ previewLabel }
								</Link>,
								!! item.is_unread
							);
						}
						return styleUnreadValue( previewLabel, !! item.is_unread );
					}
					const source =
						item.entry_title ||
						( item.entry_permalink ? getUrlPath( item.entry_permalink ) : null ) ||
						__( '(no title)', 'jetpack-forms' );
					if ( item.entry_permalink ) {
						return styleUnreadValue(
							<Link openInNewTab href={ item.entry_permalink }>
								{ source }
							</Link>,
							!! item.is_unread
						);
					}
					return styleUnreadValue( source, !! item.is_unread );
				},
				getValue: ( { item } ) => item.source,
			},
		],
		[ dateSettings.formats.datetime ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: data.length,
			totalPages: 1,
		} ),
		[ data.length ]
	);

	const allResponsesUrl = getAllResponsesUrl();

	return (
		<Card.FullBleed className={ styles.container }>
			<Stack direction="column" className={ styles.stack }>
				<DataViews< LatestResponseRow >
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					defaultLayouts={ defaultLayouts }
					paginationInfo={ paginationInfo }
					getItemId={ getLatestResponseItemId }
					isLoading={ isLoading }
				>
					<DataViews.Layout />
				</DataViews>
				<div className={ styles.footer }>
					<Link href={ allResponsesUrl }>{ __( 'All responses', 'jetpack-forms' ) }</Link>
				</div>
			</Stack>
		</Card.FullBleed>
	);
}
