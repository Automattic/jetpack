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

const SocialPreviewsPanel = function SocialPreviewsPanel( { openModal, showUpgradeNudge } ) {
	const buttonText = showUpgradeNudge ? __( 'Learn more', 'jetpack' ) : __( 'Preview', 'jetpack' );
	const buttonLabel = showUpgradeNudge ? __( 'Learn more about paid plans', 'jetpack' ) : __( 'Open Social Previews', 'jetpack' );

	return (
		<div className="jetpack-social-previews__panel">
			<p>
				{ __(
					'Preview what this will look like on social networks and Google search.',
					'jetpack'
				) }
			</p>

			{ showUpgradeNudge && (
				<p>{ __( 'Business or eCommerce plan required.', 'jetpack' ) }</p>
			)}

			<div className="jetpack-gutenberg-social-icons">
				{ AVAILABLE_SERVICES.map( service => (
					<SocialServiceIcon
						key={ service.icon }
						serviceName={ service.icon }
						className="jetpack-social-previews__icon"
					/>
				) ) }
			</div>

			<Button isSecondary onClick={ openModal } label={ buttonLabel }>
				{ buttonText }
			</Button>
		</div>
	);
};

export default SocialPreviewsPanel;
