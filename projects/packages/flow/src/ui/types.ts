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

export type Product =
	| 'wordpress'
	| 'jetpack'
	| 'woocommerce'
	| 'mailpoet'
	| 'akismet'
	| 'crm'
	| 'sensei'
	| 'claude'
	| 'google-ai'
	| 'openai';

export type CatalogItem = {
	id: string;
	label: string;
	description: string;
	product: Product;
	available: boolean;
	requires: string;
	fields: FieldDef[];
	tokens: string[];
	/** Tokens an action adds for the steps after it. */
	outputs?: string[];
	inbound?: boolean;
};

export type PluginInfo = {
	slug: string;
	name: string;
	file: string;
	status: 'active' | 'inactive' | 'missing';
};

export type Catalog = {
	triggers: CatalogItem[];
	actions: CatalogItem[];
	plugins: Record< string, PluginInfo >;
	users: Option[];
	roles: Option[];
	inbound_url: string;
};

export type Step = { id: string; type: string; config: Record< string, string > };

export type Flow = {
	/** Null until the flow has been saved. */
	id: number | null;
	name: string;
	enabled: boolean;
	modified?: string;
	triggers: string[];
	/** Secret URL of the inbound event trigger, once the flow is saved. */
	inbound_url?: string;
	steps: Step[];
};

export type DragPayload =
	| { kind: 'trigger'; id: string }
	| { kind: 'action'; id: string }
	| { kind: 'step'; stepId: string };
