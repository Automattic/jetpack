export type Option = { value: string; label: string };

export type FieldDef = {
	name: string;
	label: string;
	type: 'text' | 'textarea' | 'email' | 'url' | 'select' | 'user' | 'role';
	required?: boolean;
	default?: string;
	options?: Option[];
	showIf?: Record< string, string >;
};

export type CatalogItem = {
	id: string;
	label: string;
	description: string;
	group: string;
	available: boolean;
	requires: string;
	fields: FieldDef[];
	tokens: string[];
	inbound?: boolean;
};

export type Catalog = {
	triggers: CatalogItem[];
	actions: CatalogItem[];
	users: Option[];
	roles: Option[];
	inbound_url: string;
};

export type Step = { id: string; type: string; config: Record< string, string > };

export type Flow = {
	id: string;
	name: string;
	enabled: boolean;
	trigger: { type: string; config: Record< string, string > };
	steps: Step[];
};

export type DragPayload =
	| { kind: 'trigger'; id: string }
	| { kind: 'action'; id: string }
	| { kind: 'step'; flowId: string; stepId: string };
