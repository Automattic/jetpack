import { useContext, useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { Hooks } from 'wp-js-hooks';
import { AddTrigger } from './add-trigger';
import { AutomationContext } from './context';
import { Step } from './step';
import { Step as StepData } from './types';
import { storeName } from '../../store';
import { RenderStepType } from '../../../types/filters';

type Props = {
	stepData: StepData;
	index: number;
};

export function FlowStep( props: Props ): JSX.Element {
	const { context } = useContext( AutomationContext );
	const selectedStep = useSelect( select => select( storeName ).getSelectedStep(), [] );

	const renderStep = useMemo(
		(): RenderStepType =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			Hooks.applyFilters(
				'mailpoet.automation.render_step',
				( stepData: StepData, index: number ) => (
					<>
						{ stepData.type === 'root' ? (
							<AddTrigger step={ stepData } index={ index } />
						) : (
							<Step
								step={ stepData }
								isSelected={ selectedStep && stepData.id === selectedStep.id }
							/>
						) }
					</>
				),
				context
			),
		[ selectedStep, context ]
	);
	return renderStep( props.stepData, props.index );
}
