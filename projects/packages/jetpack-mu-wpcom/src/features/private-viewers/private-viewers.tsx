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
import { DataViews, filterSortAndPaginate, Field, type View } from '@wordpress/dataviews';
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
		fields: [ 'username', 'name', 'status' ],
	} );

	const { viewers: allViewers, isLoading } = useViewers();

	const fields = useMemo< Field< Viewer >[] >(
		() => [
			{
				id: 'username',
				type: 'text',
				label: __( 'Username', 'jetpack-mu-wpcom' ),
				enableGlobalSearch: true,
				filterBy: false,
				render: ( { item }: { item: Viewer } ) => (
					<HStack spacing={ 2 } alignment="left">
						<img
							src={ item.avatarURL }
							alt={ item.username }
							className="wpcom-private-viewers-avatar"
						/>
						<span>{ item.username }</span>
					</HStack>
				),
			},
			{
				id: 'name',
				type: 'text',
				label: __( 'Name', 'jetpack-mu-wpcom' ),
				enableGlobalSearch: true,
				filterBy: false,
			},
			{
				id: 'status',
				type: 'text',
				label: __( 'Status', 'jetpack-mu-wpcom' ),
				enableGlobalSearch: false,
				render: ( { item }: { item: Viewer } ) => {
					const isActive = item.status === 'active';
					return (
						<span
							className={ `wpcom-private-viewers-status ${
								item.status === 'active' ? 'is-active' : 'is-pending'
							}` }
						>
							{ isActive
								? __( 'Active', 'jetpack-mu-wpcom' )
								: __( 'Pending', 'jetpack-mu-wpcom' ) }
						</span>
					);
				},
				elements: [
					{ value: 'active', label: __( 'Active', 'jetpack-mu-wpcom' ) },
					{ value: 'pending', label: __( 'Pending', 'jetpack-mu-wpcom' ) },
				],
			},
			{
				id: 'addedBy',
				type: 'text',
				label: __( 'Added by', 'jetpack-mu-wpcom' ),
				filterBy: false,
			},
			{
				id: 'inviteDate',
				type: 'datetime',
				label: __( 'Invite date', 'jetpack-mu-wpcom' ),
				filterBy: false,
			},
			{
				id: 'viewerSince',
				type: 'datetime',
				label: __( 'Viewer since', 'jetpack-mu-wpcom' ),
				filterBy: false,
			},
		],
		[]
	);

	const { data: viewers, paginationInfo } = useMemo(
		() => filterSortAndPaginate( allViewers, view, fields ),
		[ allViewers, view, fields ]
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
					data={ viewers }
					fields={ fields }
					view={ view }
					getItemId={ ( item: Viewer ) => item.id }
					paginationInfo={ paginationInfo }
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
