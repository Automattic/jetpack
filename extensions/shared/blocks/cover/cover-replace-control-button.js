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
import { CoverMediaContext } from './components';
import { isVideoFile } from './utils';

export default createHigherOrderComponent(
	MediaReplaceFlow => props => {
		const { name } = useBlockEditContext();
		const preUploadFile = useRef();
		if ( 'core/cover' !== name ) {
			return <MediaReplaceFlow { ...props } />;
		}

		const onFilesUpload = useContext( CoverMediaContext );

		return (
			<MediaReplaceFlow
				{ ...props }
				onFilesUpload={ files => {
					preUploadFile.current = files?.length ? files[ 0 ] : null;
					onFilesUpload( files );
				} }
				createNotice={ ( status, msg, options ) => {
					// Detect video file from callback and reference instance.
					if ( isVideoFile( preUploadFile.current ) ) {
						preUploadFile.current = null; // clean up the file reference.
						return null;
					}

					props.createNotice( status, msg, options );
				} }
			/>
		);
	},
	'JetpackCoverMediaReplaceFlow'
);
