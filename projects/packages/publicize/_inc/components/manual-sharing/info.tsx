import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { ComponentPropsWithoutRef } from 'react';

export type ManualSharingInfoProps = Omit< ComponentPropsWithoutRef< typeof Text >, 'children' >;

/**
 * Manual sharing info component.
 *
 * @param {ManualSharingInfoProps} props - Component props.
 *
 * @return {import('react').ReactNode} Manual sharing information component.
 */
export function ManualSharingInfo( { ...textProps }: ManualSharingInfoProps ) {
	return (
		<Text { ...textProps }>
			{ __(
				`Just tap the social network or "Copy to Clipboard" icon, and we'll format your content for sharing.`,
				'jetpack-publicize-pkg'
			) }
			<Link openInNewTab href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }>
				{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
			</Link>
		</Text>
	);
}
