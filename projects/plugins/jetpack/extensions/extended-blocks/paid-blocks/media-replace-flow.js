import { isUpgradable, getUsableBlockProps } from '@automattic/jetpack-shared-extension-utils';
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRef, useContext } from '@wordpress/element';
import { isFileOfType } from '../../shared/get-allowed-mime-types';
import { PaidBlockContext } from './components';

export default createHigherOrderComponent(
	MediaReplaceFlow => props => {
		const { name } = useBlockEditContext();
		const usableBlocksProps = getUsableBlockProps( name );

		const preUploadFile = useRef();
		if ( ! usableBlocksProps?.mediaReplaceFlow || ! isUpgradable( name ) ) {
			return <MediaReplaceFlow { ...props } />;
		}

		const { fileType } = usableBlocksProps;
		const { onBannerVisibilityChange } = useContext( PaidBlockContext );

		return (
			<MediaReplaceFlow
				{ ...props }
				onFilesUpload={ files => {
					preUploadFile.current = files?.length ? files[ 0 ] : null;
					onBannerVisibilityChange( files?.length && isFileOfType( files[ 0 ], fileType ) );
				} }
				createNotice={ ( status, msg, options ) => {
					// Detect video file from callback and reference instance.
					if ( isFileOfType( preUploadFile.current, fileType ) ) {
						preUploadFile.current = null; // clean up the file reference.

						// Do not show Error notice when it's a video file.
						return null;
					}

					props.createNotice( status, msg, options );
				} }
			/>
		);
	},
	'withMediaReplaceFlowUpgradable'
);
