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

			{ showUpgradeNudge ? (
				<Button isSecondary label={ __( 'Learn more about paid plans', 'jetpack' ) }>
					{ __( 'Learn more', 'jetpack' ) }
				</Button>
			) : (
				<Button isSecondary onClick={ openModal } label={ __( 'Open Social Previews', 'jetpack' ) }>
					{ __( 'Preview', 'jetpack' ) }
				</Button>
			) }
		</div>
	);
};

export default SocialPreviewsPanel;
