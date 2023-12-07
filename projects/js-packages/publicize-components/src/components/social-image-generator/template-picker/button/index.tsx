import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { SOCIAL_STORE_ID } from '../../../../social-store';
import { SocialStoreSelectors } from '../../../../types/types';
import TemplatePickerModal from '../modal';

const TemplatePickerButton: React.FC = () => {
	const [ currentTemplate, setCurrentTemplate ] = useState( null );
	const { isEnabled, isUpdating, defaultTemplate } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isSocialImageGeneratorEnabled(),
			isUpdating: store.isUpdatingSocialImageGeneratorSettings(),
			defaultTemplate: store.getSocialImageGeneratorDefaultTemplate(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateSocialImageGeneratorSettings;

	useEffect( () => {
		if ( currentTemplate ) {
			const newOption = { template: currentTemplate };
			updateOptions( newOption );
		}
	}, [ currentTemplate, updateOptions ] );

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
				{ __( 'Change default template', 'jetpack' ) }
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
