import { Button, ToggleControl } from '@automattic/jetpack-components';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMutateAutomationWorkflows } from 'crm/data/hooks/mutations';
import { Workflow } from 'crm/state/automations-admin/types';
import { store } from 'crm/state/store';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '../checkbox';
import styles from './styles.module.scss';

type WorkflowRowProps = {
	workflow: Workflow;
	refetchWorkflows: () => void;
};

export const WorkflowRow: React.FC< WorkflowRowProps > = props => {
	const { workflow, refetchWorkflows } = props;

	const selectedWorkflows = useSelect( select => select( store ).getSelectedWorkflows(), [] );
	const selected = selectedWorkflows.includes( workflow.id );

	const { mutate: mutateWorkflows } = useMutateAutomationWorkflows();

	const toggleSelected = useCallback( () => {
		if ( selected ) {
			dispatch( store ).deselectWorkflow( workflow.id );
		} else {
			dispatch( store ).selectWorkflow( workflow.id );
		}
	}, [ selected, workflow.id ] );

	const onToggleActiveClick = useCallback( () => {
		mutateWorkflows(
			{ ...workflow, active: ! workflow.active },
			{
				onSuccess: () => refetchWorkflows(),
			}
		);
	}, [ workflow, workflow.active, mutateWorkflows, refetchWorkflows ] );

	const navigate = useNavigate();
	const onEditClick = useCallback( () => {
		navigate( `/automations/${ workflow.id }`, { replace: true } );
	}, [] );

	const date = new Date( workflow.created_at * 1000 );
	const added = date.toLocaleDateString();

	return (
		<>
			<tr className={ styles.row }>
				<td>
					<Checkbox
						id={ 'workflow_' + workflow.id }
						checked={ selected }
						onChange={ toggleSelected }
					/>
				</td>
				<td className={ styles.name }>{ workflow.name }</td>
				<td className={ styles[ 'status-toggle' ] }>
					<ToggleControl
						checked={ workflow.active }
						onChange={ onToggleActiveClick }
						label={ __( 'Active', 'zero-bs-crm' ) }
					/>
				</td>
				<td className={ styles[ 'added-date' ] }>{ added }</td>
				<td className={ styles[ 'trigger-description' ] }>
					{ workflow.triggers[ 0 ].description }
				</td>
				<td className={ styles[ 'edit-button' ] }>
					<Button variant={ 'secondary' } onClick={ onEditClick }>
						{ __( 'Edit', 'zero-bs-crm' ) }
					</Button>
				</td>
			</tr>
		</>
	);
};
