import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import Checkbox from '../checkbox';
import VideoRow, { Stats } from '../video-row';
import styles from './style.module.scss';

const VideoList = ( { videos } ) => {
	const [ selected, setSelected ] = useState( null );
	const [ all, setAll ] = useState( false );

	const handleAll = checked => {
		setAll( checked );
		setSelected( null );
	};

	return (
		<div className={ styles.list }>
			<div className={ styles.header }>
				<div className={ styles[ 'title-wrapper' ] }>
					<Checkbox checked={ all } onChange={ handleAll } />
					<Text>{ __( 'Title', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				<div className={ styles[ 'data-wrapper' ] }>
					<Stats
						privacy={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
						duration={ __( 'Duration', 'jetpack-videopress-pkg' ) }
						plays={ __( 'Plays', 'jetpack-videopress-pkg' ) }
						upload={ __( 'Upload date', 'jetpack-videopress-pkg' ) }
					/>
				</div>
			</div>
			{ videos.map( ( video, index ) => {
				return (
					<VideoRow
						key={ index }
						{ ...video }
						className={ styles.row }
						checked={ selected === index || all }
						onSelect={ check =>
							setSelected( current => {
								if ( check ) {
									return index;
								} else if ( ! check && current === index ) {
									return null;
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
