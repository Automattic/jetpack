import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';
import type { AttachedMedia } from '../../utils/types';

/**
 * Per-connection override settings.
 * Only includes the fields that can be customized per-connection.
 */
export interface ConnectionOverride {
	override_settings: boolean;
	message?: string;
	attached_media?: Array< AttachedMedia >;
}

/**
 * Map of connection ID to override settings.
 */
export type ConnectionOverrides = Record< string, ConnectionOverride >;

const EMPTY_OBJECT: ConnectionOverrides = {};

/**
 * The REST API name for the connection overrides meta.
 * This is defined in class-publicize-base.php via show_in_rest.name
 */
const META_KEY = 'jetpack_publicize_connection_overrides';

/**
 * Hook to manage per-connection customization overrides.
 *
 * This hook provides access to the `_wpas_connection_overrides` post meta
 * (exposed as `jetpack_publicize_connection_overrides` in REST),
 * which stores per-connection message and media customizations.
 *
 * @return Object with overrides data and update functions.
 */
export function useConnectionOverrides() {
	const { editPost } = useDispatch( editorStore );

	const connectionOverrides = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' ) || {};
		return ( meta[ META_KEY ] as ConnectionOverrides ) || EMPTY_OBJECT;
	}, [] );

	/**
	 * Get override settings for a specific connection.
	 */
	const getConnectionOverride = useCallback(
		( connectionId: string ): ConnectionOverride | undefined => {
			return connectionOverrides[ connectionId ];
		},
		[ connectionOverrides ]
	);

	/**
	 * Check if a connection has override settings enabled.
	 */
	const hasOverride = useCallback(
		( connectionId: string ): boolean => {
			return connectionOverrides[ connectionId ]?.override_settings === true;
		},
		[ connectionOverrides ]
	);

	/**
	 * Update override settings for a specific connection.
	 * Pass null to remove the override for that connection.
	 */
	const updateConnectionOverride = useCallback(
		( connectionId: string, override: Partial< ConnectionOverride > | null ) => {
			const newOverrides = { ...connectionOverrides };

			if ( override === null ) {
				// Remove the override for this connection
				delete newOverrides[ connectionId ];
			} else {
				// Merge with existing override or create new one
				newOverrides[ connectionId ] = {
					...( newOverrides[ connectionId ] || {} ),
					...override,
					override_settings: override.override_settings ?? true,
				};
			}

			// If all overrides are removed, delete the meta entirely
			const hasAnyOverrides = Object.keys( newOverrides ).length > 0;

			editPost( {
				meta: {
					[ META_KEY ]: hasAnyOverrides ? newOverrides : undefined,
				},
			} );
		},
		[ connectionOverrides, editPost ]
	);

	/**
	 * Toggle override settings for a connection.
	 * When enabling, copies current global message and attached_media as initial values.
	 */
	const toggleOverride = useCallback(
		(
			connectionId: string,
			globalSettings?: {
				message?: string;
				attached_media?: Array< AttachedMedia >;
			}
		) => {
			const currentOverride = connectionOverrides[ connectionId ];
			const isCurrentlyEnabled = currentOverride?.override_settings === true;

			if ( isCurrentlyEnabled ) {
				// Disable override - remove it
				updateConnectionOverride( connectionId, null );
			} else {
				// Enable override - copy global message and media as initial values
				updateConnectionOverride( connectionId, {
					override_settings: true,
					message: globalSettings?.message ?? '',
					attached_media: globalSettings?.attached_media ?? [],
				} );
			}
		},
		[ connectionOverrides, updateConnectionOverride ]
	);

	/**
	 * Clear all connection overrides.
	 */
	const clearAllOverrides = useCallback( () => {
		editPost( {
			meta: {
				[ META_KEY ]: undefined,
			},
		} );
	}, [ editPost ] );

	return useMemo(
		() => ( {
			connectionOverrides,
			getConnectionOverride,
			hasOverride,
			updateConnectionOverride,
			toggleOverride,
			clearAllOverrides,
		} ),
		[
			connectionOverrides,
			getConnectionOverride,
			hasOverride,
			updateConnectionOverride,
			toggleOverride,
			clearAllOverrides,
		]
	);
}
