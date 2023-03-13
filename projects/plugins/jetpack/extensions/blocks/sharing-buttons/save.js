import SocialButton from './components/SocialButton';

function SaveSharingButtons({ attributes }) {
	return (
		<div className="wp-block-jetpack-sharing-buttons">
			<div className="cool_sharing_elements">
				<div className="sharedaddy sd-sharing-enabled">
					<div className="robots-nocontent sd-block sd-social sd-social-icon-text sd-sharing">
						<h3 className="sd-title">Share this:</h3>
						<div className="sd-content">
							<ul sharingEventsAdded="true">
								{attributes.services?.map(service => (
									<li className={`share-${service}`}>
										<SocialButton service={service} post={attributes.post} />
									</li>
								))}
								<li className="share-end"></li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SaveSharingButtons;
