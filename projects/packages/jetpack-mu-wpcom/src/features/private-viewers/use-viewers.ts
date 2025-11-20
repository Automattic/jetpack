import { addQueryArgs } from '@wordpress/url';
import { useCallback, useEffect, useState } from 'react';
import wpcomRequest from 'wpcom-proxy-request';

type User = {
	login: string;
	email: boolean | string;
	name: string;
	avatar_URL: string;
};

type Invite = {
	invite_key: string;
	role: string;
	user: User;
	is_pending: boolean;
	invite_date: string;
	accepted_date: string | null;
	invited_by: User;
};

export type Viewer = {
	id: string;
	status: 'active' | 'pending';
	name: string;
	username: string;
	addedBy: string;
	inviteDate: Date;
	viewerSince: Date;
	avatarURL: string;
};

declare global {
	interface Window {
		wpcomPrivateViewers: {
			siteId: number;
		};
	}
}

const mapInviteToViewer = ( invite: Invite ): Viewer => {
	let username;
	if ( invite.user.login ) {
		username = invite.user.login;
	} else if ( invite.user.email ) {
		username = invite.user.email;
	} else {
		username = '';
	}

	return {
		id: invite.invite_key,
		status: invite.is_pending ? 'pending' : 'active',
		name: invite.user.name,
		username,
		addedBy:
			invite.invited_by.name === invite.invited_by.login
				? invite.invited_by.login
				: `${ invite.invited_by.name } (${ invite.invited_by.login })`,
		inviteDate: new Date( invite.invite_date ),
		viewerSince: invite.accepted_date ? new Date( invite.accepted_date ) : null,
		avatarURL: invite.user.avatar_URL,
	};
};

const fetchViewers = async () => {
	const viewers: Viewer[] = [];
	const batchSize = 100;

	// Helper function to fetch a single batch of invites.
	const fetchInvitesBatch = async ( offset: number ) => {
		const path = addQueryArgs( `/sites/${ window.wpcomPrivateViewers.siteId }/invites`, {
			offset,
			number: batchSize,
			status: 'all',
			role: 'follower',
		} );
		return await wpcomRequest< { invites: Invite[]; found: number } >( {
			path,
			apiVersion: '1',
		} );
	};

	// Fetch first page to get total count.
	const firstResponse = await fetchInvitesBatch( 0 );
	viewers.push( ...firstResponse.invites.map( mapInviteToViewer ) );

	// Calculate total pages and fetch remaining.
	const totalPages = Math.ceil( firstResponse.found / batchSize );
	for ( let page = 2; page <= totalPages; page++ ) {
		const response = await fetchInvitesBatch( ( page - 1 ) * batchSize );
		viewers.push( ...response.invites.map( mapInviteToViewer ) );
	}

	return viewers;
};

/**
 * Hook to fetch and manage private site viewers.
 *
 * The API endpoint does not support sorting and searching, so it fetches all viewers from the API
 * (in batches of 100) and then lets the client paginate, sort, and filter the results.
 *
 * @return {object} Object containing viewers array, total count, and loading state.
 */
export const useViewers = () => {
	const [ viewers, setViewers ] = useState< Viewer[] >( [] );
	const [ isLoading, setIsLoading ] = useState< boolean >( false );

	const fetchAllViewers = useCallback( async () => {
		setIsLoading( true );
		try {
			setViewers( await fetchViewers() );
		} finally {
			setIsLoading( false );
		}
	}, [] );

	useEffect( () => {
		fetchAllViewers();
	}, [ fetchAllViewers ] );

	return {
		viewers,
		isLoading,
	};
};
