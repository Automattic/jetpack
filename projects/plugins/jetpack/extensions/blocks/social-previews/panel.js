/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { AVAILABLE_SERVICES } from './constants';

const SocialPreviewsPanel = function SocialPreviewsPanel( { openModal, showUpgradeNudge } ) {
	const buttonText = showUpgradeNudge
		? __( 'Learn more', 'jetpack' )
		: __( 'Preview', 'jetpack', /* dummy arg to avoid bad minification */ 0 );
	const buttonLabel = showUpgradeNudge
		? __( 'Learn more about paid plans', 'jetpack' )
		: __( 'Open Social Previews', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

	return (
		<div className="jetpack-social-previews__panel">
			<p>
				{ __(
					'Preview what this will look like on social networks and Google search.',
					'jetpack'
				) }
			</p>

			{ showUpgradeNudge && <p>{ __( 'Pro plan required.', 'jetpack' ) }</p> }

			<div className="jetpack-gutenberg-social-icons">
				{ AVAILABLE_SERVICES.map( service => (
					<SocialServiceIcon
						key={ service.icon }
						serviceName={ service.icon }
						className="jetpack-social-previews__icon"
					/>
				) ) }
			</div>

			<Button variant="secondary" onClick={ openModal } label={ buttonLabel }>
				{ buttonText }
			</Button>
		</div>
	);
};

export default SocialPreviewsPanel;
