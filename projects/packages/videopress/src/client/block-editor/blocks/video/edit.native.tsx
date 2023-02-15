/**
 * WordPress dependencies
 */
import { MediaPlaceholder } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import usePosterImage from '../../../hooks/use-poster-image';
import { getJWT } from '../../../hooks/use-uploader';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from './components/icons';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from './constants';
import style from './style.scss';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit( { attributes, setAttributes } ): React.ReactNode {
	/**
	 * TODO: The current components are intended to act as placeholders while block is in development.
	 * They should eventually be edited or replaced to support VideoPress.
	 */

	const poster = usePosterImage( '7QhghIkx' );

	/* eslint-disable no-console */
	useEffect( () => {
		poster()
			.then( s => console.log( s ) )
			.catch( e => console.log( e ) );

		getJWT()
			.then( s => console.log( s ) )
			.catch( e => console.log( e ) );
	}, [] );
	/* eslint-enable no-console */

	/**
	 * Function to set attributes upon media upload
	 *
	 * @param {object} attributes     - Attributes associated with uploaded video.
	 * @param {string} attributes.id  - Unique ID associated with video.
	 * @param {string} attributes.url - URL associated with video.
	 */
	function onSelectMediaUploadOption( { id, url } ) {
		setAttributes( { id, src: url } );
	}

	if ( ! attributes.id ) {
		return (
			<View style={ { flex: 1 } }>
				<MediaPlaceholder
					allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
					onSelect={ onSelectMediaUploadOption }
					icon={ icon }
				/>
			</View>
		);
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			<View style={ style[ 'wp-block-jetpack-videopress__video-player' ] } />
		</View>
	);
}
