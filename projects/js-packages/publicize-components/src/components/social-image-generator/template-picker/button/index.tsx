import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { store as socialStore } from '../../../../social-store';
import TemplatePickerModal from '../modal';

const TemplatePickerButton: React.FC = () => {
	const [ currentTemplate, setCurrentTemplate ] = useState( null );
	const { isEnabled, isUpdating, defaultTemplate } = useSelect( select => {
		const store = select( socialStore );

		const config = store.getSocialSettings().socialImageGenerator;
		return {
			isEnabled: config.enabled,
			defaultTemplate: config.template,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { updateSocialImageGeneratorConfig } = useDispatch( socialStore );

	useEffect( () => {
		if ( currentTemplate ) {
			const newOption = { template: currentTemplate };
			updateSocialImageGeneratorConfig( newOption );
		}
	}, [ currentTemplate, updateSocialImageGeneratorConfig ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const renderTemplatePickerModal = useCallback(
		( { open } ) => (
			<Button
				fullWidth={ isSmall }
				variant="secondary"
				size="small"
				disabled={ isUpdating || ! isEnabled }
				onClick={ open }
			>
				{ __( 'Change default template', 'jetpack-publicize-components' ) }
			</Button>
		),
		[ isEnabled, isSmall, isUpdating ]
	);

	return (
		<TemplatePickerModal
			value={ currentTemplate || defaultTemplate }
			onSelect={ setCurrentTemplate }
			render={ renderTemplatePickerModal }
		/>
	);
};

export default TemplatePickerButton;
