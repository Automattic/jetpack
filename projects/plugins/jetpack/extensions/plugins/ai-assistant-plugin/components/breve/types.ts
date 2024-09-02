export type BreveControls = () => React.JSX.Element;

export type Anchor = {
	target: HTMLElement;
	virtual: {
		getBoundingClientRect: () => DOMRect;
		contextElement?: HTMLElement;
	};
};

export type BreveState = {
	popover?: {
		isHighlightHover?: boolean;
		isPopoverHover?: boolean;
		anchor?: Anchor;
		level?: number;
	};
	configuration?: {
		enabled?: boolean;
		disabled?: Array< string >;
		loading?: Array< string >;
		reload?: boolean;
	};
	suggestions?: {
		[ key: string ]: {
			[ key: string ]: {
				[ key: string ]: {
					loading: boolean;
					suggestions: {
						html: string;
						suggestion: string;
					};
				};
			};
		};
	};
};

export type BreveSelect = {
	isHighlightHover: () => boolean;
	isPopoverHover: () => boolean;
	getPopoverAnchor: () => Anchor | null;
	getPopoverLevel: () => number;
	isProofreadEnabled: () => boolean;
	isFeatureEnabled: ( feature: string ) => boolean;
	isFeatureDictionaryLoading: ( feature: string ) => boolean;
	getDisabledFeatures: () => Array< string >;
	getBlockMd5: ( blockId: string ) => string;
	getSuggestionsLoading: ( {
		feature,
		id,
		blockId,
	}: {
		feature: string;
		id: string;
		blockId: string;
	} ) => boolean;
	getSuggestions: ( {
		feature,
		id,
		blockId,
	}: {
		feature: string;
		id: string;
		blockId: string;
	} ) => {
		html: string;
		suggestion: string;
	};
	getIgnoredSuggestions: ( { blockId }: { blockId: string } ) => Array< string >;
	getReloadFlag: () => boolean;
};

export type BreveDispatch = {
	setHighlightHover: ( isHover: boolean ) => void;
	setPopoverHover: ( isHover: boolean ) => void;
	setPopoverAnchor: ( anchor: Anchor ) => void;
	toggleProofread: ( force?: boolean ) => void;
	toggleFeature: ( feature: string, force?: boolean ) => void;
	setDictionaryLoading( feature: string, loading: boolean ): void;
	invalidateSuggestions: ( blockId: string ) => void;
	invalidateSingleSuggestion: ( feature: string, blockId: string, id: string ) => void;
	reloadDictionary: () => void;
	ignoreSuggestion: ( blockId: string, id: string ) => void;
	setBlockMd5: ( blockId: string, md5: string ) => void;
	setSuggestions: ( suggestions: {
		anchor: Anchor[ 'target' ];
		id: string;
		feature: string;
		target: string;
		text: string;
		blockId: string;
		occurrence: string;
	} ) => void;
};

export type PlansSelect = {
	getAiAssistantFeature: () => {
		featuresControl: { [ key: string ]: FeatureControl };
		currentTier?: {
			value?: number;
		};
	};
};

export type BreveFeatureConfig = {
	name: string;
	title: string;
	tagName: string;
	className: string;
	defaultEnabled: boolean;
};

export type BreveFeature = {
	config: BreveFeatureConfig;
	highlight: ( text: string ) => Array< HighlightedText >;
	dictionary?: { [ key: string ]: string };
	description: string;
};

export type HighlightedText = {
	text: string;
	suggestion?: string;
	startIndex: number;
	endIndex: number;
};

export type SpellChecker = {
	correct: ( word: string ) => boolean;
	suggest: ( word: string ) => Array< string >;
	add: ( word: string ) => void;
	personal: ( dic: string ) => void;
};

export type SpellingDictionaryContext = {
	affix: string;
	dictionary: string;
};

export type FeatureControl = {
	enabled: boolean;
	'min-jetpack-version': string;
	[ key: string ]: FeatureControl | boolean | string;
};
