/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, useCallback, useState, useEffect } from '@wordpress/element';
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
	const { media, isLoading, pageHandle, multiple, copyMedia, getMedia } = props;

	const [ searchQuery, setSearchQuery ] = useState( sample( PEXELS_EXAMPLE_QUERIES ) );
	const [ lastSearchQuery, setLastSearchQuery ] = useState( '' );

	const onCopy = useCallback(
		items => {
			copyMedia( items, getApiUrl( 'copy', SOURCE_PEXELS ) );
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

	const onSearch = useCallback(
		event => {
			event.preventDefault();
			setLastSearchQuery( searchQuery );
			getNextPage( true );
		},
		[ getNextPage, searchQuery ]
	);

	// Load initial results for the random example query.
	useEffect( () => {
		getNextPage();
	}, [] );

	return (
		<div className="jetpack-external-media-wrapper__pexels">
			<form className="jetpack-external-media-header__pexels" onSubmit={ onSearch }>
				<TextControl value={ searchQuery } onChange={ setSearchQuery } />
				<Button isPrimary onClick={ onSearch } type="submit">
					{ __( 'Search', 'jetpack' ) }
				</Button>
			</form>

			<MediaBrowser
				key={ lastSearchQuery }
				className="jetpack-external-media-browser__pexels"
				media={ media }
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
