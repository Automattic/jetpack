import { sprintf, __ } from '@wordpress/i18n';
import './style.scss';

interface Props {
	siteId: number;
	siteSlug: string;
	shareSiteLink?: string;
	shareSiteNonce: string;
}

const SiteVisibility = ( { siteSlug, shareSiteLink, shareSiteNonce }: Props ) => {
	return (
		<>
			<p>
				{ __( 'Control who can view your site.', 'jetpack-mu-wpcom' ) }
				<a
					href="https://wordpress.com/support/privacy-settings/"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
				</a>
			</p>
			<ul>
				<li>
					<label htmlFor="blog_public">
						<input type="radio" name="blog_public" value="0" className="tog" />
						{ __( 'Coming Soon', 'jetpack-mu-wpcom' ) }
					</label>
					<p className="description">
						{ __(
							'Your site is hidden from visitors behind a "Coming Soon" notice until it is ready for viewing.',
							'jetpack-mu-wpcom'
						) }
					</p>
					<ul>
						<li>
							<p>
								{ __(
									'Enable "Share site" to let collaborators without an account view your site.',
									'jetpack-mu-wpcom'
								) }
							</p>
							<input
								type="hidden"
								name="wpcom_site_visibility_share_site_link_nonce"
								value={ shareSiteNonce }
							/>
							{ shareSiteLink && (
								<input
									className="button-secondary generate"
									type="button"
									value={ __( 'Share site', 'jetpack-mu-wpcom' ) }
								/>
							) }
							{ shareSiteLink && (
								<>
									<span className="copy-to-clipboard-container">
										<button
											type="button"
											className="button button-small copy-attachment-url"
											data-clipboard-target="#attachment-details-two-column-copy-link"
										>
											{ __( 'Copy URL to clipboard', 'jetpack-mu-wpcom' ) }
										</button>
										<span className="success hidden" aria-hidden="true">
											{ __( 'Copied!', 'jetpack-mu-wpcom' ) }
										</span>
									</span>
									<p className="description">
										{ __( 'Anyone with the link can view your site.', 'jetpack-mu-wpcom' ) }
									</p>
								</>
							) }
						</li>
					</ul>
				</li>
				<li>
					<label htmlFor="blog_public">
						<input type="radio" name="blog_public" value="1" className="tog" />
						{ __( 'Public', 'jetpack-mu-wpcom' ) }
					</label>
					<p className="description">
						{ __( 'Your site is visible to everyone.', 'jetpack-mu-wpcom' ) }
					</p>
					<ul>
						<li>
							<label htmlFor="blog_public">
								<input name="blog_public" type="checkbox" value="0" />
								{ __( 'Discourage search engines from indexing this site', 'jetpack-mu-wpcom' ) }
							</label>
							<p className="description">
								{ __(
									'This option does not block access to your site — it is up to search engines to honor your request.',
									'jetpack-mu-wpcom'
								) }
							</p>
						</li>
						<li>
							<label htmlFor="wpcom_data_sharing_opt_out">
								<input name="wpcom_data_sharing_opt_out" type="checkbox" value="true" />
								{ sprintf(
									// translators: %s: the slug of the site
									__( 'Prevent third-party sharing for %s', 'jetpack-mu-wpcom' ),
									siteSlug
								) }
							</label>
							<p className="description">
								{ __(
									'This option will prevent this site’s content from being shared with our licensed network of content and research partners, including those that train AI models.',
									'jetpack-mu-wpcom'
								) }
								<a
									href="https://wordpress.com/support/privacy-settings/make-your-website-public/#prevent-third-party-sharing"
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
								</a>
							</p>
						</li>
					</ul>
				</li>
				<li>
					<label htmlFor="blog_public">
						<input type="radio" name="blog_public" value="-1" className="tog" />
						{ __( 'Private', 'jetpack-mu-wpcom' ) }
					</label>
					<p className="description">
						{ __(
							'Your site is only visible to you and logged-in members you approve. Everyone else will see a log in screen.',
							'jetpack-mu-wpcom'
						) }
					</p>
				</li>
			</ul>
		</>
	);
};

export default SiteVisibility;
