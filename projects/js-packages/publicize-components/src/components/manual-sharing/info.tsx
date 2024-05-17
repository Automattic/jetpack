import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export type ManualSharingInfoProps = React.ComponentPropsWithoutRef< typeof Text >;

/**
 * Manual sharing info component.
 *
 * @param {ManualSharingInfoProps} props - Component props.
 *
 * @returns {import('react').ReactNode} Manual sharing information component.
 */
export function ManualSharingInfo( { ...textProps }: ManualSharingInfoProps ) {
	return (
		<Text { ...textProps }>
			{ __(
				`Just tap the social network or "Copy to Clipboard" icon, and we'll format your content for sharing.`,
				'jetpack'
			) }
			&nbsp;
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }>
				{ __( 'Learn more', 'jetpack' ) }
			</ExternalLink>
		</Text>
	);
}
