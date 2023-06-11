import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	SandBox,
	TextControl,
	ToolbarGroup,
	ToolbarButton,
	Notice,
	Popover,
	Button,
} from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

import './editor.scss';

const ToolbarControls = ( { isOpen, open, close } ) => (
	<ToolbarGroup>
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Edit URL', 'jetpack' ) }
			icon="edit"
			onClick={ () => ( isOpen ? close() : open() ) }
		/>
	</ToolbarGroup>
);

const UrlPopover = ( { tockUrl, setEditedUrl, popoverAnchor, setUrl, cancel } ) => {
	const handleSubmitOrCancel = event => {
		const { keyCode } = event;

		if (
			keyCode === ENTER &&
			'' !== tockUrl // Disallow submitting empty values.
		) {
			event.preventDefault();
			setUrl();
		}

		if ( keyCode === ESCAPE ) {
			event.preventDefault();
			cancel();
		}
	};

	return (
		<Popover anchor={ popoverAnchor }>
			<div className="jetpack-tock-url-input-wrapper">
				<TextControl
					placeholder="Add Tock business name"
					onChange={ setEditedUrl }
					value={ tockUrl }
					onKeyUp={ handleSubmitOrCancel }
					className="jetpack-tock-url-input"
				/>
				<div className="jetpack-tock-url-input-action">
					<Button
						type="submit"
						label={ __( 'Submit', 'jetpack' ) }
						icon={ keyboardReturn }
						className="jetpack-tock-url-input-submit"
						onClick={ setUrl }
					/>
				</div>
			</div>
			<p className="jetpack-tock-url-instructions">
				{ createInterpolateElement(
					__(
						'The Tock business can be found in the URL of your public Tock page. For example www.exploretock.com/<b>myname</b>',
						'jetpack'
					),
					{
						b: <strong />,
					}
				) }
			</p>
		</Popover>
	);
};

const TockPreview = ( { url, popoverAnchor } ) => {
	const html = `
		<div id="Tock_widget_container" data-tock-display-mode="Button" data-tock-color-mode="Blue" data-tock-locale="en-us" data-tock-timezone="America/New_York" style="display:inline-block;"></div>
		<script>
			!function(t,o){if(!t.tock){var e=t.tock=function(){e.callMethod?
			  e.callMethod.apply(e,arguments):e.queue.push(arguments)};t._tock||(t._tock=e),
			  e.push=e,e.loaded=!0,e.version='1.0',e.queue=[];}}(window,document);
			tock('init', '${ url }');
		</script>
	`;
	const scripts = [ 'https://www.exploretock.com/tock.js' ];

	return (
		<div ref={ popoverAnchor }>
			{
				// Related to this bug (https://github.com/WordPress/gutenberg/issues/16831), the
				// `SandBox` component won't rerun the scripts correctly when the injected `html` prop changes.
				// To work around that, we change the key of the component to force a new one render
			 }
			<SandBox html={ html } scripts={ scripts } key={ `tock-${ url }` } />
			{ /* Use an overlay to prevent interactivity with the preview, since the preview does not always resize correctly. */ }
			<div className="block-library-embed__interactive-overlay" />
		</div>
	);
};

export default function TockBlockEdit( { attributes, setAttributes, isSelected } ) {
	const tockUrl = attributes.url ?? '';
	const [ editingUrl, setEditingUrl ] = useState( ! tockUrl );
	const [ editedUrl, setEditedUrl ] = useState( tockUrl );
	const [ popoverAnchor, setPopoverAnchor ] = useState();

	const setUrl = () => {
		const newUrl = editedUrl.replace( /.*exploretock.com\//, '' );
		setEditedUrl( newUrl );
		setAttributes( { url: newUrl } );
		setEditingUrl( false );
	};
	const cancel = () => {
		setEditedUrl( tockUrl );
		setEditingUrl( false );
	};

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarControls
					isOpen={ editingUrl }
					open={ () => setEditingUrl( true ) }
					close={ cancel }
				/>
			</BlockControls>
			<TockPreview url={ tockUrl } popoverAnchor={ setPopoverAnchor } />
			{ editingUrl && isSelected && (
				<UrlPopover
					tockUrl={ editedUrl }
					popoverAnchor={ popoverAnchor }
					setEditedUrl={ setEditedUrl }
					setUrl={ setUrl }
					cancel={ cancel }
				/>
			) }
			{ ( ! editingUrl || ! isSelected ) && ! tockUrl && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The block will not be shown to your site visitors until a URL is set',
						'jetpack'
					) }
				</Notice>
			) }
		</div>
	);
}
