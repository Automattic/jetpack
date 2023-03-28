import { AntiSpamIcon } from '@automattic/jetpack-components';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, trash, archive, inbox } from '@wordpress/icons';

const ActionsMenu = () => {
	return (
		<DropdownMenu
			label={ __( 'Bulk actions', 'jetpack-forms' ) }
			text={ __( 'Bulk actions', 'jetpack-forms' ) }
			icon={ chevronDown }
			popoverProps={ { placement: 'bottom-end' } }
			toggleProps={ { variant: 'secondary', iconPosition: 'right' } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<MenuItem onClick={ onClose } icon={ <AntiSpamIcon size="22" /> } iconPosition="left">
						{ __( 'Spam check', 'jetpack-forms' ) }
					</MenuItem>
					<MenuItem icon={ inbox } iconPosition="left">
						{ __( 'Mark unread', 'jetpack-forms' ) }
					</MenuItem>
					<MenuItem icon={ archive } iconPosition="left">
						{ __( 'Archive', 'jetpack-forms' ) }
					</MenuItem>
					<MenuItem icon={ trash } iconPosition="left">
						{ __( 'Delete', 'jetpack-forms' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};

export default ActionsMenu;
