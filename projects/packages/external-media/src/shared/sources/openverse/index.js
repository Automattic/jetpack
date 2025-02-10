import { usePrevious } from '@wordpress/compose';
import { useCallback, useState, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { sample } from 'lodash';
import React from 'react';
import { SOURCE_OPENVERSE, PEXELS_EXAMPLE_QUERIES } from '../../constants';
import MediaBrowser from '../../media-browser';
import MediaSearch from '../../media-search';
import { MediaSource } from '../../media-service/types';
import { getExternalMediaApiUrl } from '../api';
import withMedia from '../with-media';
import './style.scss';

/**
 * OpenverseMedia component
 *
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX element
 */
function OpenverseMedia( props ) {
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
			copyMedia( items, getExternalMediaApiUrl( 'copy', SOURCE_OPENVERSE ), SOURCE_OPENVERSE );
		},
		[ copyMedia ]
	);

	const getNextPage = useCallback(
		( query, reset = false ) => {
			if ( ! query ) {
				return;
			}

			getMedia(
				getExternalMediaApiUrl( 'list', SOURCE_OPENVERSE, {
					number: 20,
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
		<div className={ clsx( className, 'jetpack-external-media-wrapper__openverse' ) }>
			<MediaSearch defaultValue={ searchQuery } onSearch={ setSearchQuery } />
			<MediaBrowser
				className="jetpack-external-media-browser__openverse"
				media={ media }
				mediaSource={ MediaSource.Openverse }
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

export default withMedia( MediaSource.Openverse, { modalSize: 'fill' } )( OpenverseMedia );
