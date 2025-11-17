import type { Integration } from '../../../../../types';

export type NavigationHandlers = {
	goToSpam?: () => void;
	goToResponses?: () => void;
};

export type EditorFormAttributes = {
	jetpackCRM?: boolean;
	mailpoet?: { enabledForForm?: boolean; listId?: string };
	hostingerReach?: { enabledForForm?: boolean; groupName?: string };
	salesforceData?: { sendToSalesforce?: boolean; organizationId?: string };
};

export type IntegrationCardBuilderProps = {
	context: 'block-editor' | 'dashboard';
	refreshIntegrations: () => void;
	handlers?: NavigationHandlers;
	attributes?: EditorFormAttributes;
	setAttributes?: ( attrs: Partial< EditorFormAttributes > ) => void;
	integration?: Integration;
	integrations?: Integration[];
};
