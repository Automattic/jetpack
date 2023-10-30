import { DropdownMenu, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { useMutateAutomationWorkflows } from 'crm/data/hooks/mutations';
import { store } from 'crm/state/store';
import { useCallback } from 'react';
import styles from './styles.module.scss';

type BulkWorkflowActionsProps = {
	refetchWorkflows: () => void;
};

export const BulkWorkflowActions: React.FC< BulkWorkflowActionsProps > = ( {
	refetchWorkflows,
} ) => {
	const dropdownMenuIcon = (
		<div className={ styles.icon }>
			<div className={ styles.text }>{ __( 'Bulk action', 'zero-bs-crm' ) }</div>
			{ chevronDown }
		</div>
	);

	const selectedWorkflows = useSelect( select => select( store ).getSelectedWorkflows(), [] );
	const workflows = useSelect( select => select( store ).getWorkflows(), [] );
	const { mutate: mutateWorkflows } = useMutateAutomationWorkflows();

	const onActivateClick = useCallback(
		( onClose: () => void ) => () => {
			for ( const workflowId of selectedWorkflows ) {
				const workflow = workflows[ workflowId ];
				mutateWorkflows(
					{ ...workflow, active: true },
					{
						onSuccess: () => refetchWorkflows(),
					}
				);
			}
			onClose();
		},
		[ selectedWorkflows, workflows, mutateWorkflows, refetchWorkflows ]
	);

	const onDeactivateClick = useCallback(
		( onClose: () => void ) => () => {
			for ( const workflowId of selectedWorkflows ) {
				const workflow = workflows[ workflowId ];
				mutateWorkflows(
					{ ...workflow, active: false },
					{
						onSuccess: () => refetchWorkflows(),
					}
				);
			}
			onClose();
		},
		[ selectedWorkflows, workflows, mutateWorkflows, refetchWorkflows ]
	);

	return (
		<DropdownMenu
			className={ styles[ 'dropdown-menu' ] }
			icon={ dropdownMenuIcon }
			label={ 'Select a bulk action.' }
		>
			{ ( { onClose } ) => (
				<>
					<MenuItem onClick={ onActivateClick( onClose ) }>
						{ __( 'Activate', 'zero-bs-crm' ) }
					</MenuItem>
					<MenuItem onClick={ onDeactivateClick( onClose ) }>
						{ __( 'Deactivate', 'zero-bs-crm' ) }
					</MenuItem>
				</>
			) }
		</DropdownMenu>
	);
};
