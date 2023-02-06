import { SelectControl } from '@wordpress/components';
import { useRef, useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	SOURCE_GOOGLE_PHOTOS,
	PATH_RECENT,
	PATH_ROOT,
	PATH_OPTIONS,
	DATE_RANGE_ANY,
} from '../../constants';
import MediaBrowser from '../../media-browser';
import { getApiUrl } from '../api';
import Breadcrumbs from './breadcrumbs';
import GoogleFilterOption from './filter-option';
import getFilterRequest from './filter-request';
import GoogleFilterView from './filter-view';
import GooglePhotosAccount from './google-photos-account';

const isImageOnly = allowed => allowed && allowed.length === 1 && allowed[ 0 ] === 'image';

function GooglePhotosMedia( props ) {
	const {
		account,
		allowedTypes,
		copyMedia,
		getMedia,
		isCopying,
		isLoading,
		media,
		multiple,
		onChangePath,
		pageHandle,
		path,
		setAuthenticated,
		showAdditionalFilters = false,
	} = props;

	const imageOnly = isImageOnly( allowedTypes );
	const [ filters, setFilters ] = useState(
		imageOnly
			? { mediaType: 'photo', date: { range: DATE_RANGE_ANY } }
			: { date: { range: DATE_RANGE_ANY } }
	);

	const lastQuery = useRef( '' );
	const lastPath = useRef( '' );
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
		( event, reset = false ) => {
			getMedia( listUrl, reset );
		},
		[ getMedia, listUrl ]
	);

	const setPath = useCallback(
		nextPath => {
			const album = media.find( item => item.ID === nextPath );
			lastPath.current = path;
			onChangePath( album ? album : { ID: nextPath } );
		},
		[ media, onChangePath, lastPath, path ]
	);

	const onCopy = useCallback(
		items => {
			copyMedia( items, getApiUrl( 'copy', SOURCE_GOOGLE_PHOTOS ), SOURCE_GOOGLE_PHOTOS );
		},
		[ copyMedia ]
	);

	// Load media when the query changes.
	useEffect( () => {
		if ( lastQuery !== listUrl ) {
			lastQuery.current = listUrl;
			getNextPage( {}, path !== lastPath.current );
		}
	}, [ lastQuery, listUrl, getNextPage, path ] );

	return (
		<div className="jetpack-external-media-wrapper__google">
			<div className="jetpack-external-media-header__view">
				<SelectControl
					className="jetpack-external-media-header__select"
					label={ __( 'View', 'jetpack' ) }
					value={ path.ID !== PATH_RECENT ? PATH_ROOT : PATH_RECENT }
					disabled={ isLoading || isCopying }
					options={ PATH_OPTIONS }
					onChange={ setPath }
				/>

				{ showAdditionalFilters && path.ID === PATH_RECENT && (
					<GoogleFilterView
						filters={ filters }
						isLoading={ isLoading }
						setFilters={ setFilters }
						canChangeMedia={ ! imageOnly }
					/>
				) }

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

				{ ( ! isLoading || media.length > 0 ) && (
					<GooglePhotosAccount account={ account } setAuthenticated={ setAuthenticated } />
				) }
			</div>

			<MediaBrowser
				className="jetpack-external-media-browser__google"
				key={ listUrl }
				media={ media }
				isCopying={ isCopying }
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
