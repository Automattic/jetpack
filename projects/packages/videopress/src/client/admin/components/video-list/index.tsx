/**
 * External dependencies
 */
import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import Checkbox from '../checkbox';
import ConnectVideoRow, { VideoRow, Stats } from '../video-row';
import styles from './style.module.scss';
/**
 * Types
 */
import { VideoListProps } from './types';

const VideoList = ( {
	videos,
	hidePrivacy = false,
	hideDuration = false,
	hidePlays = false,
	showEditButton = true,
	showQuickActions = true,
	loading = false,
	onVideoDetailsClick,
}: VideoListProps ) => {
	const [ selected, setSelected ] = useState( [] );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const allSelected = selected?.length === videos?.length;

	const handleAll = checked => {
		if ( checked ) {
			setSelected( videos.map( ( _, i ) => i ) );
		} else {
			setSelected( [] );
		}
	};

	const handleClickWithIndex = ( index, callback ) => () => {
		callback?.( videos[ index ] );
	};

	return (
		<div className={ styles.list }>
			<div className={ styles.header }>
				<div className={ styles[ 'title-wrapper' ] }>
					<Checkbox checked={ allSelected } onChange={ handleAll } />
					<Text>{ __( 'Title', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				{ ! isSmall && (
					<div className={ styles[ 'data-wrapper' ] }>
						<Stats
							privacy={ hidePrivacy ? null : __( 'Privacy', 'jetpack-videopress-pkg' ) }
							duration={ hideDuration ? null : __( 'Duration', 'jetpack-videopress-pkg' ) }
							plays={ hidePlays ? null : __( 'Plays', 'jetpack-videopress-pkg' ) }
							upload={ __( 'Upload date', 'jetpack-videopress-pkg' ) }
						/>
					</div>
				) }
			</div>
			{ videos.map( ( video, index ) => {
				return (
					<ConnectVideoRow
						key={ video?.guid ?? video?.id }
						id={ video?.id }
						checked={ selected.includes( index ) }
						title={ video.title }
						thumbnail={ video?.posterImage } // TODO: we should use thumbnail when the API is ready https://github.com/Automattic/jetpack/issues/26319
						duration={ hideDuration ? null : video.duration }
						plays={ hidePlays ? null : video.plays }
						isPrivate={ hidePrivacy ? null : video.isPrivate }
						uploadDate={ video.uploadDate }
						showQuickActions={ ! video?.uploading && showQuickActions }
						showEditButton={ ! video?.uploading && showEditButton }
						className={ styles.row }
						onVideoDetailsClick={ handleClickWithIndex( index, onVideoDetailsClick ) }
						loading={ loading }
						onSelect={ check =>
							setSelected( current => {
								const indexOf = current.indexOf( index );

								if ( check ) {
									return [ ...current, index ];
								} else if ( ! check && indexOf > -1 ) {
									return [ ...current.slice( 0, indexOf ), ...current.slice( indexOf + 1 ) ];
								}

								return current;
							} )
						}
					/>
				);
			} ) }
		</div>
	);
};

export const LocalVideoList = ( {
	videos,
	showEditButton = true,
	showQuickActions = false,
	onVideoDetailsClick,
}: VideoListProps ) => {
	const [ selected, setSelected ] = useState( [] );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const allSelected = selected?.length === videos?.length;

	const handleAll = checked => {
		if ( checked ) {
			setSelected( videos.map( ( _, i ) => i ) );
		} else {
			setSelected( [] );
		}
	};

	const handleClickWithIndex = index => () => {
		onVideoDetailsClick?.( videos[ index ] );
	};

	return (
		<div className={ styles.list }>
			<div className={ styles.header }>
				<div className={ styles[ 'title-wrapper' ] }>
					<Checkbox checked={ allSelected } onChange={ handleAll } />
					<Text>{ __( 'Title', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				{ ! isSmall && (
					<div className={ styles[ 'data-wrapper' ] }>
						<Stats
							privacy=""
							duration=""
							plays=""
							upload={ __( 'Upload date', 'jetpack-videopress-pkg' ) }
						/>
					</div>
				) }
			</div>
			{ videos.map( ( video, index ) => {
				if ( ! video?.id ) {
					return null;
				}
				return (
					<VideoRow
						key={ `local-video-${ video.id }` }
						id={ video.id }
						title={ video.title }
						showEditButton={ showEditButton }
						showQuickActions={ showQuickActions }
						uploadDate={ video.uploadDate }
						onVideoDetailsClick={ handleClickWithIndex( index ) }
					/>
				);
			} ) }
		</div>
	);
};

export default VideoList;
