/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isVideoFile } from './utils';
import { isUpgradable } from '../../plan-utils';
import { PremiumBlockContext } from '../../premium-blocks/components';

export default createHigherOrderComponent(
	MediaReplaceFlow => props => {
		const { name } = useBlockEditContext();
		const preUploadFile = useRef();
		if ( 'core/cover' !== name || ! isUpgradable( name ) ) {
			return <MediaReplaceFlow { ...props } />;
		}

		const onBannerVisibilityChange = useContext( PremiumBlockContext );

		return (
			<MediaReplaceFlow
				{ ...props }
				onFilesUpload={ files => {
					preUploadFile.current = files?.length ? files[ 0 ] : null;
					onBannerVisibilityChange( files?.length && isVideoFile( files[ 0 ] ) );
				} }
				createNotice={ ( status, msg, options ) => {
					// Detect video file from callback and reference instance.
					if ( isVideoFile( preUploadFile.current ) ) {
						preUploadFile.current = null; // clean up the file reference.

						// Do not show Error notice when it's a video file.
						return null;
					}

					props.createNotice( status, msg, options );
				} }
			/>
		);
	},
	'JetpackCoverMediaReplaceFlow'
);
