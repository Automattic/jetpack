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
						<MenuItem
							onClick={ onClose }
							iconPosition="left"
							icon={
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M11 13V7H13V13H11Z" />
									<path d="M11 15V17H13V15H11Z" />
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M20.75 12C20.75 16.8325 16.8325 20.75 12 20.75C7.16751 20.75 3.25 16.8325 3.25 12C3.25 7.16751 7.16751 3.25 12 3.25C16.8325 3.25 20.75 7.16751 20.75 12ZM12 19.25C16.0041 19.25 19.25 16.0041 19.25 12C19.25 7.99594 16.0041 4.75 12 4.75C7.99594 4.75 4.75 7.99594 4.75 12C4.75 16.0041 7.99594 19.25 12 19.25Z"
									/>
								</svg>
							}
						>
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
