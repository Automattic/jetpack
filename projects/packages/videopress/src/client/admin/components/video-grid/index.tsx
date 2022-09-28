/**
 * External dependencies
 */
import { Container, Col } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressVideo } from '../../types';
import { ConnectVideoCard } from '../video-card';
import styles from './style.module.scss';
import { VideoGridProps } from './types';
import type React from 'react';

const getThumbnail = ( { video }: { video: VideoPressVideo } ): React.ReactNode | string => {
	if ( video?.uploading ) {
		return <div>{ __( 'Uploading', 'jetpack-videopress-pkg' ) }</div>;
	}

	if ( ! video?.finished && ! video?.posterImage ) {
		return <div>{ __( 'Processing', 'jetpack-videopress-pkg' ) }</div>;
	}

	return video?.posterImage;
};

/**
 * Video Grid component
 *
 * @param {VideoGridProps} props - Component props.
 * @returns {React.ReactNode} - VideoGrid react component.
 */
const VideoGrid = ( { videos, count = 6, onVideoDetailsClick }: VideoGridProps ) => {
	const gridVideos = videos.slice( 0, count );

	const handleClickWithIndex = ( index, callback ) => () => {
		callback?.( videos[ index ] );
	};
	return (
		<div className={ styles.wrapper }>
			<Container fluid horizontalSpacing={ 0 } horizontalGap={ 0 }>
				{ gridVideos.map( ( video, index ) => {
					return (
						<Col key={ index } sm={ 4 } md={ 4 } lg={ 4 }>
							<ConnectVideoCard
								id={ video?.id }
								title={ video.title }
								thumbnail={ getThumbnail( { video } ) } // TODO: we should use thumbnail when the API is ready https://github.com/Automattic/jetpack/issues/26319
								duration={ video.duration }
								plays={ video.plays }
								showQuickActions={ ! video?.uploading }
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
