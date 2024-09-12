import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useEffect, useState, useRef } from '@wordpress/element';
import clsx from 'clsx';
import { Media, CalypsoSpinner } from './components';
import waitMediaReady from './lib/wait-media-ready';

export const Slide = ( {
	playerId,
	media,
	index,
	playing,
	uploading,
	settings,
	targetAspectRatio,
} ) => {
	const { currentSlideIndex, buffering } = useSelect(
		select => ( {
			currentSlideIndex: select( 'jetpack/story/player' ).getCurrentSlideIndex( playerId ),
			buffering: select( 'jetpack/story/player' ).isBuffering( playerId ),
		} ),
		[]
	);

	const { slideReady } = useDispatch( 'jetpack/story/player' );

	const visible = index === currentSlideIndex;
	const mediaRef = useRef( null );
	const [ preload, setPreload ] = useState( false );
	const [ loading, setLoading ] = useState( true );
	const isVideo = () =>
		mediaRef.current && mediaRef.current.src && mediaRef.current.tagName.toLowerCase() === 'video';

	useEffect( () => {
		if ( visible && ! loading ) {
			const video = isVideo() ? mediaRef.current : null;
			slideReady( playerId, mediaRef.current, video ? video.duration : settings.imageTime );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ visible, loading ] );

	useEffect( () => {
		if ( index <= currentSlideIndex + ( playing ? 1 : 0 ) ) {
			setPreload( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playing, currentSlideIndex ] );

	// Sync media loading
	useLayoutEffect( () => {
		if ( ! mediaRef.current ) {
			return;
		}
		waitMediaReady( mediaRef.current ).then( () => {
			setLoading( false );
		} );
	}, [ preload, uploading ] );

	/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
	return (
		<>
			{ visible && ( loading || uploading || buffering ) && (
				<div
					className={ clsx( 'wp-story-slide', 'is-loading', {
						transparent: playing && buffering,
						'semi-transparent': uploading || ( ! playing && buffering ),
					} ) }
				>
					<CalypsoSpinner />
				</div>
			) }
			<div
				role="figure"
				className="wp-story-slide"
				style={ { display: visible && ! loading ? 'block' : 'none' } }
				tabIndex={ visible ? 0 : -1 }
			>
				{ preload && (
					<Media
						{ ...media }
						targetAspectRatio={ targetAspectRatio }
						cropUpTo={ settings.cropUpTo }
						index={ index }
						mediaRef={ mediaRef }
					/>
				) }
			</div>
		</>
	);
	/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
};

export default Slide;
