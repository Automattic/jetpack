import { ToggleControl } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';
import { getQueryArg, addQueryArgs } from '@wordpress/url';
import { useState } from 'react';
import './style.scss';

export type SitePreviewLink = {
	code: string;
	created_at: string;
};

interface Props {
	homeUrl: string;
	siteId: number;
	siteSlug: string;
	isWpcomStagingSite: boolean;
	isUnlaunchedSite: boolean;
	hasSitePreviewLink: boolean;
	sitePreviewLink?: SitePreviewLink;
	sitePreviewLinkNonce: string;
	blogPublic: number;
	wpcomComingSoon: number;
	wpcomPublicComingSoon: number;
	wpcomDataSharingOptOut: boolean;
}

const makeSitePreviewLink = ( homeUrl: string, share: string ) => {
	if ( ! share ) {
		return '';
	}

	return addQueryArgs( homeUrl, {
		share,
	} );
};

const SiteVisibility = ( {
	homeUrl,
	siteSlug,
	isWpcomStagingSite,
	isUnlaunchedSite,
	hasSitePreviewLink,
	sitePreviewLink: defaultSitePreviewLink,
	sitePreviewLinkNonce,
	blogPublic: defaultBlogPublic,
	wpcomComingSoon: defaultWpcomComingSoon,
	wpcomPublicComingSoon: defaultWpcomPublicComingSoon,
	wpcomDataSharingOptOut: defaultWpcomDataSharingOptOut,
}: Props ) => {
	const [ fields, updateFields ] = useState( {
		blogPublic: Number( defaultBlogPublic ),
		wpcomComingSoon: Number( defaultWpcomComingSoon ) === 1,
		wpcomPublicComingSoon: Number( defaultWpcomPublicComingSoon ) === 1,
		wpcomDataSharingOptOut: defaultWpcomDataSharingOptOut,
	} );

	const [ isSitePreviewEnabled, setIsEnabledSitePreview ] = useState( !! defaultSitePreviewLink );
	const [ sitePreviewLink, setSitePreviewLink ] = useState(
		makeSitePreviewLink( homeUrl, defaultSitePreviewLink?.code )
	);
	const [ isLoadingSitePreviewLink, setIsLoadingSitePreviewLink ] = useState( false );
	const [ clipboardCopied, setClipboardCopied ] = useState( false );
	const ref = useCopyToClipboard( sitePreviewLink, () => setClipboardCopied( true ) );

	const { blogPublic, wpcomComingSoon, wpcomPublicComingSoon, wpcomDataSharingOptOut } = fields;

	const isPrivateAndUnlaunched = -1 === blogPublic && isUnlaunchedSite;
	const isAnyComingSoonEnabled =
		( 0 === blogPublic && wpcomPublicComingSoon ) || isPrivateAndUnlaunched || wpcomComingSoon;
	const isPublicChecked = ( blogPublic === 0 && ! wpcomPublicComingSoon ) || blogPublic === 1;
	const showPreviewLink =
		Number( defaultWpcomPublicComingSoon ) === 1 && isAnyComingSoonEnabled && hasSitePreviewLink;
	const discourageSearchChecked = 0 === blogPublic && ! wpcomPublicComingSoon;

	const generateSitePreviewLink = () => {
		setIsLoadingSitePreviewLink( true );
		const data = new URLSearchParams( {
			action: 'wpcom_generate_site_preview_link',
			_ajax_nonce: sitePreviewLinkNonce,
		} );

		fetch( 'admin-ajax.php', {
			method: 'POST',
			body: data,
		} )
			.then( response => response.json() )
			.then( ( currentSitePreviewLink: SitePreviewLink ) => {
				setSitePreviewLink( makeSitePreviewLink( homeUrl, currentSitePreviewLink.code ) );
				setIsLoadingSitePreviewLink( false );
			} );
	};

	const deleteSitePreviewLink = () => {
		setIsLoadingSitePreviewLink( true );

		const code = getQueryArg( sitePreviewLink, 'share' ) as string | undefined;
		const data = new URLSearchParams( {
			action: 'wpcom_delete_site_preview_link',
			code: code ?? '',
			_ajax_nonce: sitePreviewLinkNonce,
		} );

		fetch( 'admin-ajax.php', {
			method: 'POST',
			body: data,
		} ).then( () => {
			setSitePreviewLink( '' );
			setIsLoadingSitePreviewLink( false );
		} );
	};

	const handleSitePreviewLinkChange = checked => {
		setIsEnabledSitePreview( checked );
		if ( checked ) {
			generateSitePreviewLink();
		} else {
			deleteSitePreviewLink();
		}
	};

	return (
		<>
			<input type="hidden" name="wpcom_coming_soon" value={ wpcomComingSoon ? 1 : 0 } />
			<input
				type="hidden"
				name="wpcom_public_coming_soon"
				value={ fields.wpcomPublicComingSoon ? 1 : 0 }
			/>
			<p>
				{ __( 'Control who can view your site.', 'jetpack-mu-wpcom' ) }
				&nbsp;
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
					<label htmlFor="wpcom_site_visibility_coming_soon">
						<input
							type="radio"
							id="wpcom_site_visibility_coming_soon"
							name="blog_public"
							value="0"
							className="tog"
							checked={ isAnyComingSoonEnabled }
							onChange={ () =>
								updateFields( {
									blogPublic: 0,
									wpcomComingSoon: false,
									wpcomPublicComingSoon: true,
									wpcomDataSharingOptOut: false,
								} )
							}
						/>
						{ __( 'Coming Soon', 'jetpack-mu-wpcom' ) }
					</label>
					<p className="description">
						{ __(
							'Your site is hidden from visitors behind a "Coming Soon" notice until it is ready for viewing.',
							'jetpack-mu-wpcom'
						) }
					</p>
					{ showPreviewLink && (
						<ul>
							<li>
								<p>
									{ __(
										'Enable "Share site" to let collaborators without an account view your site.',
										'jetpack-mu-wpcom'
									) }
								</p>
								<ToggleControl
									__nextHasNoMarginBottom
									label={
										<>
											{ __( 'Share site', 'jetpack-mu-wpcom' ) }
											{ isLoadingSitePreviewLink && (
												<img src="images/loading.gif" alt="Loading..." width="16" height="16"></img>
											) }
										</>
									}
									checked={ !! isSitePreviewEnabled }
									disabled={ isLoadingSitePreviewLink }
									onChange={ handleSitePreviewLinkChange }
								/>
							</li>
							{ isSitePreviewEnabled && sitePreviewLink && (
								<li>
									<input type="url" className="regular-text" readOnly value={ sitePreviewLink } />
									<div className="copy-to-clipboard-container">
										<button
											type="button"
											className="button button-small"
											ref={ ref }
											onMouseLeave={ () => setClipboardCopied( false ) }
										>
											{ __( 'Copy URL to clipboard', 'jetpack-mu-wpcom' ) }
										</button>
										{ clipboardCopied && (
											<span className="success" aria-hidden="true">
												{ __( 'Copied!', 'jetpack-mu-wpcom' ) }
											</span>
										) }
									</div>
									<p className="description">
										{ __( 'Anyone with the link can view your site.', 'jetpack-mu-wpcom' ) }
									</p>
								</li>
							) }
						</ul>
					) }
				</li>
				<li>
					<label htmlFor="wpcom_site_visibility_public">
						<input
							type="radio"
							id="wpcom_site_visibility_public"
							name="blog_public"
							value="1"
							className="tog"
							checked={ isPublicChecked }
							onChange={ () =>
								updateFields( {
									blogPublic: isWpcomStagingSite ? 0 : 1,
									wpcomComingSoon: false,
									wpcomPublicComingSoon: false,
									wpcomDataSharingOptOut: false,
								} )
							}
						/>
						{ __( 'Public', 'jetpack-mu-wpcom' ) }
					</label>
					<p className="description">
						{ isWpcomStagingSite
							? __(
									'Your site is visible to everyone, but search engines are discouraged from indexing staging sites.',
									'jetpack-mu-wpcom'
							  )
							: __( 'Your site is visible to everyone.', 'jetpack-mu-wpcom' ) }
					</p>
					{ ! isWpcomStagingSite && (
						<ul>
							<li>
								<label htmlFor="wpcom_site_visibility_discourage_search">
									<input
										id="wpcom_site_visibility_discourage_search"
										name="blog_public"
										type="checkbox"
										value="0"
										checked={ discourageSearchChecked }
										onChange={ () =>
											updateFields( {
												blogPublic:
													wpcomPublicComingSoon || blogPublic === -1 || blogPublic === 1 ? 0 : 1,
												wpcomComingSoon: false,
												wpcomPublicComingSoon: false,
												wpcomDataSharingOptOut: true,
											} )
										}
									/>
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
								<label htmlFor="wpcom_site_visibility_data_sharing_opt_out">
									<input
										id="wpcom_site_visibility_data_sharing_opt_out"
										name="wpcom_data_sharing_opt_out"
										type="checkbox"
										value="true"
										checked={
											( wpcomDataSharingOptOut && ! wpcomPublicComingSoon ) ||
											discourageSearchChecked
										}
										disabled={ discourageSearchChecked }
										onChange={ () =>
											updateFields( {
												blogPublic:
													blogPublic === 1 || wpcomPublicComingSoon || blogPublic === -1 ? 1 : 0,
												wpcomComingSoon: false,
												wpcomPublicComingSoon: false,
												wpcomDataSharingOptOut: ! wpcomDataSharingOptOut,
											} )
										}
									/>
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
									&nbsp;
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
					) }
				</li>
				<li>
					<label htmlFor="wpcom_site_visibility_private">
						<input
							type="radio"
							id="wpcom_site_visibility_private"
							name="blog_public"
							value="-1"
							className="tog"
							checked={ -1 === blogPublic && ! wpcomComingSoon && ! isPrivateAndUnlaunched }
							onChange={ () =>
								updateFields( {
									blogPublic: -1,
									wpcomComingSoon: false,
									wpcomPublicComingSoon: false,
									wpcomDataSharingOptOut: false,
								} )
							}
						/>
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
