import { __ } from '@wordpress/i18n';

export const FIELD_USER_ID = 'user_id';
export const FIELD_USER_LOGIN = 'user_login';
export const FIELD_USER_ROLES = 'user_roles';
export const FIELD_IP = 'ip';
export const FIELD_LOGIN = 'login';
export const FIELD_EXPIRATION = 'expiration';
export const FIELD_USER_AGENT = 'user_agent';
export const FIELD_TOKEN = 'token';
export const FIELD_ICON = 'icon';
export const FIELD_STATUS = 'status';

export const STATUS_TYPES = [
	{ value: 'valid', label: __( 'Valid', 'jetpack-components' ) },
	{ value: 'suspicious', label: __( 'Suspicious', 'jetpack-components' ) },
];

export const USER_ROLE_TYPES = [
	{ value: 'unknown', label: __( 'Unknown', 'jetpack-components' ) },
	{ value: 'administrator', label: __( 'Administrator', 'jetpack-components' ) },
	{ value: 'editor', label: __( 'Editor', 'jetpack-components' ) },
	{ value: 'author', label: __( 'Author', 'jetpack-components' ) },
	{ value: 'contributor', label: __( 'Contributor', 'jetpack-components' ) },
	{ value: 'subscriber', label: __( 'Subscriber', 'jetpack-components' ) },
	{ value: 'custom', label: __( 'Custom', 'jetpack-components' ) },
];
