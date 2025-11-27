import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
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
export function useModalScreen(): ScreenDetails {
	const isScreenLocked = useSelect(
		select => select( socialStore ).isUnifiedModalScreenLocked(),
		[]
	);
	const { customText, imageType, imageId, template, font } = useImageGeneratorConfig();

	const [ localState, setLocalState ] = useState< LocalState >( () => ( {
		imageId,
		imageType: ( imageType ?? 'default' ) as LocalState[ 'imageType' ],
		customText,
		template,
		font,
	} ) );

	return useMemo(
		() => ( {
			path: '/edit-template',
			title: __( 'Edit social image template', 'jetpack-publicize-components' ),
			isScreenLocked,
			sidebar: <Sidebar localState={ localState } setLocalState={ setLocalState } />,
			content: <Content localState={ localState } />,
			footerActions: [
				{
					text: __( 'Save Changes', 'jetpack-publicize-components' ),
					variant: 'primary',
					onClick: () => {
						// TODO Save changes
					},
				},
			],
		} ),
		[ localState, setLocalState, isScreenLocked ]
	);
}
