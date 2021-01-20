/**
 * External dependencies
 */
import { map, debounce, omit, find } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isURL, prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { makeCancellable } from '../utils';
import { PODCAST_FEED } from '../constants';
import { fetchPodcastFeed } from '../api';

function EpisodeSelector( { feedUrl, onSelected, episodeDetails } ) {
	const [ episodeCache, setEpisodeCache ] = useState( {} );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const [ fieldValue, setFieldValue ] = useState();
	const currentUrl = useRef( feedUrl );

	const cancellableFetch = useRef();

	// Let's keep a cache of all the episodes we've seen so the filter options doesn't change too much.
	const updateEpisodeCache = episodes => {
		const episodesMap = episodes.reduce(
			( obj, episode ) => ( { ...obj, [ episode.guid ]: episode } ),
			{}
		);
		setEpisodeCache( cache => ( { ...cache, ...episodesMap } ) );
	};

	const fetchEpisodes = useCallback(
		debounce( ( url, query ) => {
			cancellableFetch.current?.cancel();
			setIsLoading( true );
			cancellableFetch.current = makeCancellable( fetchPodcastFeed( { url, query } ) );
			cancellableFetch.current.promise.then(
				response => {
					setIsLoading( false );
					if (
						response?.isCanceled ||
						response?.type !== PODCAST_FEED ||
						! response?.data.tracks
					) {
						return;
					}
					// Update the episode cache with the returned episodes, which will cause the options be to be updated.
					updateEpisodeCache( response.data.tracks );
				},
				error => {
					setIsLoading( false );
					if ( error?.isCanceled ) {
						return;
					}
					//TODO: Sort out the error messaging
				}
			);
		}, 300 ),
		[]
	);

	const onChange = selectedGuid => {
		if ( ! selectedGuid ) {
			onSelected && onSelected( undefined );
			return;
		}
		const selectedEpisode = omit( find( options, [ 'guid', selectedGuid ] ), [ 'label', 'value' ] );
		if ( selectedEpisode ) {
			onSelected && onSelected( selectedEpisode );
		}
	};

	const reset = useCallback(
		debounce( () => {
			setEpisodeCache( () => {} );
			onChange( null );
		}, 300 ),
		[]
	);

	// Reset when the feed URL changes.
	useEffect( () => {
		if ( currentUrl.current !== feedUrl ) {
			reset();
			currentUrl.current = feedUrl;
		}
	}, [ feedUrl, reset ] );

	// Make sure we have the selected episode details in the cache and in the filter options.
	// They may have been passed in and not (yet) come back from the API.
	useEffect( () => {
		if ( ! episodeDetails?.guid ) {
			return;
		}
		updateEpisodeCache( [ episodeDetails ] );
	}, [ episodeDetails ] );

	useEffect( () => {
		const newOptions = map( episodeCache, episode => ( {
			...episode,
			label: episode.title,
			value: episode.guid,
		} ) );
		setOptions( newOptions );
	}, [ episodeCache ] );

	useEffect( () => {
		const prependedURL = prependHTTP( feedUrl );

		if ( isURL( prependedURL ) ) {
			fetchEpisodes( prependedURL, fieldValue );
		}
		return () => {
			cancellableFetch.current?.cancel();
		};
	}, [ feedUrl, fieldValue, fetchEpisodes ] );

	return (
		<ComboboxControl
			className={ classnames( 'episode-selector', { 'is-loading': isLoading } ) }
			label={ __( 'Select an episode (optional)', 'jetpack' ) }
			value={ episodeDetails?.guid }
			onChange={ onChange }
			options={ options }
			onFilterValueChange={ setFieldValue }
		/>
	);
}

export default props => ( undefined === ComboboxControl ? null : <EpisodeSelector { ...props } /> );
