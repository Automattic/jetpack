import SocialButton from './components/social-button';

function SaveSharingButtons( { attributes, className } ) {
	const hasServices = ( attributes.services?.length ?? 0 ) > 1;

	return hasServices ? (
		<div className={ className }>
			<ul sharingEventsAdded="true" className="jetpack-sharing-buttons__sharing-services-list">
				{ attributes.services.map( service => (
					<li className="jetpack-sharing-buttons__sharing-service-selected">
						<SocialButton service={ service } post={ attributes.post } />
					</li>
				) ) }
			</ul>
		</div>
	) : null;
}

export default SaveSharingButtons;
