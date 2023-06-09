import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	SandBox,
	Placeholder,
	Button,
	TextControl,
	Flex,
	FlexBlock,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './style.scss';

const ToolbarControls = ( { setEditingUrl } ) => (
	<ToolbarGroup>
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Edit URL', 'jetpack' ) }
			icon="edit"
			onClick={ () => setEditingUrl( true ) }
		/>
	</ToolbarGroup>
);

const renderPreview = url => {
	const html = `
		<script src="https://www.exploretock.com/tock.js" async></script>
		<script>
			!function(t,o){if(!t.tock){var e=t.tock=function(){e.callMethod?
			  e.callMethod.apply(e,arguments):e.queue.push(arguments)};t._tock||(t._tock=e),
			  e.push=e,e.loaded=!0,e.version='1.0',e.queue=[];}}(window,document);
			tock('init', '${ url }');
		</script>
		<div id="Tock_widget_container" data-tock-display-mode="Button" data-tock-color-mode="Blue" data-tock-locale="en-us" data-tock-timezone="America/New_York" style="display:inline-block;"></div>
	`;

	return (
		<>
			<SandBox html={ html } />
			{ /* Use an overlay to prevent interactivity with the preview, since the preview does not always resize correctly. */ }
			<div className="block-library-embed__interactive-overlay" />
		</>
	);
};

const UrlEdit = ( { tockUrl, setEditedUrl, setUrl } ) => (
	<Placeholder
		label={ __( 'Tock', 'jetpack' ) }
		instructions={ __( 'Enter your Tock URL', 'jetpack' ) }
	>
		<Flex expanded={ true }>
			<FlexBlock>
				<TextControl placeholder="roister" onChange={ setEditedUrl } value={ tockUrl } />
				<Button variant="primary" onClick={ setUrl }>
					{ __( 'Set URL', 'jetpack' ) }
				</Button>
			</FlexBlock>
		</Flex>
	</Placeholder>
);

export default function TockBlockEdit( { attributes, setAttributes } ) {
	const tockUrl = attributes.url ?? '';
	const [ editingUrl, setEditingUrl ] = useState( false );
	const [ editedUrl, setEditedUrl ] = useState( tockUrl );

	return (
		<div { ...useBlockProps() }>
			{ editingUrl || ! tockUrl ? (
				<UrlEdit
					tockUrl={ editedUrl }
					setEditedUrl={ setEditedUrl }
					setUrl={ () => {
						setEditingUrl( false );
						setAttributes( { url: editedUrl } );
					} }
				/>
			) : (
				<>
					<BlockControls>
						<ToolbarControls setEditingUrl={ setEditingUrl } />
					</BlockControls>
					{ renderPreview( tockUrl ) }
				</>
			) }
		</div>
	);
}
