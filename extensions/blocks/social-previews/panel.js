/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { AVAILABLE_SERVICES } from './constants';
import { SocialServiceIcon } from '../../shared/icons';

const SocialPreviewsPanel = function SocialPreviewsPanel( { openModal } ) {
	return (
		<div className="jetpack-social-previews__panel">
			<p>
				{ __(
					'Preview what this will look like on social networks and Google search.',
					'jetpack'
				) }
			</p>
			<div>
				{ AVAILABLE_SERVICES.map( service => (
					<SocialServiceIcon
						key={ service.icon }
						serviceName={ service.icon }
						className="jetpack-social-previews__icon"
					/>
				) ) }
			</div>
			<Button isTertiary onClick={ openModal }>
				{ __( 'Preview', 'jetpack' ) }
			</Button>
		</div>
	);
};

export default SocialPreviewsPanel;
