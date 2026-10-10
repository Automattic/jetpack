/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

type BlockEditorSelectors = {
	getBlocksByName?: ( name: string ) => string[];
	getBlockAttributes?: ( clientId: string ) => { playlistId?: string } | null;
};

/**
 * Generate a playlist key: a UUID where the platform offers one, otherwise
 * a random hex string of the same entropy.
 *
 * @return The key.
 */
export function generatePlaylistId(): string {
	if ( typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ) {
		return crypto.randomUUID();
	}

	return Array.from( { length: 32 }, () => Math.floor( Math.random() * 16 ).toString( 16 ) ).join(
		''
	);
}

/**
 * Keep the block's `playlistId` attribute set and unique within the editor:
 * a freshly inserted block gets one, and a duplicated block (which copies the
 * attribute) gets a new one so the site's playlist index keeps both.
 *
 * @param props               - Hook props.
 * @param props.clientId      - This block instance's client id.
 * @param props.playlistId    - The block's current playlist id.
 * @param props.setAttributes - Attribute setter.
 */
export default function usePlaylistId( {
	clientId,
	playlistId,
	setAttributes,
}: {
	clientId: string;
	playlistId: string;
	setAttributes: ( attributes: { playlistId: string } ) => void;
} ) {
	const ownerClientId = useSelect(
		select => {
			if ( ! playlistId ) {
				return null;
			}
			const selectors = select( blockEditorStore ) as BlockEditorSelectors;
			const playlistClientIds = selectors?.getBlocksByName?.( 'videopress/playlist' ) ?? [];

			// The first block carrying the id keeps it.
			return (
				playlistClientIds.find(
					id => selectors?.getBlockAttributes?.( id )?.playlistId === playlistId
				) ?? null
			);
		},
		[ playlistId ]
	);

	useEffect( () => {
		if ( ! playlistId || ( ownerClientId && ownerClientId !== clientId ) ) {
			setAttributes( { playlistId: generatePlaylistId() } );
		}
	}, [ playlistId, ownerClientId, clientId, setAttributes ] );
}
