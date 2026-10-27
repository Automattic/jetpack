import { useSelect } from '@wordpress/data';
import { FlowEnding } from './flow-ending';
import { FlowSeparator } from './flow-separator';
import { FlowStep } from './flow-step';
import { Step as StepData } from './types';
import { storeName } from '../../store';

type Props = {
	stepData: StepData;
	row: number;
};

export function Flow( { stepData, row }: Props ): JSX.Element {
	const stepMap = useSelect( select => select( storeName ).getAutomationData()?.steps, [] );

	const nextSteps = stepData.next_steps.length === 0 ? [ { id: null } ] : stepData.next_steps;

	return (
		<>
			{ nextSteps.length > 1 && (
				<div className="mailpoet-automation-editor-separator-curve-root">
					<div className="mailpoet-automation-editor-separator-curve-root-left" />
					<div className="mailpoet-automation-editor-separator-curve-root-right" />
				</div>
			) }

			<div className="mailpoet-automation-editor-automation-row">
				{ nextSteps.map( ( { id }, i ) => {
					const nextStep = stepMap[ id ];

					// when step under root is not a trigger, insert "add trigger" placeholder
					const nextStepData =
						row === 0 && nextStep?.type !== 'trigger'
							? { ...stepMap.root, next_steps: [ { id } ] }
							: nextStep;

					return nextStepData ? (
						<div key={ id }>
							{ row > 0 && (
								<FlowSeparator
									previousStepData={ stepData }
									index={ i }
									nextStepData={ nextStepData }
								/>
							) }
							<FlowStep stepData={ nextStepData } index={ i } />
							<Flow stepData={ nextStepData } row={ row + 1 } />
						</div>
					) : (
						<FlowEnding
							// eslint-disable-next-line react/no-array-index-key
							key={ i }
							previousStepData={ stepData }
							index={ i }
							nextStepData={ nextStepData }
						/>
					);
				} ) }
			</div>
		</>
	);
}
