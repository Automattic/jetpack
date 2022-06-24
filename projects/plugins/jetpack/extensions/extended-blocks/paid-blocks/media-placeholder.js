import { isUpgradable, getUsableBlockProps } from '@automattic/jetpack-shared-extension-utils';
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useContext, useCallback } from '@wordpress/element';
import { isFileOfType } from '../../shared/get-allowed-mime-types';
import { PaidBlockContext } from './components';

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		const usableBlocksProps = getUsableBlockProps( name );

		if ( ! usableBlocksProps?.mediaPlaceholder || ! isUpgradable( name ) ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const { fileType } = usableBlocksProps;
		const { onError } = props;

		const { onBannerVisibilityChange } = useContext( PaidBlockContext );

		const checkUploadingVideoFiles = useCallback(
			files => onBannerVisibilityChange( files?.length && isFileOfType( files[ 0 ], fileType ) ),
			[ fileType, onBannerVisibilityChange ]
		);

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
				if ( isFileOfType( filename, fileType ) ) {
					return checkUploadingVideoFiles( [ filename ] );
				}

				return onError( message );
			},
			[ checkUploadingVideoFiles, fileType, onError ]
		);

		return (
			<div className="paid-block-media-placeholder">
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
