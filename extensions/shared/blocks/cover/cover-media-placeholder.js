
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useContext, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isUpgradable, isVideoFile } from './utils';
import { CoverMediaContext } from './components';

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		/*
		 * Data provided by the cover media context
		 * could be undefined.
		 * We need to check data exists before proceeding.
		 */
		const coverMediaProvidedData = useContext( CoverMediaContext );
		if ( ! coverMediaProvidedData ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		// Check if the block is upgradable before to proceeding.
		const { onFilesUpload, blockName: name } = coverMediaProvidedData;
		if ( ! name || ! isUpgradable( name ) ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		/**
		 * On Uploading error handler.
		 * Try to pick up filename from the error message.
		 * We should find a better way to do it. Unstable.
		 * This act as a fallback of `onFilesPreUpload()`.
		 *
		 * @param {Array} message - Error message provided by the callback.
		 * @returns {*} Error handling.
		 */

		const uploadingErrorHandler = useCallback( ( message ) => {
			const filename = message?.[ 0 ]?.props?.children;
			if ( filename && isVideoFile( filename ) ) {
				return onFilesUpload( [ filename ] );
			}
			return props.onError( message );
		}, [ onFilesUpload, props.onError ] );

		return (
			<div className="jetpack-cover-media-placeholder">
				<CoreMediaPlaceholder
					{ ...props }
					onFilesPreUpload={ onFilesUpload }
					onError = { uploadingErrorHandler }
				/>
			</div>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
