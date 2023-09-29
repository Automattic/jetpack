import { DropdownMenu, MenuItem } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { chevronDown } from '@wordpress/icons';
import { store } from 'crm/state/store';
import styles from './styles.module.scss';

export const BulkWorkflowActions: React.FC = () => {
	const dropdownMenuIcon = (
		<div className={ styles.icon }>
			<div className={ styles.text }>Bulk action</div>
			{ chevronDown }
		</div>
	);

	const onActivateClick = ( onClose: () => void ) => () => {
		dispatch( store ).activateSelectedWorkflows();
		onClose();
	};

	const onDeactivateClick = ( onClose: () => void ) => () => {
		dispatch( store ).deactivateSelectedWorkflows();
		onClose();
	};

	return (
		<DropdownMenu
			className={ styles[ 'dropdown-menu' ] }
			icon={ dropdownMenuIcon }
			label={ 'Select a bulk action.' }
		>
			{ ( { onClose } ) => (
				<>
					<MenuItem onClick={ onActivateClick( onClose ) }>Activate</MenuItem>
					<MenuItem onClick={ onDeactivateClick( onClose ) }>Deactivate</MenuItem>
				</>
			) }
		</DropdownMenu>
	);
};
