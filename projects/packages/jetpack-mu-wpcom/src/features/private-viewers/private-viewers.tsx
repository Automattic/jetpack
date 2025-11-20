import {
	Card,
	CardHeader,
	CardMedia,
	Spinner,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { DataViews, Field, type View } from '@wordpress/dataviews';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import wpcomRequest from 'wpcom-proxy-request';

import './private-viewers.scss';

type Viewer = {
	ID: number;
	login: string;
	email: boolean | string;
	name: string;
	first_name: string;
	last_name: string;
	nice_name: string;
	URL: string;
	avatar_URL: string;
	profile_URL: string;
	ip_address: boolean | string;
};

declare global {
	interface Window {
		wpcomPrivateViewers: {
			siteId: number;
		};
	}
}

const useViewers = ( page: number, perPage: number ) => {
	const [ viewers, setViewers ] = useState< Viewer[] >( [] );
	const [ totalViewers, setTotalViewers ] = useState< number >( 0 );
	const [ isLoading, setIsLoading ] = useState< boolean >( false );

	const fetchViewers = useCallback( async ( currentPage: number, itemsPerPage: number ) => {
		setIsLoading( true );
		try {
			const path = addQueryArgs( `/sites/${ window.wpcomPrivateViewers.siteId }/viewers`, {
				page: currentPage,
				number: itemsPerPage,
			} );
			const response: { viewers: Viewer[]; found: number } = await wpcomRequest( {
				path,
				apiVersion: '1.1',
			} );
			setViewers( response.viewers );
			setTotalViewers( response.found );
		} finally {
			setIsLoading( false );
		}
	}, [] );

	useEffect( () => {
		fetchViewers( page, perPage );
	}, [ fetchViewers, page, perPage ] );

	return {
		viewers,
		totalViewers,
		isLoading,
	};
};

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
		fields: [ 'nice_name', 'login' ],
	} );

	const { viewers, totalViewers, isLoading } = useViewers( view.page, view.perPage );

	const fields = useMemo< Field< Viewer >[] >(
		() => [
			{
				id: 'nice_name',
				label: __( 'Name', 'jetpack-mu-wpcom' ),
				enableSorting: false,
			},
			{
				id: 'login',
				label: __( 'Login', 'jetpack-mu-wpcom' ),
				enableSorting: false,
			},
		],
		[]
	);

	return (
		<Card className="wpcom-private-viewers">
			<DataViews
				data={ viewers }
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
			>
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
						<DataViews.ViewConfig />
					</HStack>
				</CardHeader>
				<CardMedia className="wpcom-private-viewers-data">
					<DataViews.Layout />
					<DataViews.Footer />
					{ isLoading && (
						<div
							className={
								'wpcom-private-viewers-loading ' + ( viewers.length > 0 ? 'is-overlay' : '' )
							}
						>
							<Spinner />
							{ __( 'Loading…', 'jetpack-mu-wpcom' ) }
						</div>
					) }
				</CardMedia>
			</DataViews>
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
