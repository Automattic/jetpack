import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { EMPTY_ARRAY } from '../../social-store/constants';
import type { ConnectionService } from '../../types';
import type { ReactNode } from 'react';

/**
 * One input a service needs before its connect popup can open.
 */
export type ConnectField = {
	/**
	 * The input name, which is also the connect URL param it maps to.
	 */
	name: string;
	type: 'text' | 'password';
	label: string;
	placeholder: string;
	/**
	 * Plain-text helper copy.
	 */
	description?: string;
	/**
	 * Helper copy carrying semantics (links, emphasis) that plain text cannot.
	 */
	details?: ReactNode;
};

/**
 * The sentence introducing a service's input step.
 *
 * @param id - The ID of the service.
 *
 * @return The intro copy, or `undefined` for services that need no inputs.
 */
export function getConnectIntro( id: ConnectionService[ 'id' ] ): string | undefined {
	switch ( id ) {
		case 'bluesky':
			return __(
				'To share to Bluesky please enter your Bluesky handle and app password below, then click Submit.',
				'jetpack-publicize-pkg'
			);

		case 'mastodon':
			return __(
				'To share to Mastodon please enter your Mastodon username below, then click Submit.',
				'jetpack-publicize-pkg'
			);

		default:
			return undefined;
	}
}

/**
 * The inputs a service needs before its connect popup can open.
 *
 * @param id - The ID of the service.
 *
 * @return The service's fields, empty for services that need no inputs.
 */
export function getConnectFields( id: ConnectionService[ 'id' ] ): Array< ConnectField > {
	switch ( id ) {
		case 'bluesky':
			return [
				{
					name: 'handle',
					type: 'text',
					label: _x( 'Handle', 'The handle of a social media account.', 'jetpack-publicize-pkg' ),
					placeholder: 'username.bsky.social',
					description: __(
						'You can find the handle in your Bluesky profile.',
						'jetpack-publicize-pkg'
					),
					details: createInterpolateElement(
						sprintf(
							/* translators: %s is the bluesky handle suffix like .bsky.social */
							__(
								'This can either be %s or just the domain name if you are using a custom domain.',
								'jetpack-publicize-pkg'
							),
							'<strong>username.bsky.social</strong>'
						),
						{
							strong: <strong />,
						}
					),
				},
				{
					name: 'app_password',
					type: 'password',
					label: __( 'App password', 'jetpack-publicize-pkg' ),
					placeholder: 'xxxx-xxxx-xxxx-xxxx',
					details: createInterpolateElement(
						__(
							'App password is needed to safely connect your account. App password is different from your account password. You can <link>generate it in Bluesky</link>.',
							'jetpack-publicize-pkg'
						),
						{
							link: (
								<Link
									openInNewTab
									href="https://bsky.app/settings/app-passwords"
									children={ null }
								/>
							),
						}
					),
				},
			];

		case 'mastodon':
			return [
				{
					name: 'instance',
					type: 'text',
					label: _x( 'Handle', 'The handle of a social media account.', 'jetpack-publicize-pkg' ),
					placeholder: '@username@mastodon.social',
					description: __(
						'You can find the handle in your Mastodon profile.',
						'jetpack-publicize-pkg'
					),
				},
			];

		default:
			return EMPTY_ARRAY;
	}
}
