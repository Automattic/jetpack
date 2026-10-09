import type { ComponentChildren } from 'preact';

export type SignInStatus = 'idle' | 'pending' | 'failed' | 'rate_limited';

export type Step = 'choose' | 'guest' | 'subscribe';

export type Subscribed = Record< string, boolean >;

export type LogInProps = {
	status: SignInStatus;
	onLogIn: () => void;
	onCancel: () => void;
};

export type DetailsFieldsProps = {
	emailTaken: boolean;
	introId?: string;
	logIn?: ComponentChildren;
};

export type SubscribeSwitchesProps = {
	subscribed: Subscribed;
	onChange: ( subscribed: Subscribed ) => void;
};
