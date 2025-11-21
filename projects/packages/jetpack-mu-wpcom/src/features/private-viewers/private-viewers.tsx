import {
	Button,
	Card,
	CardHeader,
	CardBody,
	Icon,
	SnackbarList,
	Spinner,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate, Field, type View } from '@wordpress/dataviews';
import domReady from '@wordpress/dom-ready';
import { __, _x } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import wpcomRequest from 'wpcom-proxy-request';
import { RemoveViewerModal } from './remove-viewer-modal';
import { useViewers, type Viewer } from './use-viewers';

import './private-viewers.scss';

declare global {
	interface Window {
		wpcomPrivateViewers: {
			siteId: number;
			viewerRole: 'follower' | 'subscriber';
			addViewerUrl: string;
		};
	}
}

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
	const [ viewerToRemove, setViewerToRemove ] = useState< Viewer | null >( null );
	const [ notices, setNotices ] = useState< Array< { id: string; content: string } > >( [] );

	const { viewers: allViewers, isLoading, refetch } = useViewers();

	const addNotice = ( id: string, content: string ) => {
		setNotices( current => [ ...current, { id: `${ id }-${ Date.now() }`, content } ] );
	};

	const removeNotice = ( id: string ) => {
		setNotices( current => current.filter( notice => notice.id !== id ) );
	};

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
								: _x(
										'Pending',
										/* dummy context to avoid bad minification */ '',
										'jetpack-mu-wpcom'
								  ) }
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

	const actions = useMemo(
		() => [
			{
				id: 'resend-invite',
				label: __( 'Resend invite', 'jetpack-mu-wpcom' ),
				isEligible: ( viewer: Viewer ) => viewer.status === 'pending',
				callback: async ( [ viewer ]: Viewer[] ) => {
					try {
						await wpcomRequest( {
							path: `/sites/${ window.wpcomPrivateViewers.siteId }/invites/${ viewer.inviteId }/resend`,
							apiVersion: '1.1',
							method: 'POST',
						} );
						addNotice( 'invite-sent', __( 'Invite sent', 'jetpack-mu-wpcom' ) );
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
					} catch ( error ) {
						addNotice( 'invite-error', __( 'Failed to resend invite', 'jetpack-mu-wpcom' ) );
					}
				},
			},
			{
				id: 'remove',
				label: __( 'Remove', 'jetpack-mu-wpcom' ),
				icon: <Icon icon={ trash } />,
				callback: ( [ viewer ]: Viewer[] ) => {
					setViewerToRemove( viewer );
				},
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
				<HStack justify="space-between">
					<VStack spacing={ 1 }>
						<Heading level={ 1 } size="20px" lineHeight="32px" truncate>
							{ __( 'Private Viewers', 'jetpack-mu-wpcom' ) }
						</Heading>
						<Text variant="muted" truncate>
							{ __( 'View and manage who can access your private site.', 'jetpack-mu-wpcom' ) }
						</Text>
					</VStack>
					<Button
						variant="primary"
						__next40pxDefaultSize
						href={ window.wpcomPrivateViewers.addViewerUrl }
					>
						{ __( 'Add viewer', 'jetpack-mu-wpcom' ) }
					</Button>
				</HStack>
			</CardHeader>
			<CardBody className="wpcom-private-viewers-data">
				<DataViews
					data={ viewers }
					fields={ fields }
					view={ view }
					actions={ actions }
					getItemId={ ( item: Viewer ) => item.inviteId }
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
			<RemoveViewerModal
				onClose={ () => setViewerToRemove( null ) }
				viewer={ viewerToRemove }
				siteId={ window.wpcomPrivateViewers.siteId }
				onRemoveSuccess={ refetch }
				addNotice={ addNotice }
			/>
			{ notices.length > 0 &&
				createPortal(
					<SnackbarList
						className="wpcom-private-viewers-notices"
						notices={ notices.map( notice => ( {
							id: notice.id,
							content: notice.content,
							onDismiss: () => removeNotice( notice.id ),
						} ) ) }
						onRemove={ removeNotice }
					/>,
					document.getElementById( 'wpbody' ) || document.body
				) }
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
