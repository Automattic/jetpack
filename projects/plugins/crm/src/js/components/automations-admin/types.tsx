export type Trigger = {
	slug: string;
	title: string;
	description?: string;
	category: Category;
};

export type Step = {
	attributes: Step[];
	nextStep?: Step;
	slug: string;
	title: string;
	description: string;
	type: Type;
	category: Category;
	allowedTriggers: Trigger[];
};

export type Action = Step;

export type Condition = Step;

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

export type Type = 'contacts';

export type Category = string;
