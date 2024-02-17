import { Step } from 'crm/state/automations-admin/types';
import { AttributeConfig } from '../attribute-config';
import styles from './styles.module.scss';

type StepConfigProps = {
	workflowId: number;
	step: Step;
};

export const StepConfig: React.FC< StepConfigProps > = ( { workflowId, step } ) => {
	const attributes = Object.values( step.attribute_definitions ).map( definition => ( {
		definition,
		value: step.attributes[ definition.slug ],
	} ) );

	return (
		<>
			<div className={ styles.title }>{ step.title }</div>
			{ attributes.map( ( { definition, value } ) => (
				<div className={ styles[ 'attribute-container' ] }>
					<AttributeConfig
						workflowId={ workflowId }
						stepId={ step.id }
						definition={ definition }
						value={ value }
					/>
				</div>
			) ) }
		</>
	);
};
