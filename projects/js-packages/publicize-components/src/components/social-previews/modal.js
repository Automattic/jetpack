/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

import { Button, Modal, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useAvailableSerivces } from './use-available-services';
import { usePostData } from './use-post-data';
import './modal.scss';

const SocialPreviewsModal = function SocialPreviewsModal( { onClose, initialTabName } ) {
	const availableServices = useAvailableSerivces();
	const { image, media, title, description, url } = usePostData();

	return (
		<Modal
			onRequestClose={ onClose }
			className="jetpack-social-previews__modal"
			__experimentalHideHeader
		>
			<Button
				className="jetpack-social-previews__modal--close-btn"
				onClick={ onClose }
				icon={ close }
				label={ __( 'Close', 'jetpack' ) }
			/>
			<TabPanel
				className="jetpack-social-previews__modal-previews"
				tabs={ availableServices }
				initialTabName={ initialTabName }
			>
				{ tab => (
					<div>
						<tab.preview
							// pass only the props that are common to all previews
							title={ title }
							description={ description }
							url={ url }
							image={ image }
							media={ media }
						/>
					</div>
				) }
			</TabPanel>
		</Modal>
	);
};

export default SocialPreviewsModal;
