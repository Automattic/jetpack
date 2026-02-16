import type { Integration, IntegrationCardData } from '../../../../../types/index.ts';
import type { ReactNode } from 'react';

export type CardItem = {
	id: string;
	title?: string;
	description?: string;
	icon?: ReactNode;
	cardData: IntegrationCardData;
	body?: ReactNode;
	toggleTooltip?: string;
};

export type NavigationHandlers = {
	goToSpam?: () => void;
	goToResponses?: () => void;
};

// Optional components that can be injected (to avoid bundling block-editor deps in dashboard)
export type IntegrationComponents = {
	ConsentToggle?: React.ComponentType< { className?: string } >;
};

export type EditorFormAttributes = {
	jetpackCRM?: boolean;
	mailpoet?: { enabledForForm?: boolean; listId?: string };
	hostingerReach?: { enabledForForm?: boolean; groupName?: string };
	salesforceData?: { sendToSalesforce?: boolean; organizationId?: string };
};

// Shared environment/context used when rendering integrations
export type IntegrationContextProps = {
	context: 'block-editor' | 'dashboard';
	refreshIntegrations: () => void;
	handlers?: NavigationHandlers;
	attributes?: EditorFormAttributes;
	setAttributes?: ( attrs: Partial< EditorFormAttributes > ) => void;
	components?: IntegrationComponents;
};

// Builder props for a single integration
export type CardBuilderProps = IntegrationContextProps & {
	integration: Integration;
};

// Props for components that render a list of integrations
export type IntegrationsListProps = IntegrationContextProps & {
	integrations?: Integration[];
};
