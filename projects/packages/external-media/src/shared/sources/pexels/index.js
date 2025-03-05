import { usePrevious } from '@wordpress/compose';
import { useCallback, useState, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { sample } from 'lodash';
import React from 'react';
import { SOURCE_PEXELS, PEXELS_EXAMPLE_QUERIES } from '../../constants';
import MediaBrowser from '../../media-browser';
import MediaSearch from '../../media-search';
import { MediaSource } from '../../media-service/types';
import { getExternalMediaApiUrl } from '../api';
import withMedia from '../with-media';
import './style.scss';

/**
 * PexelsMedia component
 *
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX element
 */
function PexelsMedia( props ) {
	const {
		className,
		media,
		isCopying,
		isLoading,
		pageHandle,
		multiple,
		selectButtonText,
		copyMedia,
		getMedia,
	} = props;

	const [ searchQuery, setSearchQuery ] = useState( sample( PEXELS_EXAMPLE_QUERIES ) );
	const previousSearchQuery = usePrevious( searchQuery );

	const onCopy = useCallback(
		items => {
			copyMedia( items, getExternalMediaApiUrl( 'copy', SOURCE_PEXELS ), SOURCE_PEXELS );
		},
		[ copyMedia ]
	);

	const getNextPage = useCallback(
		( query, reset = false ) => {
			if ( ! query ) {
				return;
			}

			getMedia(
				getExternalMediaApiUrl( 'list', SOURCE_PEXELS, {
					number: 20,
					path: 'recent',
					search: query,
				} ),
				reset
			);
		},
		[ getMedia ]
	);

	useEffect( () => {
		getNextPage( searchQuery, searchQuery !== previousSearchQuery );
	}, [ searchQuery ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={ clsx( className, 'jetpack-external-media-wrapper__pexels' ) }>
			<MediaSearch defaultValue={ searchQuery } onSearch={ setSearchQuery } />
			<MediaBrowser
				className="jetpack-external-media-browser__pexels"
				media={ media }
				mediaSource={ MediaSource.Pexels }
				isCopying={ isCopying }
				isLoading={ isLoading }
				nextPage={ () => getNextPage( searchQuery ) }
				onCopy={ onCopy }
				pageHandle={ pageHandle }
				multiple={ multiple }
				selectButtonText={ selectButtonText }
			/>
		</div>
	);
}

export default withMedia( MediaSource.Pexels, { modalSize: 'fill' } )( PexelsMedia );
