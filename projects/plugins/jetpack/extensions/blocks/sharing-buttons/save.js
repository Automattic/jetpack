import SocialButton from './components/SocialButton';

function SaveSharingButtons({ attributes }) {
	return (
		<div className="wp-block-jetpack-sharing-buttons">
			<ul sharingEventsAdded="true" className={`jetpack-sharing-buttons__sharing-services-list`}>
				{attributes.services?.map(service => (
					<li className={`jetpack-sharing-buttons__sharing-service-selected`}>
						<SocialButton service={service} post={attributes.post} />
					</li>
				))}
			</ul>
		</div>
	);
}

export default SaveSharingButtons;
