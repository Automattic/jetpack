/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal, TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { AVAILABLE_SERVICES } from './constants';
import { SocialServiceIcon } from '../../shared/icons';

const SocialPreviewsModal = function SocialPreviewsModal( { onClose } ) {
	return (
		<Modal
			onRequestClose={ onClose }
			title={ __( 'Social Previews', 'jetpack' ) }
			className="jetpack-social-previews__modal"
		>
			<TabPanel className="jetpack-social-previews__tabs" tabs={ AVAILABLE_SERVICES }>
				{ tab => (
					<div>
						Selected preview: { tab.title }
						<tab.preview
							title="Five for the Future"
							description="Launched in 2014, Five for the Future encourages organizations to contribute five percent of their resources to WordPress development. WordPress co-founder Matt Mullenweg proposed this benchmark to maintain a “golden ratio” of contributors to users."
							url="https://wordpress.org/five-for-the-future/"
							author="Matt Mullenweg"
						/>
					</div>
				) }
			</TabPanel>
		</Modal>
	);
};

export default SocialPreviewsModal;
