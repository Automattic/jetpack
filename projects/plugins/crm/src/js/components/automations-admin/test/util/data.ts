import { Workflow } from 'crm/state/automations-admin/types';

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

function getWorkflow(
	name: string,
	triggers: Trigger[],
	initial_step: Step,
	props?: PartialWorkflow
): Workflow {
	const nameSlug = convertToNameSlug( name );

	const defaultProps = {
		id: 1,
		description: `This is the description of ${ name }.`,
		category: `${ nameSlug }-category`,
		active: true,
		version: 1,
		added: '01/23/4567',
	};

	return {
		...defaultProps,
		...props,
		name,
		triggers,
		initial_step,
	};
}

export const triggerOne = getTrigger( 'Trigger One' );
export const triggerTwo = getTrigger( 'Trigger Two' );

export const stepOne = getStep( 'Step One' );
export const stepTwo = getStep( 'Step Two' );

export const workflowOne = getWorkflow( 'Workflow One', [ triggerOne ], stepOne );
export const workflowTwo = getWorkflow( 'Workflow Two', [ triggerTwo ], stepTwo, {
	added: '98/76/5432',
} );
