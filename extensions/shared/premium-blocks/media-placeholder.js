/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useContext, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { checkFileType } from '../get-allowed-mime-types';
import { isUpgradable } from '../plan-utils';
import { PremiumBlockContext } from './components';

const blocksMediaPlaceholderHandler = {
	'core/cover': {
		fileType: 'video',
	},
	'core/audio': {
		fileType: 'audio',
	}
};

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( ! blocksMediaPlaceholderHandler[ name ] || ! isUpgradable( name ) ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const { fileType } = blocksMediaPlaceholderHandler[ name ];
		const { onError } = props;

		const onBannerVisibilityChange = useContext( PremiumBlockContext );

		const checkUploadingVideoFiles = useCallback(
			files => onBannerVisibilityChange( files?.length && checkFileType( files[ 0 ], fileType ) )
			, [ fileType, onBannerVisibilityChange] );

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
				if ( checkFileType( filename, fileType ) ) {
					return checkUploadingVideoFiles( [ filename ] );
				}

				return onError( message );
			},
			[ checkUploadingVideoFiles, fileType, onError ]
		);

		return (
			<div className="premium-block-media-placeholder">
				<CoreMediaPlaceholder
					{ ...props }
					onFilesPreUpload={ checkUploadingVideoFiles }
					onError={ uploadingErrorHandler }
				/>
			</div>
		);
	},
	'withMediaPlaceholderUpgradable'
);
