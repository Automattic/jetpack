import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import {
	SandBox,
	TextControl,
	ToolbarGroup,
	ToolbarButton,
	Button,
	BaseControl,
	Dropdown,
} from '@wordpress/components';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

import './editor.scss';

const UrlDropdown = ( { tockUrl, setEditedUrl, setUrl, cancel } ) => {
	const firstRender = useRef( true );
	const committedChanges = useRef( false );
	const handleSubmitOrCancel = ( event, onClose ) => {
		const { keyCode } = event;

		if (
			keyCode === ENTER &&
			'' !== tockUrl // Disallow submitting empty values.
		) {
			event.preventDefault();
			commitChanges( onClose );
		}

		if ( keyCode === ESCAPE ) {
			event.preventDefault();
			cancel();
			onClose();
		}
	};

	const commitChanges = close => {
		setUrl();
		committedChanges.current = true;
		close();
	};

	return (
		<ToolbarGroup>
			<Dropdown
				popoverProps={ {
					variant: 'toolbar',
				} }
				onClose={ () =>
					committedChanges.current ? ( committedChanges.current = false ) : cancel()
				}
				placement="bottom-start"
				renderToggle={ ( { isOpen, onToggle } ) => {
					if ( firstRender.current && ! isOpen && ! tockUrl ) {
						firstRender.current = false;
						onToggle();
					}

					return (
						<ToolbarButton
							className="components-toolbar__control"
							label={ __( 'Edit Tock business name', 'jetpack' ) }
							onClick={ () => {
								onToggle();
								isOpen && cancel();
							} }
						>
							{ __( 'Edit', 'jetpack' ) }
						</ToolbarButton>
					);
				} }
				renderContent={ ( { onClose } ) => (
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
								onKeyDownCapture={ event => handleSubmitOrCancel( event, onClose ) }
								className="jetpack-tock-url-input"
							/>
							<div className="jetpack-tock-url-input-action">
								<Button
									type="submit"
									label={ __( 'Submit', 'jetpack' ) }
									icon={ keyboardReturn }
									className="jetpack-tock-url-input-submit"
									onClick={ () => commitChanges( onClose ) }
								/>
							</div>
						</div>
					</BaseControl>
				) }
			/>
		</ToolbarGroup>
	);
};

const TockPreview = ( { url, popoverAnchor } ) => {
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
		<div ref={ popoverAnchor }>
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
	const [ editedUrl, setEditedUrl ] = useState( tockUrl );

	const setUrl = () => {
		const newUrl = editedUrl.replace( /.*exploretock.com\//, '' );
		setEditedUrl( newUrl );
		setAttributes( { url: newUrl } );
	};

	const cancel = useCallback( () => {
		setEditedUrl( tockUrl );
	}, [ tockUrl ] );

	useEffect( () => {
		if ( ! isSelected ) {
			cancel();
		}
	}, [ isSelected, cancel ] );

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<UrlDropdown
					tockUrl={ editedUrl }
					setEditedUrl={ setEditedUrl }
					setUrl={ setUrl }
					cancel={ cancel }
				/>
			</BlockControls>
			<TockPreview url={ tockUrl } />
		</div>
	);
}
