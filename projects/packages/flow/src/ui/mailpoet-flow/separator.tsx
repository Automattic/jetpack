import { dispatch, useSelect } from '@wordpress/data';
import { AddStepButton } from './add-step-button';
import { Step } from './types';
import { storeName } from '../../store';

type Props = {
	previousStep: Step;
	index: number;
};

export function Separator( { previousStep, index }: Props ): JSX.Element {
	const { setInserterPopover } = dispatch( storeName );
	const { stepType } = useSelect(
		select => ( {
			stepType: select( storeName ).getStepType( previousStep.key ),
		} ),
		[]
	);

	const BranchBadge = previousStep.next_steps.length > 1 && stepType?.branchBadge;
	return (
		<>
			{ BranchBadge && (
				<div className="mailpoet-automation-editor-branch-badge">
					<BranchBadge step={ previousStep } index={ index } />
				</div>
			) }
			<div className="mailpoet-automation-editor-separator">
				<AddStepButton
					onClick={ button => {
						void setInserterPopover( { anchor: button, type: 'steps' } );
					} }
					previousStepId={ previousStep.id }
					index={ index }
				/>
			</div>
		</>
	);
}
