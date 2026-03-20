export interface ConnectionErrorData {
	action?: string;
	action_label?: string;
	action_variant?: 'primary' | 'secondary';
	action_url?: string;
	tracking_event?: string;
	secondary_action?: string;
	secondary_action_url?: string;
	secondary_action_label?: string;
	secondary_action_variant?: 'primary' | 'secondary';
	secondary_tracking_event?: string;
	[ key: string ]: unknown;
}

export interface ConnectionErrorObject {
	error_message: string;
	error_code?: string;
	user_id?: string;
	error_type?: string;
	error_data?: ConnectionErrorData;
	[ key: string ]: unknown;
}

/**
 * The shape of connectionErrors from the store: a nested object keyed by error code, then user ID.
 */
export type ConnectionErrorMap = Record< string, Record< string, ConnectionErrorObject > >;

export interface Action {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

export interface ConnectionErrorProps {
	actionHandlers?: Record< string, ( error: ConnectionErrorObject ) => void >;
	trackingCallback?: ( ( event: string, data: object ) => void ) | null;
	customActions?:
		| ( (
				error: ConnectionErrorObject,
				helpers: {
					restoreConnection: () => void;
					isRestoringConnection: boolean;
				}
		  ) => Action[] )
		| null;
}
