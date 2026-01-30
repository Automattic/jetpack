/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

export type PreviewFileProps = {
	/** The file object with url and name. */
	file: { url: string; name: string };
	/** Whether the preview is currently loading. */
	isLoading: boolean;
	/** Callback fired when the image finishes loading. */
	onImageLoaded: () => void;
};

/**
 * Renders a preview of an image file (with loading state).
 *
 * @param props               - Component props.
 * @param props.file          - The file object with url and name.
 * @param props.isLoading     - Whether the preview is currently loading.
 * @param props.onImageLoaded - Callback fired when the image finishes loading.
 *
 * @return Element containing the file preview.
 */
const PreviewFile = ( { file, isLoading, onImageLoaded }: PreviewFileProps ) => {
	const imageClass = clsx( 'jp-forms__inbox-file-preview-container', {
		'is-loading': isLoading,
	} );

	return (
		<div className="jp-forms__inbox-file-preview-shell">
			{ isLoading && (
				<div className="jp-forms__inbox-file-loading">
					<Spinner className="jp-forms__inbox-file-spinner" />
					<div className="jp-forms__inbox-file-loading-message ">
						{ __( 'Loading preview…', 'jetpack-forms' ) }
					</div>
				</div>
			) }

			<div className={ imageClass }>
				<img
					src={ file.url }
					alt={ decodeEntities( file.name ) }
					onLoad={ onImageLoaded }
					className="jp-forms__inbox-file-preview-image"
				/>
			</div>
		</div>
	);
};

export default PreviewFile;
