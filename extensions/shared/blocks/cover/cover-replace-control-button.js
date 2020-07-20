/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CoverMediaContext } from './components';
import { isUpgradable, isVideoFile } from './utils';

export default createHigherOrderComponent( MediaReplaceFlow => props => {
	const preUploadFile = useRef();
	/*
	 * Data provided by the cover media context could be undefined.
	 * We need to check data exists before proceeding.
	 */
	const coverMediaProvidedData = useContext( CoverMediaContext );
	if ( ! coverMediaProvidedData ) {
		return <MediaReplaceFlow { ...props } />;
	}

	// Check if the block is upgradable before to proceeding.
	const { onFilesUpload, blockName: name } = coverMediaProvidedData;
	if ( ! isUpgradable( name ) ) {
		return <MediaReplaceFlow { ...props } />;
	}

	return (
		<MediaReplaceFlow
			{ ...props }
			onFilesUpload={ ( files ) => {
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
}, 'JetpackCoverMediaReplaceFlow' );
