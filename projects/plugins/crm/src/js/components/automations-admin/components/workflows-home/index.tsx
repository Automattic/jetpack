import { dispatch, useSelect } from '@wordpress/data';
import { useGetAutomationWorkflows } from 'crm/data/hooks/queries';
import { store } from 'crm/state/store';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BulkWorkflowActions } from '../bulk-workflow-actions';
import { EditModal } from '../edit-modal';
import { WorkflowTable } from '../workflow-table';
import styles from './styles.module.scss';
import type { Workflow } from 'crm/state/automations-admin/types';

export const WorkflowsHome: React.FC = () => {
	const { id } = useParams< { id: string } >();

	const hydrateWorkflows = ( workflows: Workflow[] ) => {
		dispatch( store ).hydrateWorkflows( workflows );
	};

	const { refetch: refetchWorkflows } = useGetAutomationWorkflows( hydrateWorkflows );

	const workflows = useSelect( select => select( store ).getWorkflows(), [] );

	let workflow: Workflow | undefined;
	if ( id ) {
		const workflowId = Number( id );
		workflow = workflows[ workflowId ];
	}

	const navigate = useNavigate();
	const onEditModalClose = useCallback( () => {
		navigate( '/automations', { replace: true } );
	}, [ navigate ] );

	return (
		<div className={ styles.container }>
			<BulkWorkflowActions refetchWorkflows={ refetchWorkflows } />
			<WorkflowTable
				workflows={ Object.values( workflows ) }
				refetchWorkflows={ refetchWorkflows }
			/>
			{ workflow && (
				<EditModal
					isOpen={ !! workflow }
					onClose={ onEditModalClose }
					workflow={ workflow }
					refetchWorkflows={ refetchWorkflows }
				/>
			) }
		</div>
	);
};
