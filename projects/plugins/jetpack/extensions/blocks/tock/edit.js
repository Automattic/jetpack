import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	SandBox,
	TextControl,
	ToolbarGroup,
	ToolbarButton,
	Notice,
	Popover,
	Button,
	BaseControl,
} from '@wordpress/components';
import { createInterpolateElement, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

import './editor.scss';

const ToolbarControls = ( { isOpen, open, close, popoverAnchor } ) => (
	<div ref={ popoverAnchor }>
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Edit Tock business name', 'jetpack' ) }
				onClick={ () => ( isOpen ? close() : open() ) }
			>
				{ __( 'Edit', 'jetpack' ) }
			</ToolbarButton>
		</ToolbarGroup>
	</div>
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

	const closeIfNotToggle = () => {
		if ( ! popoverAnchor ) {
			return;
		}

		const { ownerDocument } = popoverAnchor;
		if ( ! popoverAnchor.contains( ownerDocument.activeElement ) ) {
			cancel();
		}
	};

	return (
		<Popover
			anchor={ popoverAnchor }
			placement="bottom-start"
			onFocusOutside={ closeIfNotToggle }
			className="jetpack-tock-url-popover"
		>
			<BaseControl
				className="jetpack-tock-url-settings"
				help={ createInterpolateElement(
					__(
						'The Tock business can be found in the URL of your public Tock page. For example: www.exploretock.com/<b>myname</b>',
						'jetpack'
					),
					{
						b: <strong />,
					}
				) }
			>
				<div className="jetpack-tock-url-input-wrapper">
					<TextControl
						placeholder={ __( 'Add Tock business name', 'jetpack' ) }
						onChange={ setEditedUrl }
						value={ tockUrl }
						onKeyDown={ handleSubmitOrCancel }
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
			</BaseControl>
		</Popover>
	);
};

const TockPreview = ( { url } ) => {
	const html = `
		<div id="Tock_widget_container" data-tock-display-mode="Button" data-tock-color-mode="Blue" data-tock-locale="en-us" data-tock-timezone="America/New_York" style="display:inline-block;"></div>
		<script src="https://www.exploretock.com/tock.js" async></script>
		<script>
			!function(t,o){if(!t.tock){var e=t.tock=function(){e.callMethod?
			  e.callMethod.apply(e,arguments):e.queue.push(arguments)};t._tock||(t._tock=e),
			  e.push=e,e.loaded=!0,e.version='1.0',e.queue=[];}}(window,document);
			tock('init', '${ url }');
		</script>
	`;

	return (
		<div>
			{
				// Related to this bug (https://github.com/WordPress/gutenberg/issues/16831), the
				// `SandBox` component won't rerun the scripts correctly when the injected `html` prop changes.
				// To work around that, we change the key of the component to force a new one render
			 }
			<SandBox html={ html } key={ `tock-${ url }` } />
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
	const containerRef = useRef();

	const setUrl = () => {
		const newUrl = editedUrl.replace( /.*exploretock.com\//, '' );
		setEditedUrl( newUrl );
		setAttributes( { url: newUrl } );
		setEditingUrl( false );
	};
	const cancel = () => {
		setEditingUrl( false );
		setEditedUrl( tockUrl );
	};

	return (
		<div ref={ containerRef } { ...useBlockProps() }>
			<BlockControls>
				<ToolbarControls
					isOpen={ editingUrl }
					open={ () => setEditingUrl( true ) }
					close={ cancel }
					popoverAnchor={ setPopoverAnchor }
				/>
				{ editingUrl && isSelected && (
					<UrlPopover
						tockUrl={ editedUrl }
						popoverAnchor={ popoverAnchor }
						setEditedUrl={ setEditedUrl }
						setUrl={ setUrl }
						cancel={ cancel }
						containerRef={ containerRef }
					/>
				) }
			</BlockControls>
			<TockPreview url={ tockUrl } />
			{ ( ! editingUrl || ! isSelected ) && ! tockUrl && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The block will not be shown to your site visitors until a Tock business name is set',
						'jetpack'
					) }
				</Notice>
			) }
		</div>
	);
}
