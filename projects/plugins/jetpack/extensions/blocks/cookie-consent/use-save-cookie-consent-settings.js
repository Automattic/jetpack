import { parse } from '@wordpress/block-serialization-default-parser';
import { serialize, serializeRawBlock } from '@wordpress/blocks';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry, useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

const findBanner = blocks => {
	for ( const block of blocks ?? [] ) {
		const banner =
			block.blockName === 'jetpack/cookie-consent' ? block : findBanner( block.innerBlocks );
		if ( banner ) {
			return banner;
		}
	}
};

const getBanner = record => {
	const content = record?.content?.raw ?? record?.content;
	return findBanner( parse( typeof content === 'string' ? content : '' ) );
};

export function useSyncCookieConsentSettings() {
	const registry = useRegistry();

	useEffect( () => {
		const pendingSaves = new Map();
		return registry.subscribe( () => {
			const core = registry.select( coreStore );
			for ( const { kind, name, key } of core.__experimentalGetEntitiesBeingSaved() ) {
				if (
					kind !== 'postType' ||
					! [ 'wp_template', 'wp_template_part' ].includes( name ) ||
					core.isAutosavingEntityRecord( kind, name, key )
				) {
					continue;
				}
				const id = `${ name }:${ key }`;
				if ( ! pendingSaves.has( id ) ) {
					const hadBanner = !! getBanner( core.getEntityRecord( kind, name, key ) );
					pendingSaves.set( id, { kind, name, key, hadBanner } );
				}
			}
			for ( const [ id, { kind, name, key, hadBanner } ] of pendingSaves ) {
				if ( core.isSavingEntityRecord( kind, name, key ) ) {
					continue;
				}
				pendingSaves.delete( id );
				if ( core.getLastEntitySaveError( kind, name, key ) ) {
					continue;
				}
				const banner = getBanner( core.getEntityRecord( kind, name, key ) );
				if ( ! banner && ! hadBanner ) {
					continue;
				}
				registry
					.resolveSelect( coreStore )
					.getEntityRecord( 'root', 'site' )
					.then( () => {
						const { editEntityRecord, saveEditedEntityRecord } = registry.dispatch( coreStore );
						editEntityRecord( 'root', 'site', undefined, {
							cookie_consent_template: banner ? serializeRawBlock( banner ) : null,
						} );
						return saveEditedEntityRecord( 'root', 'site', undefined, { throwOnError: true } );
					} )
					.catch( error => {
						console.error( error ); // eslint-disable-line no-console
					} );
			}
		}, coreStore );
	}, [ registry ] );
}

export function useSaveCookieConsentSettings( clientId ) {
	const isSiteEditor = window.Jetpack_Editor_Initial_State?.screenBase === 'site-editor';
	const isSaving = useSelect(
		select => {
			if ( isSiteEditor ) {
				const { isSavingPost, isSavingNonPostEntityChanges } = select( 'core/editor' );
				return isSavingPost() || isSavingNonPostEntityChanges();
			}
			return false;
		},
		[ isSiteEditor ]
	);
	const wasSaving = usePrevious( isSaving );
	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );

	useSelect(
		select => {
			if ( isSiteEditor ) {
				// Editing the site record requires it to be loaded first.
				return select( coreStore ).getEntityRecord( 'root', 'site' );
			}
		},
		[ isSiteEditor ]
	);
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

			if ( ! block && isSiteEditor ) {
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
}
