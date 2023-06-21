import { serialize } from '@wordpress/blocks';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

export function useSaveCookieConsentSettings( clientId ) {
	const isSaving = useSelect( select => {
		const { isSavingPost, isSavingNonPostEntityChanges } = select( 'core/editor' );
		return isSavingPost() || isSavingNonPostEntityChanges();
	}, [] );
	const wasSaving = usePrevious( isSaving );
	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );

	// eslint-disable-next-line no-unused-vars
	const [ cookieConsentTemplate, setCookieConsentTemplate ] = useEntityProp(
		'root',
		'site',
		'cookie_consent_template'
	);
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const [ isSavingSetting, setIsSavingSetting ] = useState( false );

	const content = useSelect(
		select => {
			const { getBlock } = select( 'core/block-editor' );
			return serialize( [ getBlock( clientId ) ] );
		},
		[ serialize ]
	);

	useEffect( () => {
		if ( postHasBeenJustSaved && ! isSavingSetting ) {
			setIsSavingSetting( true );
			setCookieConsentTemplate( content );
			saveEditedEntityRecord( 'root', 'site', undefined, {
				cookie_consent_template: content,
			} ).finally( () => {
				setIsSavingSetting( false );
			} );
		}
	}, [
		content,
		postHasBeenJustSaved,
		setCookieConsentTemplate,
		saveEditedEntityRecord,
		isSavingSetting,
		setIsSavingSetting,
	] );
}
