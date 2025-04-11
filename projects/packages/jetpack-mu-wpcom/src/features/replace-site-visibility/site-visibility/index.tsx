import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { useState } from 'react';
import { wpcomTrackEvent } from '../../../common/tracks';
import SitePreviewLink from '../site-preview-link';
import type { SitePreviewLinkObject } from '../site-preview-link';
import './style.scss';

interface Props {
	homeUrl: string;
	isWpcomStagingSite: boolean;
	isUnlaunchedSite: boolean;
	hasSitePreviewLink: boolean;
	sitePreviewLink?: SitePreviewLinkObject;
	sitePreviewLinkNonce: string;
	blogPublic: number;
	wpcomComingSoon: number;
	wpcomPublicComingSoon: number;
	wpcomDataSharingOptOut: boolean;
}

const SiteVisibility = ( {
	homeUrl,
	isWpcomStagingSite,
	isUnlaunchedSite,
	hasSitePreviewLink,
	sitePreviewLink,
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

	const { blogPublic, wpcomComingSoon, wpcomPublicComingSoon, wpcomDataSharingOptOut } = fields;

	const { host } = new URL( homeUrl );
	const isWpcomStagingDomain = host.endsWith( '.wpcomstaging.com' );

	// isPrivateAndUnlaunched means it is an unlaunched coming soon v1 site
	const isPrivateAndUnlaunched = -1 === blogPublic && isUnlaunchedSite;
	const isAnyComingSoonEnabled =
		( 0 === blogPublic && wpcomPublicComingSoon ) || isPrivateAndUnlaunched || wpcomComingSoon;
	const isPublicChecked = ( blogPublic === 0 && ! wpcomPublicComingSoon ) || blogPublic === 1;
	const showPreviewLink =
		Number( defaultWpcomPublicComingSoon ) === 1 && isAnyComingSoonEnabled && hasSitePreviewLink;
	const discourageSearchChecked =
		( 0 === blogPublic && ! wpcomPublicComingSoon ) || isWpcomStagingDomain;

	return (
		<>
			<p className="description">
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
						<SitePreviewLink
							homeUrl={ homeUrl }
							sitePreviewLink={ sitePreviewLink }
							sitePreviewLinkNonce={ sitePreviewLinkNonce }
						/>
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
							: __( 'Your site is visible to everyone.', 'jetpack-mu-wpcom', 0 ) }
					</p>
					{ isPublicChecked && ! isWpcomStagingSite && (
						<ul>
							<li>
								<label htmlFor="wpcom_site_visibility_discourage_search">
									<input
										id="wpcom_site_visibility_discourage_search"
										name="blog_public"
										type="checkbox"
										value="0"
										checked={ discourageSearchChecked }
										// See https://github.com/Automattic/wp-calypso/issues/101828.
										disabled={ isWpcomStagingDomain }
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
								{ isWpcomStagingDomain && (
									<div className="notice notice-warning inline">
										<p>
											{ createInterpolateElement(
												sprintf(
													// translators: %s: the primary domain of the site
													__(
														"Your site's current primary domain is <strong>%s</strong>. This domain is intended for temporary use and will not be indexed by search engines. To ensure your site can be indexed, please <link1>register</link1> or <link2>connect a custom primary domain</link2>.",
														'jetpack-mu-wpcom'
													),
													host
												),
												{
													strong: <strong />,
													br: <br />,
													link1: (
														<ExternalLink
															href={ `https://wordpress.com/domains/add/${ host }?redirect_to=${ window.location.href }` }
															target="_blank"
															onClick={ () =>
																wpcomTrackEvent( 'wpcom_settings_reading_add_domain_button_click' )
															}
														/>
													),
													link2: (
														<ExternalLink
															href={ `https://wordpress.com/domains/manage/${ host }?source=${ window.location.pathname }` }
															target="_blank"
															onClick={ () =>
																wpcomTrackEvent(
																	'wpcom_settings_reading_manage_domain_button_click'
																)
															}
														/>
													),
												}
											) }
										</p>
									</div>
								) }
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
										host
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
			<input type="hidden" name="wpcom_coming_soon" value={ wpcomComingSoon ? 1 : 0 } />
			<input
				type="hidden"
				name="wpcom_public_coming_soon"
				value={ wpcomPublicComingSoon ? 1 : 0 }
			/>
			<input
				type="hidden"
				name="wpcom_data_sharing_opt_out"
				value={ wpcomDataSharingOptOut ? 1 : 0 }
			/>
		</>
	);
};

export default SiteVisibility;
