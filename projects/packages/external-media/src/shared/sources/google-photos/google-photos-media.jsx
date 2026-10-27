import { useRef, useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { SOURCE_GOOGLE_PHOTOS } from '../../constants';
import MediaBrowser from '../../media-browser';
import { MediaSource } from '../../media-service/types';
import { getExternalMediaApiUrl } from '../api';
import GooglePhotosAccount from './google-photos-account';

const isImageOnly = allowed => allowed && allowed.length === 1 && allowed[ 0 ] === 'image';

/**
 * GooglePhotosMedia component
 *
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
function GooglePhotosMedia( props ) {
	const {
		className,
		account,
		allowedTypes,
		copyMedia,
		getMedia,
		isCopying,
		isLoading,
		media,
		multiple,
		selectButtonText,
		onChangePath,
		pageHandle,
		path,
		setAuthenticated,
		pickerSession,
		deletePickerSession,
		createPickerSession,
	} = props;

	const imageOnly = isImageOnly( allowedTypes );
	const [ selectionChanged, setSelectionChanged ] = useState( false );

	const lastQuery = useRef( '' );
	const lastPath = useRef( '' );
	const params = {
		number: 20,
		path: path.ID,
	};
	if ( pickerSession ) {
		params.session_id = pickerSession.id;
	}

	const listUrl = getExternalMediaApiUrl( 'list', SOURCE_GOOGLE_PHOTOS, params );

	const getNextPage = useCallback(
		( query, reset = false ) => {
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
			copyMedia(
				items,
				getExternalMediaApiUrl( 'copy', SOURCE_GOOGLE_PHOTOS ),
				SOURCE_GOOGLE_PHOTOS,
				true
			);
		},
		[ copyMedia ]
	);

	const onChangeSelection = useCallback( () => {
		setSelectionChanged( true );

		pickerSession?.id && deletePickerSession( pickerSession.id );
		createPickerSession().then( newSession => {
			newSession?.pickerUri && window.open( newSession.pickerUri );
		} );
	}, [ pickerSession, createPickerSession, deletePickerSession ] );

	// Load media when the query changes.
	useEffect( () => {
		if ( lastQuery !== listUrl ) {
			lastQuery.current = listUrl;
			getNextPage( '', path !== lastPath.current );
		}
	}, [ lastQuery, listUrl, getNextPage, path ] );

	return (
		<div className={ clsx( className, 'jetpack-external-media-wrapper__google' ) }>
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="lg"
				wrap="wrap"
				className="jetpack-external-media-header__view"
			>
				{ ! isLoading && (
					<Button loading={ selectionChanged } onClick={ onChangeSelection }>
						{ __( 'Change selection', 'jetpack-external-media' ) }
					</Button>
				) }

				{ ( ! isLoading || media.length > 0 ) && (
					<GooglePhotosAccount account={ account } setAuthenticated={ setAuthenticated } />
				) }
			</Stack>

			<MediaBrowser
				className="jetpack-external-media-browser__google"
				key={ listUrl }
				media={ media }
				mediaSource={ MediaSource.GooglePhotos }
				imageOnly={ imageOnly }
				isCopying={ isCopying }
				isLoading={ isLoading }
				nextPage={ getNextPage }
				onCopy={ onCopy }
				pageHandle={ pageHandle }
				multiple={ multiple }
				selectButtonText={ selectButtonText }
				setPath={ setPath }
				shouldProxyImg={ true }
			/>
		</div>
	);
}

export default GooglePhotosMedia;
