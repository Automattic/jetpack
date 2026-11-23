import { serialize } from '@wordpress/blocks';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

export function CookieConsentSettings( { clientId } ) {
	const isEditingTemplate = useSelect(
		select =>
			[ 'wp_template', 'wp_template_part' ].includes(
				select( 'core/editor' ).getCurrentPostType()
			),
		[]
	);
	return window.Jetpack_Editor_Initial_State?.screenBase === 'site-editor' || isEditingTemplate ? (
		<SaveCookieConsentSettings clientId={ clientId } />
	) : null;
}

function SaveCookieConsentSettings( { clientId } ) {
	const { getCurrentPostType } = useSelect( 'core/editor' );
	const isSaving = useSelect( select => {
		const { isSavingPost, isSavingNonPostEntityChanges } = select( 'core/editor' );
		return isSavingPost() || isSavingNonPostEntityChanges();
	}, [] );
	const wasSaving = usePrevious( isSaving );
	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );

	const [ , setCookieConsentTemplate ] = useEntityProp( 'root', 'site', 'cookie_consent_template' );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const [ isSavingSetting, setIsSavingSetting ] = useState( false );

	const getBlockById = useSelect( select => {
		const { getBlock } = select( 'core/block-editor' );
		return getBlock;
	} );

	const saveTemplate = useCallback(
		template => {
			setIsSavingSetting( true );
			setCookieConsentTemplate( template );
			saveEditedEntityRecord( 'root', 'site', undefined, {
				cookie_consent_template: template,
			} ).finally( () => {
				setIsSavingSetting( false );
			} );
		},
		[ setIsSavingSetting, setCookieConsentTemplate, saveEditedEntityRecord ]
	);

	useEffect( () => {
		return () => {
			const block = getBlockById( clientId );
			const isEditingTemplate = [ 'wp_template', 'wp_template_part' ].includes(
				getCurrentPostType()
			);
			// Returning to a page preview can unmount settings without deleting the banner.
			const isTemplatePreview =
				window.Jetpack_Editor_Initial_State?.screenBase === 'post' && ! isEditingTemplate;

			if ( ! block && ! isTemplatePreview ) {
				saveTemplate( null );
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( postHasBeenJustSaved && ! isSavingSetting ) {
			saveTemplate( serialize( [ getBlockById( clientId ) ] ) );
		}
	}, [ postHasBeenJustSaved, isSavingSetting, saveTemplate, getBlockById, clientId ] );

	return null;
}
