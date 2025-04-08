import { use } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * The gutenberg block editor preview button opens a new window to a simple site's mapped
 * domain.
 * Adds logmein query param to editor draft post preview url to add WordPress cookies in
 * a first party context ( allowing us to avoid third party cookie issues )
 */
async function overridePreviewButtonUrl() {
	// eslint-disable-next-line react-hooks/rules-of-hooks -- Not a React hook.
	use( registry => {
		return {
			dispatch: store => {
				const namespace = store.name ?? store;
				const actions = { ...registry.dispatch( namespace ) };

				if ( namespace === 'core/editor' && actions.__unstableSaveForPreview ) {
					const { __unstableSaveForPreview } = actions;
					actions.__unstableSaveForPreview = async ( ...args ) => {
						const link = await __unstableSaveForPreview( ...args );
						return link.startsWith( window.location.origin )
							? link
							: addQueryArgs( link, { logmein: 'direct' } );
					};
				}

				return actions;
			},
		};
	} );
}

overridePreviewButtonUrl();
