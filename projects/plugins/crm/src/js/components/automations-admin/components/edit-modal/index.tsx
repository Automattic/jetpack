import { Button } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { StepConfig } from '../step-config';
import styles from './styles.module.scss';
import type { Step, Workflow } from 'crm/state/automations-admin/types';

type EditModalProps = {
	workflow: Workflow;
	isOpen: boolean;
	onClose: () => void;
};

export const EditModal: React.FC< EditModalProps > = ( { isOpen, onClose, workflow } ) => {
	const steps: Step[] = [];

	let stepId: string | undefined = workflow.initial_step;
	while ( stepId ) {
		const step: Step = workflow.steps?.[ stepId ];
		steps.push( step );
		stepId = step.next_step;
	}

	const onSave = useCallback( () => {
		// TODO: save workflow here
		onClose();
	}, [ onClose ] );

	const onCancel = useCallback( () => {
		// TODO: reload workflow here
		onClose();
	}, [ onClose ] );

	return (
		isOpen && (
			<Modal onRequestClose={ () => onClose() }>
				<div className={ styles.container }>
					<h1>
						{ sprintf(
							/* translators: placeholder is a string which is used to identify the workflow */
							__( 'Edit %1$s', 'zero-bs-crm' ),
							workflow.name
						) }
					</h1>
					<div className={ styles.subheader }>
						{ __( 'Define and customize the workflow', 'zero-bs-crm' ) }
					</div>
					{ steps.map( step => (
						<div className={ styles[ 'step-container' ] }>
							<StepConfig workflowId={ workflow.id } step={ step } />
						</div>
					) ) }
					<div className={ styles[ 'button-container' ] }>
						<Button variant={ 'secondary' } onClick={ onCancel }>
							{ __( 'Cancel', 'zero-bs-crm' ) }
						</Button>
						<Button isPrimary onClick={ onSave }>
							{ __( 'Save', 'zero-bs-crm' ) }
						</Button>
					</div>
				</div>
			</Modal>
		)
	);
};
