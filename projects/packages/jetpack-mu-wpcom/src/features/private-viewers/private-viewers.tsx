import {
	Card,
	CardHeader,
	CardBody,
	Spinner,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { DataViews, Field, type View } from '@wordpress/dataviews';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useViewers, type Viewer } from './use-viewers';

import './private-viewers.scss';

/**
 * Renders an empty state message when no viewers are found.
 *
 * @param {object}  props           - Component props.
 * @param {boolean} props.isLoading - Whether the viewers are currently loading.
 * @return {JSX.Element|null} The empty state component or null if loading.
 */
function NoViewers( { isLoading } ) {
	if ( isLoading ) {
		return null;
	}

	return (
		<div className="wpcom-private-viewers-empty">
			<strong>{ __( 'No viewers found.', 'jetpack-mu-wpcom' ) }</strong>
		</div>
	);
}

/**
 * Private Viewers Component
 *
 * @return {JSX.Element} The component to render.
 */
function PrivateViewers() {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		filters: [],
		page: 1,
		perPage: 20,
		fields: [ 'name', 'login' ],
	} );

	const { viewers, totalViewers, isLoading } = useViewers();

	// Client-side pagination: slice the data based on current page.
	const paginatedViewers = useMemo( () => {
		const startIndex = ( view.page - 1 ) * view.perPage;
		const endIndex = view.page * view.perPage;
		return viewers.slice( startIndex, endIndex );
	}, [ viewers, view.page, view.perPage ] );

	const fields = useMemo< Field< Viewer >[] >(
		() => [
			{
				id: 'name',
				label: __( 'Name', 'jetpack-mu-wpcom' ),
				render: ( { item }: { item: Viewer } ) => (
					<HStack spacing={ 2 } alignment="left">
						<img
							src={ item.avatar_URL }
							alt={ item.name }
							className="wpcom-private-viewers-avatar"
						/>
						<span>{ item.name }</span>
					</HStack>
				),
			},
			{
				id: 'login',
				label: __( 'Username', 'jetpack-mu-wpcom' ),
				getValue: ( { item }: { item: Viewer } ) => `@${ item.login }`,
			},
		],
		[]
	);

	return (
		<Card className="wpcom-private-viewers">
			<CardHeader>
				<HStack>
					<VStack spacing={ 1 }>
						<Heading level={ 1 } size="20px" lineHeight="32px" truncate>
							{ __( 'Private Viewers', 'jetpack-mu-wpcom' ) }
						</Heading>
						<Text variant="muted" truncate>
							{ __( 'View and manage who can access your private site.', 'jetpack-mu-wpcom' ) }
						</Text>
					</VStack>
				</HStack>
			</CardHeader>
			<CardBody className="wpcom-private-viewers-data">
				<DataViews
					data={ paginatedViewers }
					fields={ fields }
					view={ view }
					getItemId={ ( item: Viewer ) => item.ID.toString() }
					paginationInfo={ {
						totalItems: totalViewers,
						totalPages: Math.ceil( totalViewers / view.perPage ),
					} }
					onChangeView={ setView }
					defaultLayouts={ { table: {} } }
					empty={ <NoViewers isLoading={ isLoading } /> }
				/>
				{ isLoading && (
					<div className="wpcom-private-viewers-loading">
						<Spinner />
						{ __( 'Loading…', 'jetpack-mu-wpcom' ) }
					</div>
				) }
			</CardBody>
		</Card>
	);
}

domReady( () => {
	const container = document.getElementById( 'wpcom-private-viewers-root' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <PrivateViewers /> );
	}
} );
