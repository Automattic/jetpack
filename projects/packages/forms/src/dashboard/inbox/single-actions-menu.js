import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, inbox, moreHorizontal } from '@wordpress/icons';
import { STORE_NAME } from '../state';
import { TABS } from './constants';

const SingleActionsMenu = () => {
	const currentTab = useSelect( select => select( STORE_NAME ).getResponsesQuery().status, [] );

	return (
		<DropdownMenu
			icon={ moreHorizontal }
			popoverProps={ {
				position: 'bottom left',
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ currentTab === TABS.spam && (
						<MenuItem onClick={ onClose } iconPosition="left" icon={ inbox }>
							{ __( 'Remove from spam', 'jetpack-forms' ) }
						</MenuItem>
					) }

					{ currentTab !== TABS.spam && (
						<MenuItem onClick={ onClose } iconPosition="left" icon={ inbox }>
							{ __( 'Mark as spam', 'jetpack-forms' ) }
						</MenuItem>
					) }

					{ currentTab === TABS.trash && (
						<MenuItem onClick={ onClose } iconPosition="left" icon={ inbox }>
							{ __( 'Remove from trash', 'jetpack-forms' ) }
						</MenuItem>
					) }

					{ currentTab !== TABS.trash && (
						<MenuItem
							onClick={ onClose }
							iconPosition="left"
							icon={ trash }
							variant="tertiary"
							isDestructive
						>
							{ __( 'Delete', 'jetpack-forms' ) }
						</MenuItem>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};

export default SingleActionsMenu;
