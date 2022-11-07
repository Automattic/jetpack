/**
 * External dependencies
 */
import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { VIDEO_PRIVACY_LEVELS, VIDEO_PRIVACY_LEVEL_PRIVATE } from '../../../state/constants';
import Checkbox from '../checkbox';
import ConnectVideoRow, { VideoRow, Stats } from '../video-row';
import styles from './style.module.scss';
/**
 * Types
 */
import { LocalVideoListProps, VideoListProps } from './types';

const VideoList = ( {
	videos,
	hidePrivacy = false,
	hideDuration = false,
	hidePlays = false,
	showActionButton = true,
	showQuickActions = true,
	loading = false,
	onVideoDetailsClick,
}: VideoListProps ) => {
	const [ selected, setSelected ] = useState( [] );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const allSelected = selected?.length === videos?.length;
	const showCheckbox = false; // TODO: implement bulk actions

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
					{ showCheckbox && <Checkbox checked={ allSelected } onChange={ handleAll } /> }
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
				const isPrivate =
					VIDEO_PRIVACY_LEVELS[ video.privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE;

				return (
					<ConnectVideoRow
						key={ video?.guid ?? video?.id }
						id={ video?.id }
						checked={ selected.includes( index ) }
						title={ video.title }
						thumbnail={ video?.posterImage } // TODO: we should use thumbnail when the API is ready https://github.com/Automattic/jetpack/issues/26319
						duration={ hideDuration ? null : video.duration }
						plays={ hidePlays ? null : video.plays }
						isPrivate={ hidePrivacy ? null : isPrivate }
						uploadDate={ video.uploadDate }
						showQuickActions={ ! video?.uploading && showQuickActions }
						showActionButton={ ! video?.uploading && showActionButton }
						showCheckbox={ showCheckbox }
						className={ styles.row }
						onActionClick={ handleClickWithIndex( index, onVideoDetailsClick ) }
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
	showActionButton = true,
	showQuickActions = false,
	uploading = false,
	onActionClick,
}: LocalVideoListProps ) => {
	const [ selected, setSelected ] = useState( [] );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const allSelected = selected?.length === videos?.length;
	const showCheckbox = false; // TODO: implement bulk actions

	const handleAll = checked => {
		if ( checked ) {
			setSelected( videos.map( ( _, i ) => i ) );
		} else {
			setSelected( [] );
		}
	};

	const handleClickWithIndex = index => () => {
		onActionClick?.( videos[ index ] );
	};

	return (
		<div className={ styles.list }>
			<div className={ styles.header }>
				<div className={ styles[ 'title-wrapper' ] }>
					{ showCheckbox && <Checkbox checked={ allSelected } onChange={ handleAll } /> }
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
						showActionButton={ showActionButton }
						showQuickActions={ showQuickActions }
						showCheckbox={ showCheckbox }
						uploadDate={ video.uploadDate }
						onActionClick={ handleClickWithIndex( index ) }
						actionButtonLabel={ __( 'Upload to VideoPress', 'jetpack-videopress-pkg' ) }
						disabled={ video?.isUploadedToVideoPress }
						disableActionButton={ uploading }
						titleAdornment={
							video?.isUploadedToVideoPress && (
								<Tooltip
									position="top center"
									text={ __( 'Video already uploaded to VideoPress', 'jetpack-videopress-pkg' ) }
								>
									<div className={ styles[ 'title-adornment' ] }>
										<Icon icon={ info } />
									</div>
								</Tooltip>
							)
						}
					/>
				);
			} ) }
		</div>
	);
};

export default VideoList;
