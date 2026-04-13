import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import { store as socialStore } from '../../../social-store';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { Sidebar } from './sidebar';
import { LocalState } from './types';

/**
 * Hook to get modal screen details for edit template.
 *
 * @return screen details
 */
export function useModalScreen() {
	const isScreenLocked = useSelect(
		select => select( socialStore ).isUnifiedModalScreenLocked(),
		[]
	);

	const featuredImageId = useFeaturedImage();
	const { customText, imageType, imageId, template, font, defaultImageId, updateSettings } =
		useImageGeneratorConfig();

	const [ localState, setLocalState ] = useState< LocalState >( () => ( {
		imageId: imageId ?? null,
		imageType: ( imageType ??
			( defaultImageId ? 'default' : 'featured' ) ) as LocalState[ 'imageType' ],
		customText: customText ?? '',
		template: template ?? null,
		font: font ?? '',
	} ) );

	const handleSave = useCallback( () => {
		updateSettings( {
			image_type: localState.imageType,
			image_id: localState.imageId ?? undefined,
			custom_text: localState.customText,
			template: localState.template,
			font: localState.font,
		} );
	}, [ localState, updateSettings ] );

	return useMemo< ScreenDetails >(
		() => ( {
			path: '/edit-template',
			title: __( 'Edit social image template', 'jetpack-publicize-pkg' ),
			isScreenLocked,
			onGoBack: handleSave,
			onClose: handleSave,
			sidebar: (
				<Sidebar
					localState={ localState }
					setLocalState={ setLocalState }
					defaultImageId={ defaultImageId ?? null }
					featuredImageId={ featuredImageId ?? null }
				/>
			),
			content: <Content localState={ localState } />,
			footerActions: [
				{
					text: isScreenLocked
						? _x( 'Close', 'Button text to close the modal.', 'jetpack-publicize-pkg' )
						: _x( 'Done', 'Button text to save changes.', 'jetpack-publicize-pkg' ),
					variant: 'primary',
					onClick: handleSave,
				},
			],
		} ),
		[ localState, setLocalState, isScreenLocked, defaultImageId, featuredImageId, handleSave ]
	);
}
