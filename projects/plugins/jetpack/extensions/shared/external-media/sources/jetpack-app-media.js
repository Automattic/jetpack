import { QRCode } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { JetpackAppIcon } from '../../icons';
import useRefInterval from '../../use-ref-interval';
import MediaBrowser from '../media-browser';
import { MediaSource } from '../media-service/types';
import withMedia from './with-media';

function JetpackAppMedia( props ) {
	const { media, insertMedia, isCopying, multiple, getMedia } = props;

	const wpcomBlogId = window?.Jetpack_Editor_Initial_State?.wpcomBlogId || 0;
	const imagePath = window?.Jetpack_Editor_Initial_State?.pluginBasePath + '/images/';

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	// get the current time and store it in the state
	const [ currentTime ] = useState( Date.now() / 1000 );
	const getNextPage = useCallback( () => {
		getMedia( `/wpcom/v2/app-media?refresh=true&after=${ currentTime }`, true );
	}, [ getMedia, currentTime ] );

	const getNextPagePull = useCallback( () => {
		getMedia( `/wpcom/v2/app-media?refresh=true&after=${ currentTime }`, false, false );
	}, [ getMedia, currentTime ] );

	const onCopy = useCallback(
		items => {
			insertMedia( items );
		},
		[ insertMedia ]
	);
	useEffect( () => {
		// In most cases media.length here should === 1, but when that is not the case the first image gets inserted.
		// Since otherwise we end up in a situation where the user is presented with multiple images and they can only insert one.
		if ( media.length && ! multiple ) {
			// replace the media right away if there's only one item and we're not in multiple mode.
			onCopy( media );
		}
	}, [ media, multiple, onCopy ] );

	// Load initial results for the random example query. Only do it once.
	useEffect( getNextPage, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	useRefInterval( getNextPagePull, 2000 );

	const hasImageUploaded = !! media.length;
	const wrapperClassname = hasImageUploaded
		? 'jetpack-external-media-wrapper__jetpack_app_media-wrapper'
		: 'jetpack-external-media-wrapper__jetpack_app_media-wrapper has-no-image-uploaded';

	const selectButtonText = selectedImages => {
		return selectedImages
			? sprintf(
					/* translators: %1$d is the number of images that were selected. */
					_n( 'Add %1$d image', 'Add %1$d images', selectedImages, 'jetpack' ),
					selectedImages
			  )
			: __( 'Add images', 'jetpack' );
	};
	return (
		<div className={ wrapperClassname }>
			<JetpackAppIcon />
			<h2 className="jetpack-external-media-wrapper__jetpack_app_media-title">
				{ hasImageUploaded && __( 'Select images to be added', 'jetpack' ) }
				{ ! hasImageUploaded && __( 'Upload from your phone', 'jetpack' ) }
			</h2>
			<p className="jetpack-external-media-wrapper__jetpack_app_media-description">
				{ hasImageUploaded &&
					__(
						'Select the images below to add, or continue adding more from your device.',
						'jetpack'
					) }
				{ ! hasImageUploaded &&
					__(
						'Scan the QR code with your iPhone or Android camera to upload from your photos.',
						'jetpack'
					) }
			</p>
			{ ! hasImageUploaded && (
				<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code-wrapper">
					<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code">
						<QRCode
							size="100"
							value={ `https://apps.wordpress.com/get/?campaign=qr-code-media&postId=${ postId }#%2Fmedia%2F${ wpcomBlogId }` }
						/>
					</div>
					<div className="jetpack-external-media-wrapper__jetpack_app_media-instructions">
						<img
							src={ `${ imagePath }app-image-upload.png` }
							srcSet={ `${ imagePath }app-image-upload.png 1x, ${ imagePath }app-image-upload-2x.png 2x` }
							alt=""
						/>
					</div>
				</div>
			) }
			{ hasImageUploaded && (
				<MediaBrowser
					key={ 'jetpack-app-media' }
					className="jetpack-external-media-browser__jetpack_app_media_browser"
					media={ media }
					isCopying={ isCopying }
					isLoading={ false }
					nextPage={ getNextPage }
					onCopy={ onCopy }
					pageHandle={ false }
					multiple={ multiple }
					selectButtonText={ selectButtonText }
				/>
			) }
		</div>
	);
}

export default withMedia( MediaSource.JetpackAppMedia )( JetpackAppMedia );
