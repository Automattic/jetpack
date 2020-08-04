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
import { isUpgradable } from '../../plan-utils';
import { PremiumBlockContext } from '../../premium-blocks/components';

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( 'core/cover' !== name || ! isUpgradable( name ) ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const { onError } = props;
		const onBannerVisibilityChange = useContext( PremiumBlockContext );

		const checkUploadingVideoFiles = useCallback( files =>
			onBannerVisibilityChange( files?.length && isVideoFile( files[ 0 ] ) )
		, [ onBannerVisibilityChange ] );

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
					return checkUploadingVideoFiles( [ filename ] );
				}

				return onError( message );
			},
			[ checkUploadingVideoFiles, onError ]
		);

		return (
			<div className="jetpack-cover-media-placeholder">
				<CoreMediaPlaceholder
					{ ...props }
					onFilesPreUpload={ checkUploadingVideoFiles }
					onError={ uploadingErrorHandler }
				/>
			</div>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
