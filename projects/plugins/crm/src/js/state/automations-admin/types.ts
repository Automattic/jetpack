export type Trigger = {
	slug: string;
	title: string;
	description?: string;
	category: Category;
};

export type Step = {
	attributes: { [ key: string ]: string | number | boolean };
	attribute_definitions: AttributeDefinition[];
	nextStep?: Step;
	slug: string;
	title: string;
	description: string;
	type: Type;
	category: Category;
	allowedTriggers: Trigger[];
};

export type IdentifiedStep = Step & { id: number; nextStep?: IdentifiedStep };

export type Workflow = {
	id: number;
	name: string;
	description: string;
	category: Category;
	triggers: Trigger[];
	initial_step: Step;
	active: boolean;
	version: number;
	added: string;
};

export type IdentifiedWorkflow = Workflow & {
	initial_step: IdentifiedStep;
};

export type Type = 'contacts';

export type Category = string;

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
