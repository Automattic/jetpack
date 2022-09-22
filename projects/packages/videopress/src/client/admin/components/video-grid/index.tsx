/**
 * External dependencies
 */
import { Container, Col } from '@automattic/jetpack-components';
/**
 * Internal dependencies
 */
import { VideoCard } from '../video-card';
import styles from './style.module.scss';
import { VideoGridProps } from './types';
import type React from 'react';

// Generate en ampty array of length count
const blankData = {
	id: 0,
	title: '...',
	thumbnail: null,
	duration: null,
	uploadDate: '',
	plays: null,
};

/**
 * Video Grid component
 *
 * @param {VideoGridProps} props - Component props.
 * @returns {React.ReactNode} - VideoGrid react component.
 */
const VideoGrid = ( { videos, count = 6, onVideoDetailsClick }: VideoGridProps ) => {
	let gridVideos = videos.slice( 0, count );

	if ( gridVideos.length < count ) {
		gridVideos = gridVideos.concat( Array( count - gridVideos.length ).fill( blankData ) );
	}

	const handleClickWithIndex = ( index, callback ) => () => {
		callback?.( videos[ index ] );
	};

	return (
		<div className={ styles.wrapper }>
			<Container fluid horizontalSpacing={ 0 } horizontalGap={ 0 }>
				{ gridVideos.map( ( video, index ) => {
					return (
						<Col key={ index } sm={ 4 } md={ 4 } lg={ 4 }>
							<VideoCard
								id={ video.id }
								title={ video.title }
								thumbnail={ video?.posterImage } // TODO: we should use thumbnail when the API is ready https://github.com/Automattic/jetpack/issues/26319
								duration={ video.duration }
								uploadDate={ video.uploadDate }
								plays={ video.plays }
								onVideoDetailsClick={ handleClickWithIndex( index, onVideoDetailsClick ) }
							/>
						</Col>
					);
				} ) }
			</Container>
		</div>
	);
};

export default VideoGrid;
