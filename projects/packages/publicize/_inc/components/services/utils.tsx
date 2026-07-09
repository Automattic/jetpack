import { SocialServiceIcon } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { ConnectionService } from '../../types';
import { assetUrl } from '../../utils';
import { ServiceUiDetails } from './types';

const connectionsFacebook = assetUrl( 'connections-facebook.webp' );
const connectionsInstagramBusiness = assetUrl( 'connections-instagram-business.webp' );
const connectionsLinkedin = assetUrl( 'connections-linkedin.webp' );
const connectionsNextdoor = assetUrl( 'connections-nextdoor.webp' );
const connectionsThreads = assetUrl( 'connections-threads.webp' );
const connectionsTumblr = assetUrl( 'connections-tumblr.webp' );

/**
 * Get the UI details for a given service.
 *
 * @param id - The ID of the service.
 *
 * @return The UI details for the service.
 */
export function getServiceUiDetails( id: ConnectionService[ 'id' ] ): ServiceUiDetails {
	switch ( id ) {
		case 'bluesky':
			return {
				needsCustomInputs: true,
				icon: props => <SocialServiceIcon serviceName="bluesky" { ...props } />,
				description: __( 'Share with your network.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ __(
								'To share to Bluesky please enter your Bluesky handle and app password below, then click connect.',
								'jetpack-publicize-pkg'
							) }
						</>
					),
				],
			};
		case 'facebook':
			return {
				icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
				description: __( 'Share to your pages', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ createInterpolateElement(
								__(
									'<strong>Connect</strong> to automatically share posts on your Facebook page.',
									'jetpack-publicize-pkg'
								),
								{ strong: <strong></strong> }
							) }
						</>
					),
					() => (
						<img
							src={ connectionsFacebook }
							alt={ __( 'Add Facebook connection', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};

		case 'instagram-business':
			return {
				icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
				description: __( 'Share to your Instagram Business account.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ __(
								'Drive engagement and save time by automatically sharing images to Instagram when you publish blog posts.',
								'jetpack-publicize-pkg'
							) }
							<div className="instagram-business__requirements">
								<h4>{ __( 'Requirements for connecting Instagram:', 'jetpack-publicize-pkg' ) }</h4>
								<ol>
									<li>
										{ __(
											'You must have an Instagram Business account.',
											'jetpack-publicize-pkg'
										) }
									</li>
									<li>
										{ __(
											'Your Instagram Business account must be linked to a Facebook page.',
											'jetpack-publicize-pkg'
										) }
									</li>
								</ol>
							</div>
							{ createInterpolateElement(
								__(
									"<i>When you click “connect” you'll be asked to <strong>log into Facebook</strong>. If your Instagram Business account isn't listed, ensure it's linked to a Facebook page.</i>",
									'jetpack-publicize-pkg'
								),
								{ strong: <strong></strong>, i: <em></em> }
							) }
							<br />
							<br />
							<Link
								openInNewTab
								className="instagram-business__help-link"
								href="https://jetpack.com/redirect/?source=jetpack-social-instagram-business-help"
							>
								{ __(
									'Learn how to convert & link your Instagram account.',
									'jetpack-publicize-pkg'
								) }
							</Link>
						</>
					),
					() => (
						<img
							src={ connectionsInstagramBusiness }
							alt={ __( 'Add Instagram photo', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};

		case 'linkedin':
			return {
				icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
				description: __( 'Share with your LinkedIn community.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ createInterpolateElement(
								__(
									'<strong>Connect</strong> to automatically share posts with your LinkedIn connections.',
									'jetpack-publicize-pkg'
								),
								{ strong: <strong></strong> }
							) }
						</>
					),
					() => (
						<img
							src={ connectionsLinkedin }
							alt={ __( 'Add LinkedIn connection', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};

		case 'mastodon':
			return {
				needsCustomInputs: true,
				icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
				description: __( 'Share with your network.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ __(
								'To share to Mastodon please enter your Mastodon username below, then click connect.',
								'jetpack-publicize-pkg'
							) }
						</>
					),
				],
			};

		case 'nextdoor':
			return {
				icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
				description: __( 'Share on communities', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ createInterpolateElement(
								__(
									'<strong>Connect</strong> with friends, neighbors, and local businesses by automatically sharing your posts to Nextdoor.',
									'jetpack-publicize-pkg'
								),
								{ strong: <strong></strong> }
							) }
						</>
					),
					() => (
						<img
							src={ connectionsNextdoor }
							alt={ __( 'Add Instagram photo', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};

		case 'threads':
			return {
				icon: props => <SocialServiceIcon serviceName="threads" { ...props } />,
				description: __( 'Share posts to your Threads feed.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ __(
								'Increase your presence in social media by sharing your posts automatically to Threads.',
								'jetpack-publicize-pkg'
							) }
						</>
					),
					() => (
						<img
							src={ connectionsThreads }
							alt={ __( 'Add Threads connection', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};

		case 'tumblr':
			return {
				icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
				description: __( 'Share to your Tumblr blog.', 'jetpack-publicize-pkg' ),
				examples: [
					() => (
						<>
							{ createInterpolateElement(
								__(
									'<strong>Connect</strong> to automatically share posts to your Tumblr blog.',
									'jetpack-publicize-pkg'
								),
								{ strong: <strong></strong> }
							) }
						</>
					),
					() => (
						<img
							src={ connectionsTumblr }
							alt={ __( 'Add Tumblr connection', 'jetpack-publicize-pkg' ) }
						/>
					),
				],
			};
	}
}
