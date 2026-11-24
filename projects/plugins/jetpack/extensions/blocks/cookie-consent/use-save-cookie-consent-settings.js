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

const getTemplatePartIds = ( record, stylesheet ) => {
	const collect = blocks =>
		blocks.flatMap( block => {
			const { slug } = block.attrs ?? {};
			const theme = block.attrs?.theme || stylesheet;
			return [
				...( block.blockName === 'core/template-part' && theme && slug
					? [ `${ theme }//${ slug }` ]
					: [] ),
				...collect( block.innerBlocks ?? [] ),
			];
		} );
	const content = record?.content?.raw ?? record?.content;
	return collect( parse( typeof content === 'string' ? content : '' ) );
};

export function useSyncCookieConsentSettings() {
	const registry = useRegistry();

	useEffect( () => {
		const pendingSaves = new Map();
		let completedSaves = [];
		let settingsSave = Promise.resolve();
		return registry.subscribe( () => {
			const core = registry.select( coreStore );
			for ( const { kind, name, key } of core.__experimentalGetEntitiesBeingSaved() ) {
				if (
					key === null ||
					key === undefined ||
					kind !== 'postType' ||
					! [ 'wp_template', 'wp_template_part' ].includes( name ) ||
					core.isAutosavingEntityRecord( kind, name, key )
				) {
					continue;
				}
				const id = `${ name }:${ key }`;
				if ( ! pendingSaves.has( id ) ) {
					const record = core.getEntityRecord( kind, name, key );
					const hadBanner = !! getBanner( record );
					const templatePartIds = getTemplatePartIds( record, core.getCurrentTheme()?.stylesheet );
					pendingSaves.set( id, { kind, name, key, hadBanner, templatePartIds } );
				}
			}
			for ( const [ id, { kind, name, key, hadBanner, templatePartIds } ] of pendingSaves ) {
				if ( core.isSavingEntityRecord( kind, name, key ) ) {
					continue;
				}
				pendingSaves.delete( id );
				if ( core.getLastEntitySaveError( kind, name, key ) ) {
					continue;
				}
				const record = core.getEntityRecord( kind, name, key );
				const banner = getBanner( record );
				if ( ! banner && ! hadBanner ) {
					continue;
				}
				completedSaves.push( {
					banner,
					templatePartIds: banner
						? []
						: getTemplatePartIds( record, core.getCurrentTheme()?.stylesheet ).filter(
								partId => ! templatePartIds.includes( partId )
							),
				} );
			}
			if ( pendingSaves.size || ! completedSaves.length ) {
				return;
			}
			const saves = completedSaves;
			completedSaves = [];
			settingsSave = settingsSave
				.then( async () => {
					let banner = saves.find( save => save.banner )?.banner;
					if ( ! banner ) {
						const parts = await Promise.all(
							[ ...new Set( saves.flatMap( save => save.templatePartIds ) ) ].map( partId =>
								registry
									.resolveSelect( coreStore )
									.getEntityRecord( 'postType', 'wp_template_part', partId )
							)
						);
						if ( parts.some( part => ! part ) ) {
							return;
						}
						banner = parts.map( getBanner ).find( Boolean );
					}
					if ( ! banner ) {
						const records = await Promise.all(
							[ 'wp_template', 'wp_template_part' ].map( name =>
								registry.resolveSelect( coreStore ).getEntityRecords( 'postType', name, {
									per_page: -1,
									context: 'edit',
								} )
							)
						);
						if ( records.some( collection => ! Array.isArray( collection ) ) ) {
							return;
						}
						const site = await registry
							.resolveSelect( coreStore )
							.getEntityRecord( 'root', 'site' );
						const currentBanner = getBanner( { content: site?.cookie_consent_template } );
						if (
							currentBanner &&
							records.flat().some( record => {
								const savedBanner = getBanner( record );
								return (
									savedBanner &&
									serializeRawBlock( savedBanner ) === serializeRawBlock( currentBanner )
								);
							} )
						) {
							return;
						}
					}
					await registry
						.dispatch( coreStore )
						.saveEntityRecord(
							'root',
							'site',
							{ cookie_consent_template: banner ? serializeRawBlock( banner ) : null },
							{ throwOnError: true }
						);
				} )
				.catch( error => {
					console.error( error ); // eslint-disable-line no-console
				} );
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
