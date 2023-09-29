import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BulkWorkflowActions } from '../bulk-workflow-actions';
import { EditModal } from '../edit-modal';
import { WorkflowTable } from '../workflow-table';
import styles from './styles.module.scss';
import type { AutomationsState } from 'crm/state/automations-admin/reducer';
import type { Workflow } from 'crm/state/automations-admin/types';

type WorkflowsHomeProps = {
	workflows: AutomationsState[ 'workflows' ];
};

export const WorkflowsHome: React.FC< WorkflowsHomeProps > = ( { workflows } ) => {
	const { id } = useParams< { id: string } >();

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
			<BulkWorkflowActions />
			<WorkflowTable workflows={ Object.values( workflows ) } />
			{ workflow && (
				<EditModal isOpen={ !! workflow } onClose={ onEditModalClose } workflow={ workflow } />
			) }
		</div>
	);
};
