import { serialize } from '@wordpress/blocks';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry, useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

/**
 * Whether the saved site-wide banner follows the block in the current editor context.
 *
 * @param {Function} select - Data registry select function.
 * @return {boolean} True in the Site Editor, or while editing a template in another editor.
 */
const canSyncSettings = select =>
	window.Jetpack_Editor_Initial_State?.screenBase === 'site-editor' ||
	[ 'wp_template', 'wp_template_part' ].includes( select( 'core/editor' ).getCurrentPostType() );

export function useSaveCookieConsentSettings( clientId ) {
	const registry = useRegistry();
	const isSaving = useSelect( select => {
		const { isSavingPost, isSavingNonPostEntityChanges } = select( 'core/editor' );
		return isSavingPost() || isSavingNonPostEntityChanges();
	}, [] );
	const wasSaving = usePrevious( isSaving );
	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );

	const canSync = useSelect( select => {
		const enabled = canSyncSettings( select );
		if ( enabled ) {
			// Editing the site record requires it to be loaded first.
			select( coreStore ).getEntityRecord( 'root', 'site' );
		}
		return enabled;
	}, [] );
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );
	const [ isSavingSetting, setIsSavingSetting ] = useState( false );

	const getBlockById = useSelect( select => {
		const { getBlock } = select( 'core/block-editor' );
		return getBlock;
	} );

	const saveTemplate = useCallback(
		template => {
			setIsSavingSetting( true );
			editEntityRecord( 'root', 'site', undefined, { cookie_consent_template: template } );
			saveEditedEntityRecord( 'root', 'site', undefined, {
				cookie_consent_template: template,
			} ).finally( () => {
				setIsSavingSetting( false );
			} );
		},
		[ setIsSavingSetting, editEntityRecord, saveEditedEntityRecord ]
	);

	useEffect( () => {
		return () => {
			const block = getBlockById( clientId );

			// Hiding a template in the Page Editor also unmounts the block, so check the context again.
			if ( ! block && canSyncSettings( registry.select ) ) {
				saveTemplate( null );
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( canSync && postHasBeenJustSaved && ! isSavingSetting ) {
			saveTemplate( serialize( [ getBlockById( clientId ) ] ) );
		}
	}, [ canSync, postHasBeenJustSaved, isSavingSetting, saveTemplate, getBlockById, clientId ] );
}
