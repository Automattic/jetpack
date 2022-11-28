/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { AVAILABLE_SERVICES } from './constants';
import './panel.scss';

const SocialPreviewsPanel = ( { openModal } ) => (
	<div className="jetpack-social-previews__panel">
		<p>
			{ __( 'Preview what this will look like on social networks and Google search.', 'jetpack' ) }
		</p>

		<div className="jetpack-gutenberg-social-icons">
			{ AVAILABLE_SERVICES.map( service => (
				<SocialServiceIcon
					key={ service.icon }
					serviceName={ service.icon }
					className="jetpack-social-previews__icon"
				/>
			) ) }
		</div>

		<Button
			variant="secondary"
			onClick={ openModal }
			label={ __( 'Open Social Previews', 'jetpack' ) }
		>
			{ __( 'Preview', 'jetpack' ) }
		</Button>
	</div>
);

export default SocialPreviewsPanel;
