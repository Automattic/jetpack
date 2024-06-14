import type { FC, MouseEvent } from 'react';

type StatusType = 'warning' | 'error' | 'unlock' | 'success';

interface ConnectionListItemProps {
	text: string;
	actionText?: string;
	onClick?: ( e: MouseEvent< HTMLButtonElement > ) => void;
	status?: StatusType;
}

export type ConnectionListItemType = FC< ConnectionListItemProps >;

interface getSiteConnectionLineDataProps {
	isRegistered: boolean;
	hasSiteConnectionBrokenModules: boolean;
	handleConnectUser: ( e: MouseEvent< HTMLButtonElement > ) => void;
	openManageSiteConnectionDialog: ( e: MouseEvent ) => void;
}

export type getSiteConnectionLineDataType = (
	props: getSiteConnectionLineDataProps
) => ConnectionListItemProps;

interface getUserConnectionLineDataProps {
	hasProductsThatRequireUserConnection: boolean;
	hasUserConnectionBrokenModules: boolean;
	isUserConnected: boolean;
	// The user connection data from the connection package is untyped
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	userConnectionData: any;
	openManageUserConnectionDialog: ( e: MouseEvent ) => void;
	handleConnectUser: ( e: MouseEvent< HTMLButtonElement > ) => void;
}

export type getUserConnectionLineDataType = (
	props: getUserConnectionLineDataProps
) => ConnectionListItemProps;

interface ConnectionStatusCardProps {
	apiRoot: string;
	apiNonce: string;
	redirectUri?: string;
	title?: string;
	connectionInfoText?: string;
	onDisconnected?: () => void;
	connectedPlugins?: {
		name: string;
		slug: string;
	}[];
	connectedSiteId?: number;
	context?: string;
	onConnectUser?: ( props: unknown ) => void;
}

export type ConnectionStatusCardType = FC< ConnectionStatusCardProps >;
