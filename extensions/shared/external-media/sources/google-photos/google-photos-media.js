/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState, useCallback, useEffect } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SOURCE_GOOGLE_PHOTOS, PATH_RECENT, PATH_ROOT, PATH_OPTIONS } from '../../constants';
import MediaBrowser from '../../media-browser';
import { getApiUrl } from '../api';
import GoogleFilterOption from './filter-option';
import GoogleFilterView from './filter-view';
import Breadcrumbs from './breadcrumbs';
import getFilterRequest from './filter-request';

const isImageOnly = allowed => allowed && allowed.length === 1 && allowed[ 0 ] === 'image';

function GooglePhotosMedia( props ) {
	const {
		media,
		isLoading,
		pageHandle,
		multiple,
		onChangePath,
		getMedia,
		allowedTypes,
		path,
		copyMedia,
	} = props;

	const imageOnly = isImageOnly( allowedTypes );
	const [ filters, setFilters ] = useState( imageOnly ? { mediaType: 'photo' } : {} );

	const lastQuery = useRef( '' );
	const filterQuery = path.ID === PATH_RECENT ? getFilterRequest( filters ) : null;
	const params = {
		number: 20,
		path: path.ID,
	};
	if ( filterQuery ) {
		params.filter = filterQuery;
	}
	const listUrl = getApiUrl( 'list', SOURCE_GOOGLE_PHOTOS, params );

	const getNextPage = useCallback(
		( reset = false ) => {
			getMedia( listUrl, reset );
		},
		[ getMedia, listUrl ]
	);

	const setPath = useCallback(
		nextPath => {
			const album = media.find( item => item.ID === nextPath );
			onChangePath( album ? album : { ID: nextPath } );
		},
		[ media, onChangePath ]
	);

	const onCopy = useCallback(
		items => {
			copyMedia( items, getApiUrl( 'copy', SOURCE_GOOGLE_PHOTOS ) );
		},
		[ copyMedia ]
	);

	// Load media when the query changes.
	useEffect( () => {
		if ( lastQuery !== listUrl ) {
			lastQuery.current = listUrl;
			getNextPage();
		}
	}, [ lastQuery, listUrl, getNextPage ] );

	return (
		<div className="jetpack-external-media-wrapper__google">
			<div className="jetpack-external-media-header__view">
				<SelectControl
					className="jetpack-external-media-header__select"
					label={ __( 'View', 'jetpack' ) }
					value={ path.ID !== PATH_RECENT ? PATH_ROOT : PATH_RECENT }
					disabled={ isLoading }
					options={ PATH_OPTIONS }
					onChange={ setPath }
				/>

				{ path.ID === PATH_RECENT && (
					<GoogleFilterView
						filters={ filters }
						isLoading={ isLoading }
						setFilters={ setFilters }
						canChangeMedia={ ! imageOnly }
					/>
				) }
			</div>

			<div className="jetpack-external-media-header__filter">
				{ path.ID === PATH_RECENT && (
					<GoogleFilterOption
						filters={ filters }
						isLoading={ isLoading }
						setFilters={ setFilters }
						canChangeMedia={ ! imageOnly }
					/>
				) }
				{ path.ID !== PATH_RECENT && path.ID !== PATH_ROOT && (
					<Breadcrumbs path={ path } setPath={ setPath } />
				) }
			</div>

			<MediaBrowser
				className="jetpack-external-media-browser__google"
				key={ listUrl }
				media={ media }
				isLoading={ isLoading }
				nextPage={ getNextPage }
				onCopy={ onCopy }
				pageHandle={ pageHandle }
				multiple={ multiple }
				setPath={ setPath }
			/>
		</div>
	);
}

export default GooglePhotosMedia;
