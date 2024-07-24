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
	getDisabledFeatures: () => Array< string >;
	getBlockMd5: ( feature: string, blockId: string ) => string;
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
};

export type BreveDispatch = {
	setHighlightHover: ( isHover: boolean ) => void;
	setPopoverHover: ( isHover: boolean ) => void;
	setPopoverAnchor: ( anchor: Anchor ) => void;
	toggleProofread: ( force?: boolean ) => void;
	toggleFeature: ( feature: string, force?: boolean ) => void;
	invalidateSuggestions: ( feature: string, blockId: string ) => void;
	setBlockMd5: ( feature: string, blockId: string, md5: string ) => void;
	setSuggestions: ( suggestions: {
		id: string;
		feature: string;
		target: string;
		text: string;
		blockId: string;
		occurrence: string;
	} ) => void;
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
};

export type HighlightedText = {
	text: string;
	suggestion?: string;
	startIndex: number;
	endIndex: number;
};
