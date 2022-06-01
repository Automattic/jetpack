import { TextControl, Button } from '@wordpress/components';
import { useRef, useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { sample } from 'lodash';
import { SOURCE_PEXELS, PEXELS_EXAMPLE_QUERIES } from '../constants';
import MediaBrowser from '../media-browser';
import { getApiUrl } from './api';
import withMedia from './with-media';

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

	// Load initial results for the random example query. Only do it once.
	useEffect( getNextPage, [] ); // eslint-disable-line react-hooks/exhaustive-deps

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
					variant="primary"
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
