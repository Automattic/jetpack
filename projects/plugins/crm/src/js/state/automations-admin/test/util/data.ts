import { Step, Workflow } from 'crm/state/automations-admin/types';

const convertToNameSlug = ( name: string ) => {
	return name.toLowerCase().replace( /\s+/g, '_' );
};

const getTrigger = ( name: string ) => {
	const nameSlug = convertToNameSlug( name );

	return {
		slug: `${ nameSlug }_slug`,
		title: `${ name } Title`,
		category: `${ nameSlug }_category`,
		description: `This is the description of ${ name }.`,
	};
};

type PartialStep = {
	[ K in keyof Step ]?: Step[ K ];
};

export function getStep( id: string, name: string, props?: PartialStep ): Step {
	const nameSlug = convertToNameSlug( name );

	const defaultProps = {
		id,
		attributes: { [ `${ nameSlug }_attribute_one_key` ]: `${ nameSlug }_attribute_one_value` },
		slug: `${ nameSlug }_slug`,
		title: `${ name } Title`,
		description: `This is the description of ${ name }.`,
		type: 'contacts',
		category: `${ nameSlug }_category`,
		allowedTriggers: [ triggerOne ],
	} as Step;

	return {
		...defaultProps,
		...props,
	};
}

type PartialWorkflow = {
	[ K in keyof Workflow ]?: Workflow[ K ];
};

export const getWorkflowStepProps: ( steps: Step[] ) => {
	initial_step: string;
	steps: { [ stepId: string ]: Step };
} = ( steps: Step[] ) => {
	if ( 0 === steps.length ) {
		return {
			initial_step: '',
			steps: {},
		};
	}

	const newSteps: Step[] = [];

	for ( let i = 0; i <= steps.length - 2; i++ ) {
		newSteps.push( { ...steps[ i ], next_step: steps[ i + 1 ].id } );
	}

	return {
		initial_step: steps[ 0 ].id,
		steps: newSteps.reduce( ( stepsObj, step ) => ( { ...stepsObj, [ step.id ]: step } ), {} ),
	};
};

export function getWorkflow( id: number, name: string, props?: PartialWorkflow ): Workflow {
	const nameSlug = convertToNameSlug( name );

	const defaultProps = {
		description: `This is the description of ${ name }.`,
		category: `${ nameSlug }-category`,
		active: true,
		version: 1,
		added: '01/23/4567',
		triggers: [ defaultTrigger ],
		...getWorkflowStepProps( [ defaultStep ] ),
	};

	return {
		...defaultProps,
		...props,
		id,
		name,
	};
}

export const defaultTrigger = getTrigger( 'Default Trigger' );
export const triggerOne = getTrigger( 'Trigger One' );
export const triggerTwo = getTrigger( 'Trigger Two' );
export const triggerThree = getTrigger( 'Trigger Three' );

export const defaultStep = getStep( 'default', 'Default Step' );
export const stepOne = getStep( 'step_one', 'Step One' );
export const stepTwo = getStep( 'step_two', 'Step Two' );
export const stepThree = getStep( 'step_three', 'Step Three' );

export const workflowOne = getWorkflow( 1, 'Workflow One', {
	triggers: [ triggerOne ],
	initial_step: stepOne.id,
	steps: {
		[ stepOne.id ]: stepOne,
	},
} );
export const workflowTwo = getWorkflow( 2, 'Workflow Two', {
	triggers: [ triggerTwo ],
	added: '98/76/5432',
	...getWorkflowStepProps( [ stepTwo ] ),
} );

export const workflowThree = getWorkflow( 3, 'Workflow Three', {
	triggers: [ triggerThree ],
	...getWorkflowStepProps( [ stepThree ] ),
} );
