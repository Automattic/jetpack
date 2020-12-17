/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useCallback, useState, useEffect } from '@wordpress/element';
import { TextControl, Button } from '@wordpress/components';
import { sample } from 'lodash';

/**
 * Internal dependencies
 */
import { SOURCE_PEXELS, PEXELS_EXAMPLE_QUERIES } from '../constants';
import withMedia from './with-media';
import MediaBrowser from '../media-browser';
import { getApiUrl } from './api';

function PexelsMedia( props ) {
	const { media, isCopying, isLoading, pageHandle, multiple, copyMedia, getMedia } = props;

	const [ searchQuery, setSearchQuery ] = useState( sample( PEXELS_EXAMPLE_QUERIES ) );
	const [ lastSearchQuery, setLastSearchQuery ] = useState( '' );

	const onCopy = useCallback(
		items => {
			copyMedia( items, getApiUrl( 'copy', SOURCE_PEXELS ), SOURCE_PEXELS );
		},
		[ copyMedia ]
	);

	const getNextPage = useCallback(
		( event, reset = false ) => {
			if ( searchQuery ) {
				getMedia(
					getApiUrl( 'list', SOURCE_PEXELS, {
						number: 20,
						path: 'recent',
						search: searchQuery,
					} ),
					reset
				);
			}
		},
		[ getMedia, searchQuery ]
	);

	const previousSearchQueryValue = useRef();
	const onSearch = useCallback(
		event => {
			event.preventDefault();
			setLastSearchQuery( searchQuery );
			getNextPage( event, true );
			previousSearchQueryValue.current = searchQuery;
		},
		[ getNextPage, searchQuery ]
	);

	// Load initial results for the random example query.
	useEffect( getNextPage, [] );

	const searchFormEl = useRef( null );

	const focusSearchInput = () => {
		if ( ! searchFormEl.current ) {
			return;
		}

		const formElements = Array.from( searchFormEl.current.elements );
		// TextControl does not support ref forwarding, so we need to find the input:
		const searchInputEl = formElements.find( element => element.type === 'search' );

		if ( searchInputEl ) {
			searchInputEl.focus();
			searchInputEl.select();
		}
	};

	useEffect( focusSearchInput, [] );

	return (
		<div className="jetpack-external-media-wrapper__pexels">
			<form
				ref={ searchFormEl }
				className="jetpack-external-media-header__pexels"
				onSubmit={ onSearch }
			>
				<TextControl
					aria-label={ __( 'Search', 'jetpack' ) }
					type="search"
					value={ searchQuery }
					onChange={ setSearchQuery }
					disabled={ !! isCopying }
				/>
				<Button
					isPrimary
					onClick={ onSearch }
					type="submit"
					disabled={
						! searchQuery.length || searchQuery === previousSearchQueryValue.current || isCopying
					}
				>
					{ __( 'Search', 'jetpack' ) }
				</Button>
			</form>

			<MediaBrowser
				key={ lastSearchQuery }
				className="jetpack-external-media-browser__pexels"
				media={ media }
				isCopying={ isCopying }
				isLoading={ isLoading }
				nextPage={ getNextPage }
				onCopy={ onCopy }
				pageHandle={ pageHandle }
				multiple={ multiple }
			/>
		</div>
	);
}

export default withMedia()( PexelsMedia );
