import { DropdownMenu, Flex, FlexItem, Icon, MenuGroup, MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close, external } from '@wordpress/icons';
import { map } from 'lodash';
import { PluginIcon } from '../../../shared/icons';

const JetpackFormSettingsDropdownContent = ( { responsesPath, settings, onClose } ) => {
	const [ currentSettingsView, setCurrentSettingsView ] = useState( null );

	if ( ! currentSettingsView ) {
		return (
			<>
				<span className="form-settings-dropdown__hint">
					{ __( 'CONNECT FORM RESPONSES TO', 'jetpack' ) }
				</span>
				<MenuGroup>
					{ map( settings, ( setting, index ) => (
						<MenuItem
							className="form-settings-dropdown__item"
							key={ index }
							onClick={ () => setCurrentSettingsView( setting ) }
						>
							{ setting.icon }
							{ setting.title }
						</MenuItem>
					) ) }
				</MenuGroup>
				<MenuGroup>
					<MenuItem
						href={ responsesPath }
						icon={ external }
						target="_blank"
						onClick={ () => onClose() }
					>
						{ __( 'Manage form responses', 'jetpack' ) }
					</MenuItem>
				</MenuGroup>
			</>
		);
	}

	return (
		<div style={ { padding: '12px' } }>
			<Flex style={ { marginBottom: '24px' } }>
				<FlexItem>
					<strong>{ currentSettingsView.title }</strong>
				</FlexItem>
				<Icon icon={ close } onClick={ () => setCurrentSettingsView( null ) } size={ 16 } />
			</Flex>
			{ currentSettingsView.content() }
		</div>
	);
};

const JetpackFormSettingsDropdown = props => {
	return (
		<DropdownMenu
			icon={ PluginIcon }
			popoverProps={ {
				position: 'bottom right',
				className: 'jetpack-contact-form__popover',
			} }
		>
			{ ( { onClose } ) => <JetpackFormSettingsDropdownContent onClose={ onClose } { ...props } /> }
		</DropdownMenu>
	);
};

export default JetpackFormSettingsDropdown;
