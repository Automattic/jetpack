import {
	Button,
	DropdownMenu,
	Flex,
	FlexItem,
	Icon,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close, external } from '@wordpress/icons';
import { map } from 'lodash';
import { PluginIcon } from '../../../shared/icons';

const RESPONSES_PATH = '/wp-admin/edit.php?post_type=feedback';

const JetpackFormSettingsDropdownContent = ( { settings, onClose, ...props } ) => {
	const [ currentSettingsView, setCurrentSettingsView ] = useState( null );

	if ( ! currentSettingsView ) {
		return (
			<>
				<MenuGroup>
					<div className="components-menu-group__label">
						{ __( 'Connect form responses to', 'jetpack' ) }
					</div>
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
						href={ RESPONSES_PATH }
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
		<div className="form-settings-dropdown__content">
			<Flex style={ { marginBottom: '24px' } }>
				<FlexItem>
					<strong>{ currentSettingsView.title }</strong>
				</FlexItem>
				<Button className="form-settings-dropdown__close-icon">
					<Icon icon={ close } onClick={ () => setCurrentSettingsView( null ) } size={ 16 } />
				</Button>
			</Flex>
			{ currentSettingsView.content( props ) }
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
				isAlternate: true,
			} }
		>
			{ ( { onClose } ) => <JetpackFormSettingsDropdownContent onClose={ onClose } { ...props } /> }
		</DropdownMenu>
	);
};

export default JetpackFormSettingsDropdown;
