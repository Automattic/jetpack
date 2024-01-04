import { QRCode } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { JetpackAppIcon } from '../../icons';
import MediaBrowser from '../media-browser';
import { MediaSource } from '../media-service/types';
import withMedia from './with-media';

/**
 * Invoke a function on an interval.
 *
 * @param {Function} callback - Function to invoke
 * @param {number} delay    - Interval timout in MS. `null` or `false` to stop the interval.
 */
export function useInterval( callback, delay ) {
	const savedCallback = useRef( callback );

	// Remember the latest callback.
	useEffect( () => {
		savedCallback.current = callback;
	}, [ callback ] );

	// Set up the interval.
	useEffect( () => {
		if ( delay === null || delay === false ) {
			return;
		}
		const tick = () => void savedCallback.current();
		const id = setInterval( tick, delay );
		return () => clearInterval( id );
	}, [ delay ] );
}

function JetpackAppMedia( props ) {
	const { media, insertMedia, isCopying, multiple, getMedia } = props;

	const wpcomBlogId = window?.Jetpack_Editor_Initial_State?.wpcomBlogId || 0;
	const imagePath = window?.Jetpack_Editor_Initial_State?.pluginBasePath + '/images/';
	const postId = select( editorStore ).getCurrentPostId();
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
	// get the current time and store it in the state
	const [ currentTime ] = useState( Date.now() / 1000 );

	// Load initial results for the random example query. Only do it once.
	useEffect( getNextPage, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	useInterval( getNextPagePull, 1000 );

	const hasImageUploaded = !! media.length;

	return (
		<div className="jetpack-external-media-wrapper__jetpack_app_media">
			<JetpackAppIcon />
			<h2 className="jetpack-external-media-wrapper__jetpack_app_media-title">
				{ hasImageUploaded && __( 'Photos uploaded!', 'jetpack' ) }
				{ ! hasImageUploaded && __( 'Upload straight from your phone.', 'jetpack' ) }
			</h2>
			<p className="jetpack-external-media-wrapper__jetpack_app_media-description">
				{ hasImageUploaded &&
					__( 'You can continue selecting images from your device.', 'jetpack' ) }
				{ ! hasImageUploaded &&
					__(
						'Scan the QR code with your iPhone or Android camera to upload straight from your photos.',
						'jetpack'
					) }
			</p>
			{ ! hasImageUploaded && (
				<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code-wrapper">
					<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code">
						<QRCode
							size="80"
							value={ `https://apps.wordpress.com/get?campaign=qr-code-media&data={post_id:${ postId },site_id:${ wpcomBlogId }}` }
						/>
					</div>
					<div className="jetpack-external-media-wrapper__jetpack_app_media-instructions">
						<img
							src={ imagePath + 'app-image-upload.png' }
							srcSet={ `${ imagePath + 'app-image-upload.png' } 1x, ${
								imagePath + 'app-image-upload-2x.png'
							} 2x` }
							alt="Screenshot of the Jetpack mobile app with the media upload highlighted."
						/>
					</div>
				</div>
			) }
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
			/>
		</div>
	);
}

export default withMedia( MediaSource.JetpackAppMedia )( JetpackAppMedia );
