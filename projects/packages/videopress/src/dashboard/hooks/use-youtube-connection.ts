import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

// Root query-key segment shared by every Studio import query (connection,
// uploads listing, import jobs). Lives here because the connection is the
// root of the import feature; the other import hooks import it.
export const IMPORT_QUERY_KEY = 'jetpack-videopress-import' as const;

// Second query-key segment for the connection query
// ([ IMPORT_QUERY_KEY, CONNECTION_QUERY_SEGMENT ]).
export const CONNECTION_QUERY_SEGMENT = 'connection' as const;

/** Milliseconds between connection re-fetches while a connect popup is open. */
export const CONNECTION_POLL_INTERVAL_MS = 2000;

const CONNECTION_PATH = '/jetpack/v4/videopress/import/youtube/connection';

type ApiConnection = {
	connected?: boolean;
	account_name?: string;
	profile_image?: string;
	connect_url?: string | null;
};

export type YouTubeConnection = {
	connected: boolean;
	accountName: string;
	profileImage: string;
	/** OAuth URL to open in a popup when disconnected; null while connected. */
	connectUrl: string | null;
};

/**
 * Fetch the connected YouTube identity and normalize it to camelCase.
 *
 * @return The normalized connection state.
 */
async function fetchConnection(): Promise< YouTubeConnection > {
	const raw = await apiFetch< ApiConnection >( { path: CONNECTION_PATH } );
	return {
		connected: Boolean( raw?.connected ),
		accountName: raw?.account_name ?? '',
		profileImage: raw?.profile_image ?? '',
		connectUrl: raw?.connect_url ?? null,
	};
}

/**
 * Fetch and cache the YouTube connection state, plus a disconnect mutation.
 *
 * While the caller has an OAuth connect popup open it should pass
 * `polling: true` so the query re-fetches every 2s and the UI flips to
 * "connected" as soon as the popup flow completes. Leave it false otherwise —
 * the connection changes rarely and polling it permanently would be noise.
 *
 * @param options         - Hook options.
 * @param options.polling - Re-fetch every 2s while true (connect popup open).
 * @return Connection state, query status, and a disconnect mutation.
 */
export function useYouTubeConnection( options: { polling?: boolean } = {} ) {
	const client = useQueryClient();

	const query = useQuery< YouTubeConnection >( {
		queryKey: [ IMPORT_QUERY_KEY, CONNECTION_QUERY_SEGMENT ],
		queryFn: fetchConnection,
		refetchInterval: options.polling ? CONNECTION_POLL_INTERVAL_MS : false,
	} );

	const disconnect = useMutation< void, Error, void >( {
		mutationFn: async () => {
			await apiFetch( { path: CONNECTION_PATH, method: 'DELETE' } );
		},
		onSuccess: () => {
			// Disconnecting stales everything downstream of the connection
			// (the uploads listing included), so invalidate the whole import
			// branch rather than just the connection query.
			client.invalidateQueries( { queryKey: [ IMPORT_QUERY_KEY ] } );
		},
	} );

	return {
		connection: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		disconnect: disconnect.mutateAsync,
		isDisconnecting: disconnect.isPending,
		disconnectError: disconnect.error,
	};
}
