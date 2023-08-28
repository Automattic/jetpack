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

function getStep( name: string ): Step {
	const nameSlug = convertToNameSlug( name );

	return {
		attributes: [ `${ nameSlug }_attribute_one` ],
		slug: `${ nameSlug }_slug`,
		title: `${ name } Title`,
		description: `This is the description of ${ name }.`,
		type: 'contacts',
		category: `${ nameSlug }_category`,
		allowedTriggers: [ triggerOne ],
	};
}

type PartialWorkflow = {
	[ K in keyof Workflow ]?: Workflow[ K ];
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
		initial_step: defaultStep,
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

export const defaultStep = getStep( 'Default Step' );
export const stepOne = getStep( 'Step One' );
export const stepTwo = getStep( 'Step Two' );
export const stepThree = getStep( 'Step Three' );

export const workflowOne = getWorkflow( 1, 'Workflow One', {
	triggers: [ triggerOne ],
	initial_step: stepOne,
} );
export const workflowTwo = getWorkflow( 2, 'Workflow Two', {
	triggers: [ triggerTwo ],
	initial_step: stepTwo,
	added: '98/76/5432',
} );
export const workflowThree = getWorkflow( 3, 'Workflow Three', {
	triggers: [ triggerThree ],
	initial_step: stepThree,
} );
