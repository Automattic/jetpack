import { SocialServiceIcon } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import connectionsFacebook from '../../assets/connections-facebook.png';
import connectionsInstagramBusiness from '../../assets/connections-instagram-business.png';
import connectionsLinkedin from '../../assets/connections-linkedin.png';
import connectionsNextdoor from '../../assets/connections-nextdoor.png';
import connectionsThreads from '../../assets/connections-threads.png';
import connectionsTumblr from '../../assets/connections-tumblr.png';
import { store } from '../../social-store';
import { ConnectionService } from '../../social-store/types';

export type Badge = {
	text: string;
	style?: React.CSSProperties;
};

export interface SupportedService extends ConnectionService {
	icon: React.ComponentType< { iconSize: number } >;
	examples?: Array< React.ComponentType >;
	needsCustomInputs?: boolean;
	badges?: Array< Badge >;
}

/**
 * Get the list of supported services.
 *
 * @returns {Array< SupportedService >} The list of supported services
 */
export function useSupportedServices(): Array< SupportedService > {
	const availableServices = useSelect( select => {
		return select( store )
			.getServices()
			.reduce< Record< string, ConnectionService > >(
				( serviceData, service ) => ( {
					...serviceData,
					[ service.ID ]: service,
				} ),
				{}
			);
	}, [] );

	const badgeNew: Badge = {
		text: __( 'New', 'jetpack' ),
		style: { background: '#e9eff5', color: '#0675C4' },
	};

	const supportedServices: Array< SupportedService > = [
		{
			...availableServices.facebook,
			icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
			description: __( 'Share to your pages', 'jetpack' ),
			examples: [
				() => (
					<>
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
					<img src={ connectionsFacebook } alt={ __( 'Add Facebook connection', 'jetpack' ) } />
				),
			],
		},
		{
			...availableServices[ 'instagram-business' ],
			icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
			description: __( 'Share to your Instagram Business account.', 'jetpack' ),
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
			...availableServices.threads,
			icon: props => <SocialServiceIcon serviceName="threads" { ...props } />,
			description: __( 'Share posts to your Threads feed.', 'jetpack' ),
			badges: [ badgeNew ],
			examples: [
				() => (
					<>
						{ __(
							'Increase your presence in social media by sharing your posts automatically to Threads.',
							'jetpack'
						) }
					</>
				),
				() => <img src={ connectionsThreads } alt={ __( 'Add Threads connection', 'jetpack' ) } />,
			],
		},
		{
			...availableServices.linkedin,
			icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
			description: __( 'Share with your LinkedIn community.', 'jetpack' ),
			examples: [
				() => (
					<>
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
					<img src={ connectionsLinkedin } alt={ __( 'Add LinkedIn connection', 'jetpack' ) } />
				),
			],
		},
		{
			...availableServices.nextdoor,
			icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
			description: __( 'Share on communities', 'jetpack' ),
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
			...availableServices.tumblr,
			icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
			description: __( 'Share to your Tumblr blog.', 'jetpack' ),
			examples: [
				() => (
					<>
						{ createInterpolateElement(
							__(
								'<strong>Connect</strong> to automatically share posts to your Tumblr blog.',
								'jetpack'
							),
							{ strong: <strong></strong> }
						) }
					</>
				),
				() => <img src={ connectionsTumblr } alt={ __( 'Add Tumblr connection', 'jetpack' ) } />,
			],
		},
		{
			...availableServices.mastodon,
			needsCustomInputs: true,
			icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
			description: __( 'Share with your network.', 'jetpack' ),
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
	return supportedServices.filter(
		// Return only the ones that are present in the available services.
		service => Boolean( service.ID )
	);
}
