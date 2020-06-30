/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useContext, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isVideoFile } from './utils';
import { CoverMediaContext } from './components';

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( 'core/cover' !== name ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const onFilesUpload = useContext( CoverMediaContext );
		const { onError } = props;

		/**
		 * On Uploading error handler.
		 * Try to pick up filename from the error message.
		 * We should find a better way to do it. Unstable.
		 * This act as a fallback of `onFilesPreUpload()`.
		 *
		 * @param {Array} message - Error message provided by the callback.
		 * @returns {*} Error handling.
		 */
		const uploadingErrorHandler = useCallback(
			message => {
				const filename = message?.[ 0 ]?.props?.children;

				if ( isVideoFile( filename ) ) {
					return onFilesUpload( [ filename ] );
				}

				return onError( message );
			},
			[ onFilesUpload, onError ]
		);

		return (
			<div className="jetpack-cover-media-placeholder">
				<CoreMediaPlaceholder
					{ ...props }
					onFilesPreUpload={ onFilesUpload }
					onError={ uploadingErrorHandler }
				/>
			</div>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
