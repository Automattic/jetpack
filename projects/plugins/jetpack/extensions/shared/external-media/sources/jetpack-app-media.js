import { QRCode } from '@automattic/jetpack-components';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	const { media, insertMedia, isCopying, isLoading, multiple, getMedia } = props;

	const wpcomBlogId = window?.Jetpack_Editor_Initial_State?.wpcomBlogId || 0;
	const postId = select( editorStore ).getCurrentPostId();
	const getNextPage = useCallback( () => {
		getMedia( '/wpcom/v2/app-media?refresh=true', true );
	}, [ getMedia ] );

	const getNextPagePull = useCallback( () => {
		getMedia( '/wpcom/v2/app-media?refresh=true', false, false );
	}, [ getMedia ] );

	const onCopy = useCallback(
		items => {
			insertMedia( items );
		},
		[ insertMedia ]
	);

	// Load initial results for the random example query. Only do it once.
	useEffect( getNextPage, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	useInterval( getNextPagePull, 5000 );

	return (
		<div className="jetpack-external-media-wrapper__jetpack_app_media">
			<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code-wrapper">
				<div className="jetpack-external-media-wrapper__jetpack_app_media-qr-code">
					<QRCode
						size="80"
						value={ `https://apps.wordpress.com/get?campaign=qr-code-media&data={post_id:${ postId },site_id:${ wpcomBlogId }}` }
					/>
				</div>
				<div className="jetpack-external-media-wrapper__jetpack_app_media-instructions">
					<ol>
						<li>{ __( 'Scan the QR code with your phone.', 'jetpack' ) }</li>
						<li>{ __( 'Select and upload images to your site.', 'jetpack' ) }</li>
						<li>{ __( 'Insert the images from your phone into the post.', 'jetpack' ) }</li>
					</ol>
				</div>
			</div>
			<h3>{ __( 'Recently uploaded', 'jetpack' ) }</h3>
			<MediaBrowser
				key={ 'jetpack-app-media' }
				className="jetpack-external-media-browser__jetpack_app_media_browser"
				media={ media }
				isCopying={ isCopying }
				isLoading={ isLoading }
				nextPage={ getNextPage }
				onCopy={ onCopy }
				pageHandle={ false }
				multiple={ multiple }
			/>
		</div>
	);
}

export default withMedia( MediaSource.JetpackAppMedia )( JetpackAppMedia );
