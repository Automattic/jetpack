import { useContext, useMemo } from 'react';
import { Hooks } from 'wp-js-hooks';
import { AutomationContext } from './context';
import { Separator } from './separator';
import { Step as StepData } from './types';
import { RenderStepSeparatorType } from '../../../types/filters';

type Props = {
	previousStepData: StepData;
	index: number;
	nextStepData?: StepData;
};

export function FlowSeparator( props: Props ): JSX.Element {
	const { context } = useContext( AutomationContext );
	const renderSeparator = useMemo(
		(): RenderStepSeparatorType =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			Hooks.applyFilters(
				'mailpoet.automation.render_step_separator',
				( previousStepData: StepData, index: number ) => (
					<>
						{ previousStepData.next_steps.length > 1 && (
							<div
								className={
									index < previousStepData.next_steps.length / 2
										? 'mailpoet-automation-editor-separator-curve-leaf-left'
										: 'mailpoet-automation-editor-separator-curve-leaf-right'
								}
							/>
						) }
						<Separator previousStep={ previousStepData } index={ index } />
					</>
				),
				context
			),
		[ context ]
	);
	return renderSeparator( props.previousStepData, props.index, props.nextStepData );
}
