/**
	 Copied markup from calypso blue marketing/sharing-buttons page.
	 (wordpress.com/marketing/sharing-buttons)

  @TODO: The goal here is to implement the same markup and styles as Calypso, in order to achieve feature parity.
*/
import SocialIcon from 'social-logos';
import { SVG, ButtonGroup, Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import availableServices from '../available-services';
import EditorSharingButton from './EditorSharingButton';
import './EditorSharingButtons.scss';

function EditorSharingButtons({ selectedServices, onServiceClick }) {
	return (
		<div className="editor-sharing-buttons">
			<ButtonGroup className="editor-sharing-buttons__services">
				{Object.keys(availableServices).map(service => (
					<EditorSharingButton
						className={`editor-sharing-buttons__button share-${service}`}
						key={service}
						selected={selectedServices.includes(service)}
						onClick={() => {
							onServiceClick(service);
						}}
					>
						<SocialIcon icon={availableServices[service].icon} size={24} />
						<span className="editor-sharing-buttons__service-label">
							{availableServices[service].label}
						</span>
					</EditorSharingButton>
				))}
			</ButtonGroup>
		</div>
	);
}

export default EditorSharingButtons;
