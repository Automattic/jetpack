import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import Checkbox from '../checkbox';
import VideoRow, { Stats } from '../video-row';
import styles from './style.module.scss';
import type { VideoPressVideo } from '../video-row';

const VideoList = ( {
	videos,
	onClickEdit,
	hideQuickActions,
	hidePrivacy = false,
	hideDuration = false,
	hidePlays = false,
	hideEditButton = false,
}: {
	videos: Array< VideoPressVideo >;
	onClickEdit?: ( video: VideoPressVideo ) => void;
	hidePrivacy?: boolean;
	hideDuration?: boolean;
	hidePlays?: boolean;
	hideEditButton?: boolean;
	hideQuickActions?: boolean;
} ) => {
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

	const handleClickEdit = index => () => {
		onClickEdit?.( videos[ index ] );
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
					<VideoRow
						key={ video?.id }
						{ ...video }
						hideEditButton={ hideEditButton }
						hideQuickActions={ hideQuickActions }
						isPrivate={ hidePrivacy ? null : video.isPrivate }
						duration={ hideDuration ? null : video.duration }
						plays={ hidePlays ? null : video.plays }
						className={ styles.row }
						checked={ selected.includes( index ) }
						onClickEdit={ handleClickEdit( index ) }
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

export default VideoList;
