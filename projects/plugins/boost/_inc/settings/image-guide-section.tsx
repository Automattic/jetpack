import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { useModulesState } from '../lib/use-modules-state';
import ModuleRow from './module-row';
import SectionCard from './section-card';

declare global {
	const Jetpack_Boost: { site: { url: string; online?: boolean }; canResizeImages?: boolean };
}

type Props = {
	modulesState: ReturnType< typeof useModulesState >[ 'data' ];
	isLoading: boolean;
};

/**
 * Image guide section. Just the overlay toggle plus a warning
 * Notice when the server can't resize images.
 *
 * @param props              - See `Props`.
 * @param props.modulesState
 * @param props.isLoading
 * @return The Image guide section card, or `null` when the module is
 *         unavailable on this install.
 */
export default function ImageGuideSection( {
	modulesState,
	isLoading,
}: Props ): JSX.Element | null {
	const state = modulesState?.image_guide;
	if ( state?.available === false ) {
		return null;
	}
	const canResize = Jetpack_Boost?.canResizeImages !== false;
	return (
		<SectionCard title={ __( 'Image guide', 'jetpack-boost' ) }>
			<ModuleRow
				slug="image_guide"
				state={ state }
				isLoading={ isLoading }
				label={ __( 'Activate overlay guide on site', 'jetpack-boost' ) }
				description={ __(
					"This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.",
					'jetpack-boost'
				) }
			>
				{ ! canResize && (
					<Notice.Root intent="warning">
						<Notice.Title>{ __( 'Image resizing is unavailable', 'jetpack-boost' ) }</Notice.Title>
						<Notice.Description>
							{ __(
								"Your server doesn't have the Imagick or GD extensions installed. Boost will still highlight oversized images, but it can't help you produce smaller copies until one of those is enabled. Ask your host to turn one on.",
								'jetpack-boost'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
			</ModuleRow>
		</SectionCard>
	);
}
