/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
// TODO: Replace with available alternative
// import { unlock } from '@wordpress/admin-toolkit';
/**
 * External dependencies
 */
// TODO: Implement routing
// import { useLinkProps } from '@tanstack/react-router';
import { __ } from '@wordpress/i18n';
// TODO: Implement image cropping functionality
// import { ImageCropperProvider } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import MediaEditorCanvas from '../editor-canvas';
import MediaEditorHeader from '../header';
import MediaEditorNotices from '../notices';
import MediaEditorSidebar from '../sidebar';
import './style.scss';

// Unlock WordPress private APIs
// TODO: Replace with available alternative
// const { InterfaceSkeleton, ComplementaryArea } = unlock( editorPrivateApis );
const InterfaceSkeleton = ( { header, sidebar, content, secondarySidebar }: any ) => {
	return (
		<div>
			{ header }
			{ sidebar }
			{ content }
			{ secondarySidebar }
		</div>
	);
};
const ComplementaryArea = {
	Slot: ( { scope }: any ) => null,
};

/**
 *
 * @param root0
 * @param root0.isPreview
 * @param root0.editLink
 */
export default function MediaEditorLayout( {
	isPreview,
	editLink,
}: {
	isPreview: boolean;
	editLink: string;
} ) {
	// TODO: Implement routing
	// const linkProps = useLinkProps( {
	//	to: editLink,
	//	className: 'next-admin-site-editor__hyperlink',
	// } );
	const linkProps = {
		href: editLink,
		className: 'next-admin-site-editor__hyperlink',
	};
	return (
		// TODO: Implement image cropping functionality
		// <ImageCropperProvider>
		<div>
			<div className="next-admin-site-editor next-admin-site-editor__media-editor-layout">
				<InterfaceSkeleton
					header={ ! isPreview && <MediaEditorHeader /> }
					sidebar={ ! isPreview && <ComplementaryArea.Slot scope="core/edit-media" /> }
					content={ <MediaEditorCanvas /> }
					secondarySidebar={ null }
				/>
				{ isPreview && <a { ...linkProps } aria-label={ __( 'Edit', 'jetpack-media-editor' ) } /> }
				<MediaEditorNotices />
				<MediaEditorSidebar />
			</div>
		</div>
		// </ImageCropperProvider>
	);
}
