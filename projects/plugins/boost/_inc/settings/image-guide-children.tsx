import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

declare global {
	const Jetpack_Boost: { site: { url: string; online?: boolean }; canResizeImages?: boolean };
}

/**
 * Image Guide sub-controls. The module itself is a simple toggle —
 * the only inline affordance the legacy dashboard surfaces is a
 * warning Notice when the server can't resize images (Imagick / GD
 * extensions missing). This component renders that warning when
 * `Jetpack_Boost.canResizeImages` is `false`.
 *
 * @return The Image Guide sub-controls.
 */
export default function ImageGuideChildren(): JSX.Element | null {
	if ( Jetpack_Boost?.canResizeImages !== false ) {
		return null;
	}
	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'Image resizing is unavailable', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				{ __(
					"Your server doesn't have the Imagick or GD extensions installed. Boost will still highlight oversized images, but it can't help you produce smaller copies until one of those is enabled. Ask your host to turn one on.",
					'jetpack-boost'
				) }
			</Notice.Description>
		</Notice.Root>
	);
}
