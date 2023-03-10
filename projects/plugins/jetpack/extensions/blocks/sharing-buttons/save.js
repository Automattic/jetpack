function SaveSharingButtons({ attributes }) {
	return (
		<div className="wp-block-jetpack-sharing-buttons">
			<div className="cool_sharing_elements">
				<div className="sharedaddy sd-sharing-enabled">
					<div className="robots-nocontent sd-block sd-social sd-social-icon-text sd-sharing">
						<h3 className="sd-title">Share this:</h3>
						<div className="sd-content">
							<ul sharingEventsAdded="true">
								<li className="share-twitter">
									<a
										rel="nofollow noopener noreferrer"
										shared="sharing-twitter-1"
										className="share-twitter sd-button share-icon"
										href={`${attributes.link}/?share=twitter&amp;nb=1"`}
										target="_blank"
										title="Click to share on Twitter"
									>
										<span>Twitter</span>
									</a>
								</li>
								<li className="share-facebook">
									<a
										rel="nofollow noopener noreferrer"
										shared="sharing-facebook-1"
										className="share-facebook sd-button share-icon"
										href={`${attributes.link}/?share=facebook&amp;nb=1"`}
										target="_blank"
										title="Click to share on Facebook"
									>
										<span>Facebook</span>
									</a>
								</li>
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
