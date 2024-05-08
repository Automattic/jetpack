import { SocialServiceIcon } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import connectionsButtonFacebook from '../../assets/connections-button-facebook.png';
import connectionsButtonLinkedin from '../../assets/connections-button-linkedin.png';
import connectionsButtonTumblr from '../../assets/connections-button-tumblr.png';
import connectionsFacebook from '../../assets/connections-facebook.png';
import connectionsInstagramBusiness from '../../assets/connections-instagram-business.png';
import connectionsLinkedin from '../../assets/connections-linkedin.png';
import connectionsNextdoor from '../../assets/connections-nextdoor.png';
import connectionsTumblr from '../../assets/connections-tumblr.png';

const sharingButtonLink = 'https://wordpress.com/support/sharing/';

export interface SupportedService {
	title: string;
	icon: React.ComponentType< { iconSize: number } >;
	description: string;
	name: string;
	examples?: Array< React.ComponentType >;
}

export const getSupportedServices = (): SupportedService[] => {
	return [
		{
			title: __( 'Facebook', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
			description: __(
				"Facebook's massive active user base makes for a great place to share your posts and connect with your followers.",
				'jetpack'
			),
			name: 'facebook',
			examples: [
				() => (
					<>
						<img src={ connectionsFacebook } alt={ __( 'Add Facebook connection', 'jetpack' ) } />
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'<strong>Connect</strong> to automatically share posts on your Facebook page.',
								'jetpack'
							),
							{ strong: <strong></strong> }
						) }
					</>
				),
				() => (
					<>
						<img
							src={ connectionsButtonFacebook }
							alt={ __( 'Add Facebook connection', 'jetpack' ) }
						/>
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'Add a <link /> to your posts so readers can share your story with their friends.',
								'jetpack'
							),
							{
								strong: <strong></strong>,
								link: (
									<ExternalLink href={ sharingButtonLink }>
										{ __( 'sharing button', 'jetpack' ) }
									</ExternalLink>
								),
							}
						) }
					</>
				),
			],
		},
		{
			title: __( 'Instagram Business', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
			description: __(
				'Share photos from your site to your Instagram Business account.',
				'jetpack'
			),
			name: 'instagram',
			examples: [
				() => (
					<>
						{ __(
							'Drive engagement and save time by automatically sharing images to Instagram when you publish blog posts.',
							'jetpack'
						) }
						<div className="instagram-business__requirements">
							<h4>{ __( 'Requirements for connecting Instagram:', 'jetpack' ) }</h4>
							<ol>
								<li>{ __( 'You must have an Instagram Business account.', 'jetpack' ) }</li>
								<li>
									{ __(
										'Your Instagram Business account must be linked to a Facebook page.',
										'jetpack'
									) }
								</li>
							</ol>
						</div>
						{ createInterpolateElement(
							__(
								"<i>When you click “connect” you'll be asked to <strong>log into Facebook</strong>. If your Instagram Business account isn't listed, ensure it's linked to a Facebook page.</i>",
								'jetpack'
							),
							{ strong: <strong></strong>, i: <em></em> }
						) }
						<br />
						<br />
						<ExternalLink
							className="instagram-business__help-link"
							href="https://jetpack.com/redirect/?source=jetpack-social-instagram-business-help"
						>
							{ __( 'Learn how to convert & link your Instagram account.', 'jetpack' ) }
						</ExternalLink>
					</>
				),
				() => (
					<img
						src={ connectionsInstagramBusiness }
						alt={ __( 'Add Instagram photo', 'jetpack' ) }
					/>
				),
			],
		},
		{
			title: __( 'LinkedIn', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
			description: __(
				'Reach a professional audience and contribute valuable content by sharing your posts with the LinkedIn community.',
				'jetpack'
			),
			name: 'linkedin',
			examples: [
				() => (
					<>
						<img src={ connectionsLinkedin } alt={ __( 'Add LinkedIn connection', 'jetpack' ) } />
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'<strong>Connect</strong> to automatically share posts with your LinkedIn connections.',
								'jetpack'
							),
							{ strong: <strong></strong> }
						) }
					</>
				),
				() => (
					<>
						<img
							src={ connectionsButtonLinkedin }
							alt={ __( 'Add LinkedIn connection', 'jetpack' ) }
						/>
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'Add a <link /> to your posts so readers can share your story with their connections.',
								'jetpack'
							),
							{
								strong: <strong></strong>,
								link: (
									<ExternalLink href={ sharingButtonLink }>
										{ __( 'sharing button', 'jetpack' ) }
									</ExternalLink>
								),
							}
						) }
					</>
				),
			],
		},
		{
			title: __( 'Nextdoor', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
			description: __(
				'Share your posts with your local community on Nextdoor, facilitating meaningful interactions and fostering a sense of belonging among neighbors.',
				'jetpack'
			),
			name: 'nextdoor',
			examples: [
				() => (
					<>
						{ createInterpolateElement(
							__(
								'<strong>Connect</strong> with friends, neighbors, and local businesses by automatically sharing your posts to Nextdoor.',
								'jetpack'
							),
							{ strong: <strong></strong> }
						) }
					</>
				),
				() => <img src={ connectionsNextdoor } alt={ __( 'Add Instagram photo', 'jetpack' ) } />,
			],
		},
		{
			title: __( 'Tumblr', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
			description: __(
				'Share posts on your Tumblr blog to expand your reach to a diverse younger audience in a fun and creative community.',
				'jetpack'
			),
			name: 'tumblr',
			examples: [
				() => (
					<>
						<img src={ connectionsTumblr } alt={ __( 'Add Tumblr connection', 'jetpack' ) } />
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'<strong>Connect</strong> to automatically share posts to your Tumblr blog.',
								'jetpack'
							),
							{ strong: <strong></strong> }
						) }
					</>
				),
				() => (
					<>
						<img src={ connectionsButtonTumblr } alt={ __( 'Add Tumblr connection', 'jetpack' ) } />
						<br />
						<br />
						{ createInterpolateElement(
							__(
								'Add a <link /> to your posts so readers can share your story with their followers.',
								'jetpack'
							),
							{
								strong: <strong></strong>,
								link: (
									<ExternalLink href={ sharingButtonLink }>
										{ __( 'sharing button', 'jetpack' ) }
									</ExternalLink>
								),
							}
						) }
					</>
				),
			],
		},
		{
			title: __( 'Mastodon', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
			description: __(
				'Share your posts to an open-source social network with a community that values privacy and freedom.',
				'jetpack'
			),
			name: 'mastodon',
			examples: [
				() => (
					<>
						{ __(
							'To share to Mastodon please enter your Mastodon username below, then click connect.',
							'jetpack'
						) }
					</>
				),
			],
		},
	];
};
