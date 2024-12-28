import { Threat } from '@automattic/jetpack-scan';
import { Field, View } from '@wordpress/dataviews';
import { Dispatch, SetStateAction } from 'react';

export type ConnectionProps = {
	isUserConnected?: boolean;
	hasConnectedOwner?: boolean;
	userIsConnecting?: boolean;
	onConnectUser?: () => void;
};

export type CredentialsProps = {
	hasCredentials?: boolean;
	isFetching?: boolean;
	redirectUrl?: string;
};

export type ActionCallbacks = {
	[ key: string ]: {
		isEligible: ( item: Threat ) => boolean;
		callback: ( items: Threat[] ) => void;
	};
};

export type ControlledThreatField = Field< Threat > & {
	/** Callback that determines hether the field should be shown by default based on the provided view config. */
	isDefault?: ( v: View ) => boolean;
	/** Insert the field after a specific child field, instead of appending to the end. */
	insertAfter?: string;
	/** The specific view types for which the field should be included. */
	views?: string[];
};

export type ThreatsDataViewsContext = {
	credentials?: CredentialsProps;
	connection: ConnectionProps;
	data: Threat[];
	supportedFields?: string[];
	actionCallbacks?: ActionCallbacks;
	view: View;
	setView: Dispatch< SetStateAction< View > >;
	onChangeView?: ( view: View ) => void;
	onUpgrade?: () => void;
	selectedThreat: Threat | null;
	setSelectedThreat: Dispatch< SetStateAction< Threat | null > >;
	forceShowFields: string[];
	setForceShowFields: Dispatch< SetStateAction< string[] > >;
};
