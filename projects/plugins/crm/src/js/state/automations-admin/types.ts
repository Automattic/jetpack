export type Trigger = {
	slug: string;
	title: string;
	description?: string;
	category: Category;
};

type StepId = string;

export type Step = {
	id: StepId;
	attributes: { [ key: string ]: AttributeValue };
	attribute_definitions: { [ attributeSlug: string ]: AttributeDefinition };
	next_step_true?: StepId;
	next_step_false?: StepId;
	slug: string;
	title: string;
	description: string;
	type: Type;
	step_type: StepType;
	category: Category;
	allowedTriggers: Trigger[];
};

export type Workflow = {
	id: number;
	name: string;
	description: string;
	category: Category;
	triggers: Trigger[];
	initial_step: string;
	active: boolean;
	version: number;
	created_at: number;
	updated_at: number;
	steps: {
		[ stepId: string ]: Step;
	};
};

export type ServerPreparedWorkflow = Workflow & { triggers: string[] };

export type Type = 'contacts';

export type StepType = 'action' | 'condition';

export type Category = string;

export type AttributeValue = string | number | boolean;

export type AttributeDefinition = {
	slug: string;
	title: string;
	description: string;
	type: AttributeType;
	data?: { [ key: string ]: string };
};

export type AttributeType =
	| 'select'
	| 'checkbox'
	| 'textarea'
	| 'text'
	| 'date'
	| 'datetime'
	| 'number'
	| 'password';
