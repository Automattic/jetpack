import { check, Icon } from '@wordpress/icons';
import { FlowSeparator } from './flow-separator';
import { Step as StepData } from './types';

type Props = {
	previousStepData: StepData;
	index: number;
	nextStepData?: StepData;
};

export function FlowEnding( { previousStepData, index, nextStepData }: Props ): JSX.Element {
	return (
		<div className="mailpoet-automation-editor-step-wrapper">
			<FlowSeparator
				previousStepData={ previousStepData }
				nextStepData={ nextStepData }
				index={ index }
			/>
			<Icon className="mailpoet-automation-editor-automation-end" icon={ check } />
		</div>
	);
}
