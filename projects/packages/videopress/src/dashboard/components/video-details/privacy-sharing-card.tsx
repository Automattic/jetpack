import { SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import type { LibraryItemPrivacy } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	privacy: LibraryItemPrivacy;
	displayEmbed: boolean;
	allowDownloads: boolean;
	onChange: ( partial: {
		privacy?: LibraryItemPrivacy;
		displayEmbed?: boolean;
		allowDownloads?: boolean;
	} ) => void;
};

const PRIVACY_OPTIONS: { label: string; value: LibraryItemPrivacy }[] = [
	{ label: __( 'Site default', 'jetpack-videopress-pkg' ), value: 'site-default' },
	{ label: __( 'Public', 'jetpack-videopress-pkg' ), value: 'public' },
	{ label: __( 'Private', 'jetpack-videopress-pkg' ), value: 'private' },
];

/**
 * Form card for privacy and sharing controls: a privacy SelectControl
 * and two ToggleControls for sharing and downloads.
 *
 * Collapsible, and collapsed by default. These are set-once settings that sit
 * beside the read-outs, so leaving all three expanded made the right-hand
 * column 400px taller than the canvas it sits next to. The current privacy
 * value rides in the header via `CollapsibleCard.HeaderDescription`, so
 * collapsing costs no information at a glance — you still see "Public" or
 * "Private" without opening anything.
 *
 * @param props                - Component props.
 * @param props.privacy        - Current privacy value.
 * @param props.displayEmbed   - Whether the share menu is displayed.
 * @param props.allowDownloads - Whether downloads are allowed.
 * @param props.onChange       - Partial-update handler from the form hook.
 * @return The card element.
 */
export default function PrivacySharingCard( {
	privacy,
	displayEmbed,
	allowDownloads,
	onChange,
}: Props ): ReactElement {
	const currentPrivacyLabel =
		PRIVACY_OPTIONS.find( option => option.value === privacy )?.label ?? '';

	return (
		<CollapsibleCard.Root>
			<CollapsibleCard.Header>
				<Stack direction="row" gap="sm" align="center" justify="space-between">
					<Card.Title>{ __( 'Privacy & sharing', 'jetpack-videopress-pkg' ) }</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<Text className="vp-video-details__summary">{ currentPrivacyLabel }</Text>
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
						value={ privacy }
						options={ PRIVACY_OPTIONS }
						onChange={ next => onChange( { privacy: next as LibraryItemPrivacy } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Share', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Display share menu and allow viewers to copy a link or embed this video',
							'jetpack-videopress-pkg'
						) }
						checked={ displayEmbed }
						onChange={ next => onChange( { displayEmbed: next } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Allow downloads', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Let viewers download this video to their device.',
							'jetpack-videopress-pkg'
						) }
						checked={ allowDownloads }
						onChange={ next => onChange( { allowDownloads: next } ) }
					/>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
