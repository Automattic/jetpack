/**
 * External dependencies
 */
import { Container, Col } from '@automattic/jetpack-components';
/**
 * Internal dependencies
 */
import { VideoCard } from '../video-card';
import styles from './style.module.scss';
import { VideosGridProps } from './types';
import type React from 'react';
/**
 * Videos Grid component
 *
 * @param {VideosGridProps} props - Component props.
 * @returns {React.ReactNode} - VideosGrid react component.
 */
const VideosGrid: React.FC< VideosGridProps > = ( { videos, count = 6 } ) => {
	if ( ! videos || ! videos.length ) {
		return null;
	}

	const gridVideos = videos.slice( 0, count );

	return (
		<div className={ styles.wrapper }>
			<Container fluid horizontalSpacing={ 0 } horizontalGap={ 0 }>
				{ gridVideos.map( ( video, index ) => {
					return (
						<Col key={ index } sm={ 4 } md={ 4 } lg={ 4 }>
							<VideoCard
								id={ video.id }
								title={ video.title }
								thumbnail={ video?.posterImage }
								duration={ video.duration }
								uploadDate={ video.uploadDate }
								plays={ video.plays }
							/>
						</Col>
					);
				} ) }
			</Container>
		</div>
	);
};

export default VideosGrid;
