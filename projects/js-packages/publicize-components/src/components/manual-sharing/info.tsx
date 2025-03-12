import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export type ManualSharingInfoProps = Omit<
	React.ComponentPropsWithoutRef< typeof Text >,
	'children'
>;

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
				'jetpack-publicize-components'
			) }
			&nbsp;
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }>
				{ __( 'Learn more', 'jetpack-publicize-components' ) }
			</ExternalLink>
		</Text>
	);
}
