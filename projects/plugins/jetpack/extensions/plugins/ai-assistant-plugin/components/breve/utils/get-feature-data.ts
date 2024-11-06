/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import debugFactory from 'debug';
/**
 * Types
 */
import { BreveDispatch, SpellingDictionaryContext } from '../types';

const debug = debugFactory( 'jetpack-ai-breve:fetch-feature-data' );

type GetFeatureDataParams = {
	feature: string;
	language: string;
	lastRequested?: string;
};

const briefData: {
	// feature
	[ key: string ]: {
		// language
		[ key: string ]: {
			loading: boolean;
			failed: boolean;
			verified?: boolean;
			data?: Array< string > | SpellingDictionaryContext;
		};
	};
} = {};

// Clear the local storage for the spelling context's old key. TODO: remove this after a few releases
localStorage.removeItem( 'jetpack-ai-breve-spelling-context-en' );

async function fetchFromServer( {
	feature,
	language,
	lastRequested,
}: GetFeatureDataParams ): Promise< {
	requestTime: string;
	data: Array< string > | SpellingDictionaryContext | null;
} > {
	// Randomize the server to balance the load
	const counter = Math.floor( Math.random() * 3 );
	const url = `https://s${ counter }.wp.com/wp-content/lib/jetpack-ai/breve-dictionaries/${ feature }/${ language }.json`;

	// If we have a lastRequested date, first send a HEAD request to check if the data has been modified
	// The If-Modified-Since header causes a CORS preflight request error, so we need to check manually
	if ( lastRequested ) {
		const headData = await fetch( url, { method: 'HEAD' } );
		const lastModified = headData.headers.get( 'last-modified' );

		if ( ! lastModified ) {
			throw new Error( 'Failed to fetch metadata' );
		}

		if ( new Date( lastRequested ) >= new Date( lastModified ) ) {
			// If the data has not been modified, return null
			return null;
		}
	}

	const requestTime = new Date().toUTCString();
	const data = await fetch( url );

	if ( data.status === 404 ) {
		throw new Error( 'The requested data does not exist' );
	} else if ( data.status !== 200 ) {
		throw new Error( 'Failed to fetch data' );
	}

	return {
		requestTime,
		data: await data.json(),
	};
}

async function fetchFeatureData( { feature, language, lastRequested }: GetFeatureDataParams ) {
	debug( 'Fetching feature data for type: %s. language: %s', feature, language );

	const { setDictionaryLoading } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	briefData[ feature ][ language ].loading = true;

	setDictionaryLoading( feature, true );

	try {
		const fetchedData = await fetchFromServer( { feature, language, lastRequested } );
		briefData[ feature ][ language ].verified = true;

		if ( ! fetchedData ) {
			debug( 'Data not modified', feature, language );
			return;
		}

		const { requestTime, data } = fetchedData;

		debug( 'Loaded data from server', feature, language );

		// Cache the data in memory
		briefData[ feature ][ language ].data = data;

		// Cache the data in local storage
		localStorage.setItem(
			`jetpack-ai-breve-data-${ feature }-${ language }`,
			JSON.stringify( { requestTime, data } )
		);
	} catch ( error ) {
		debug( 'Failed to fetch feature data context', error );
		briefData[ feature ][ language ].failed = true;
	} finally {
		briefData[ feature ][ language ].loading = false;
		setDictionaryLoading( feature, false );
	}
}

export default function getFeatureData( { feature, language }: GetFeatureDataParams ) {
	// Initialize the feature data in memory, if it's not already defined
	briefData[ feature ] = briefData[ feature ] || {};
	briefData[ feature ][ language ] = briefData[ feature ][ language ] || {
		loading: false,
		failed: false,
		verified: false,
	};

	const { loading, failed, data, verified } = briefData[ feature ]?.[ language ] ?? {
		loading: false,
		failed: false,
	};

	// First check if the data is already loaded
	if ( data ) {
		return data;
	}

	if ( loading ) {
		return null;
	}

	// Check if the feature data is already defined in local storage
	const storedData = localStorage.getItem( `jetpack-ai-breve-data-${ feature }-${ language }` );
	let lastRequested: string;

	if ( storedData ) {
		try {
			const { requestTime, data: parsedData } = JSON.parse( storedData );

			// If the data is verified or if requesting failed once, return the data we have. TODO: handle retries
			if ( verified || failed ) {
				debug( 'Loaded data from local storage', feature, language );

				// Cache the data in memory
				briefData[ feature ][ language ].data = parsedData ?? null;
				return parsedData;
			}

			// Set the last requested time to check if the data has been modified
			lastRequested = requestTime;
		} catch ( error ) {
			debug( 'Failed to parse data from local storage', feature, language, error );
			// If we failed to parse the data, remove it from local storage, as it's likely corrupted
			localStorage.removeItem( `jetpack-ai-breve-data-${ feature }-${ language }` );
		}
	}

	// If the request failed once, don't try again. TODO: handle retries
	if ( ! failed ) {
		fetchFeatureData( { feature, language, lastRequested } );
	}

	// Return null if the data is not loaded yet, as the function is synchronous and will be called again
	return null;
}
