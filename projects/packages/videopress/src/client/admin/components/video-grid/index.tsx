/**
 * External dependencies
 */
import { Container, Col } from '@automattic/jetpack-components';
/**
 * Internal dependencies
 */
import VideoCard from '../video-card';
import styles from './style.module.scss';
import { VideoGridProps } from './types';
import type React from 'react';

/**
 * Video Grid component
 *
 * @param {VideoGridProps} props - Component props.
 * @returns {React.ReactNode} - VideoGrid react component.
 */
const VideoGrid = ( { videos, count = 6, onVideoDetailsClick, loading }: VideoGridProps ) => {
	const gridVideos = videos.slice( 0, count );

	const handleClickWithIndex = ( index, callback ) => () => {
		callback?.( videos[ index ] );
	};

	return (
		<div className={ styles.wrapper }>
			<Container fluid horizontalSpacing={ 0 } horizontalGap={ 0 }>
				{ gridVideos.map( ( video, index ) => {
					return (
						<Col key={ video?.guid ?? video?.id } sm={ 4 } md={ 4 } lg={ 4 }>
							<VideoCard
								id={ video?.id }
								title={ video.title }
								thumbnail={ video?.posterImage } // TODO: we should use thumbnail when the API is ready https://github.com/Automattic/jetpack/issues/26319
								duration={ video.duration }
								plays={ video.plays }
								onVideoDetailsClick={ handleClickWithIndex( index, onVideoDetailsClick ) }
								loading={ loading }
							/>
						</Col>
					);
				} ) }
			</Container>
		</div>
	);
};

export default VideoGrid;
