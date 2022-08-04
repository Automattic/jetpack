/**
 * WordPress dependencies
 */
import { Button, TextControl, TabPanel } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight, chevronDown } from '@wordpress/icons';

import './style.scss';

const removeFileNameExtension = name => {
	return name.replace( /\.[^/.]+$/, '' );
};

const UploadingEditor = props => {
	const {
		file,
		// onSelectPoster,
		// onRemovePoster,
		// videoPosterImageData,
		// onChangeTitle,
		// onVideoFrameSelected,
	} = props;
	const filename = removeFileNameExtension( escapeHTML( file?.name ) );
	const [ title, setTitle ] = useState( filename );
	const [ expanded, setExpanded ] = useState( false );

	return (
		<>
			<div className="uploading-editor">
				<Button
					className="uploading-editor__summary"
					onClick={ () => setExpanded( current => ! current ) }
				>
					<Icon icon={ expanded ? chevronDown : chevronRight } size={ 20 } />
					{ __(
						'Your video is uploading. You can edit your title and poster image while you wait.',
						'jetpack'
					) }
				</Button>
				{ expanded && (
					<div className="uploading-editor__fields">
						<TextControl
							className="uploading-editor__title"
							onChange={ newTitle => setTitle( newTitle ) }
							value={ title }
						/>
						<TabPanel
							tabs={ [
								{
									name: 'frame',
									title: 'Select frame',
								},
								{ name: 'upload', title: 'Upload' },
							] }
						>
							{ tab => <div>{ tab?.title }</div> }
						</TabPanel>
					</div>
				) }
			</div>
		</>
	);
};

export default UploadingEditor;
