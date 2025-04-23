declare module '*.mdx';
declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}

// Add the process declaration
declare const process: {
	env: {
		NODE_ENV: 'development' | 'production' | 'test';
	};
};

type AvailableBlockProps =
	| {
			available?: boolean;
	  }
	| undefined;

interface Window {
	Initial_State?: {
		adminUrl?: string;
	};
	Jetpack_Editor_Initial_State: {
		available_blocks: {
			'ai-assistant-form-support': AvailableBlockProps;
			'voice-to-content': AvailableBlockProps;
		};
		adminUrl: string;
		siteLocale: string;
		'ai-assistant': {
			'is-enabled': boolean;
			'has-feature': boolean;
			'is-over-limit': boolean;
			'requests-count': number;
			'requests-limit': number;
			'usage-period': {
				'current-start': string;
				'next-start': string;
				'requests-count': number;
			};
			'site-require-upgrade': boolean;
			'error-message'?: string;
			'error-code'?: string;
			'upgrade-type': UpgradeTypeProp;
			'current-tier': TierProp;
			'tier-plans': Array< TierProp >;
			'next-tier'?: TierProp | null;
		};
		screenBase?: string;
		wpcomBlogId?: string;
		tracksUserData?: {
			userid: string;
			username: string;
		};
		siteFragment?: string;
	};
	wpcomFetch: function;
}
