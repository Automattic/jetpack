/*
	 Copied markup from calypso blue marketing/sharing-buttons page.
	 (wordpress.com/marketing/sharing-buttons)
  	@TODO: The goal here is to implement the same markup and styles as Calypso, in order to achieve feature parity.
 */
import { ButtonGroup } from '@wordpress/components';
import SocialIcon from 'social-logos';
import availableServices from '../available-services';
import SharingButton from './sharing-button';

import './sharing-buttons-container.scss';

function SharingButtonsContainer( { selectedServices, onServiceClick } ) {
	return (
		<div className="editor-sharing-buttons">
			<ButtonGroup className="editor-sharing-buttons__services">
				{ Object.keys( availableServices ).map( service => (
					<SharingButton
						className={ `editor-sharing-buttons__button share-${ service }` }
						key={ service }
						selected={ selectedServices.includes( service ) }
						onClick={ () => {
							onServiceClick( service );
						} }
					>
						<SocialIcon icon={ availableServices[ service ].icon } size={ 24 } />
						<span className="editor-sharing-buttons__service-label">
							{ availableServices[ service ].label }
						</span>
					</SharingButton>
				) ) }
			</ButtonGroup>
		</div>
	);
}

export default SharingButtonsContainer;
