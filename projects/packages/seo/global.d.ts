declare module '*.module.scss';
declare module '*.scss';
declare module '*.svg';

interface Window {
	jetpackSeoInitialState?: import('./_inc/types').JetpackSeoInitialState;
	jetpackSeoRest?: {
		apiRoot: string;
		apiNonce: string;
	};
}
