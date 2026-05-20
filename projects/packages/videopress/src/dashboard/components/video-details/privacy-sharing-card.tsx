import { SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
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
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Privacy & sharing', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
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
			</Card.Content>
		</Card.Root>
	);
}
