import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils/script-data';
import useImageGeneratorConfig from '../use-image-generator-config';
import { usePerNetworkCustomization } from '../use-per-network-customization';
import { getSigImageUrl } from '../use-sig-preview/utils';

/**
 * Hook that syncs the SIG URL to connections with media_source === 'sig'.
 *
 * When per-network customization is enabled and the global SIG token changes,
 * this hook updates the attached_media field for all connections using SIG.
 * Only runs when the site has social paid features.
 */
export function useSyncSigToConnections() {
	const { isEnabled: isPerNetworkEnabled } = usePerNetworkCustomization();
	const { token } = useImageGeneratorConfig();
	const { customizeConnectionById } = useDispatch( socialStore );

	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	useEffect( () => {
		if ( ! hasSocialPaidFeatures() || ! isPerNetworkEnabled || ! token ) {
			return;
		}

		const sigUrl = getSigImageUrl( token );

		connections.forEach( connection => {
			if ( connection.media_source !== 'sig' ) {
				return;
			}

			const currentUrl = connection.attached_media?.[ 0 ]?.url;

			if ( currentUrl !== sigUrl ) {
				customizeConnectionById(
					connection.connection_id,
					{
						attached_media: [ { id: 0, url: sigUrl, type: 'image/png' } ],
					},
					true
				);
			}
		} );
	}, [ isPerNetworkEnabled, token, connections, customizeConnectionById ] );
}
