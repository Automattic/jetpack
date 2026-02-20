/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type CopyButtonProps = {
	text: string;
	label: string;
};

export const EMBED_CODE_PANEL_PLUGIN = 'jetpack-forms-embedcode-panel';

/**
 * Copy button component that shows a checkmark when copied.
 *
 * @param {CopyButtonProps} props - The component props.
 * @return {JSX.Element} The copy button component.
 */
const CopyButton = ( { text, label }: CopyButtonProps ) => {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef< number | null >( null );
	const ref = useCopyToClipboard( text, () => {
		setShowCopyConfirmation( true );
		if ( timeoutIdRef.current ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setShowCopyConfirmation( false );
		}, 2000 );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	const copiedLabel = __( 'Copied!', 'jetpack-forms' );

	return (
		<div style={ { marginBottom: '8px' } }>
			<Button __next40pxDefaultSize size="compact" variant="secondary" ref={ ref }>
				{ showCopyConfirmation ? copiedLabel : label }
			</Button>
		</div>
	);
};

/**
 * Embed Code Panel component.
 *
 * Adds a document settings panel with buttons to copy the embed code.
 * Only renders when editing a jetpack_form post type.
 *
 * @return {JSX.Element|null} The embed code panel or null.
 */
export const EmbedCodePanel = () => {
	const { postId, postStatus } = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
			getEditedPostAttribute: ( attr: string ) => string;
		};
		return {
			postId: editor.getCurrentPostId(),
			postStatus: editor.getEditedPostAttribute( 'status' ),
		};
	} );

	const getEmbedCode = useCallback( () => {
		return `<!-- wp:jetpack/contact-form {"ref":${ postId }} /-->`;
	}, [ postId ] );

	// Don't show for drafts or auto-drafts since they don't have a stable ID yet.
	if ( postStatus === 'auto-draft' ) {
		return null;
	}

	// PluginDocumentSettingPanel may not be available in older WordPress versions.
	if ( ! PluginDocumentSettingPanel ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="jetpack-form-embed-code"
			title={ __( 'Embed code', 'jetpack-forms' ) }
		>
			<p>{ __( 'Copy the code below to embed this form.', 'jetpack-forms' ) }</p>

			<CopyButton text={ getEmbedCode() } label={ __( 'Copy embed code', 'jetpack-forms' ) } />
		</PluginDocumentSettingPanel>
	);
};
