import { DropdownMenu, MenuItem } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import styles from './styles.module.scss';

export const BulkWorkflowActions: React.FC = () => {
	const dropdownMenuIcon = (
		<div className={ styles.icon }>
			<div className={ styles.text }>Bulk action</div>
			{ chevronDown }
		</div>
	);

	return (
		<DropdownMenu
			className={ styles[ 'dropdown-menu' ] }
			icon={ dropdownMenuIcon }
			label={ 'Select a bulk action.' }
		>
			{ () => (
				<>
					<MenuItem>Activate</MenuItem>
					<MenuItem>Deactivate</MenuItem>
				</>
			) }
		</DropdownMenu>
	);
};
