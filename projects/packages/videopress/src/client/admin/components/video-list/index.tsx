import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import Checkbox from '../checkbox';
import VideoRow, { Stats } from '../video-row';
import styles from './style.module.scss';

const VideoList = ( { videos, onClickEdit } ) => {
	const [ selected, setSelected ] = useState( [] );
	const [ all, setAll ] = useState( false );
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const handleAll = checked => {
		setAll( checked );
		setSelected( [] );
	};

	const handleClickEdit = index => () => {
		onClickEdit?.( videos[ index ] );
	};

	return (
		<div className={ styles.list }>
			<div className={ styles.header }>
				<div className={ styles[ 'title-wrapper' ] }>
					<Checkbox checked={ all } onChange={ handleAll } />
					<Text>{ __( 'Title', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				{ ! isSmall && (
					<div className={ styles[ 'data-wrapper' ] }>
						<Stats
							privacy={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
							duration={ __( 'Duration', 'jetpack-videopress-pkg' ) }
							plays={ __( 'Plays', 'jetpack-videopress-pkg' ) }
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
						className={ styles.row }
						checked={ selected.includes( index ) || all }
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
