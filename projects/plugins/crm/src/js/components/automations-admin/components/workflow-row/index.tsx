import { Button, ToggleControl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { Workflow } from '../../types';
import { Checkbox } from '../checkbox';
import styles from './styles.module.scss';

type WorkflowRowProps = {
	workflow: Workflow;
};

export const WorkflowRow: React.FC< WorkflowRowProps > = props => {
	const { workflow } = props;

	// TODO: reimplement when store is implemented
	const [ active, setActive ] = useState( workflow.active );
	const toggleActive = () => {
		setActive( ! active );
	};

	// TODO: reimplement when store is implemented
	const [ selected, setSelected ] = useState( false );
	const toggleSelected = () => {
		setSelected( ! selected );
	};

	return (
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
				<ToggleControl checked={ active } onChange={ toggleActive } label={ 'Testing' } />
			</td>
			<td className={ styles[ 'added-date' ] }>{ workflow.added }</td>
			<td className={ styles[ 'trigger-description' ] }>{ workflow.triggers[ 0 ].description }</td>
			<td className={ styles[ 'edit-button' ] }>
				<Button variant={ 'secondary' }>{ __( 'Edit', 'zero-bs-crm' ) }</Button>
			</td>
		</tr>
	);
};
