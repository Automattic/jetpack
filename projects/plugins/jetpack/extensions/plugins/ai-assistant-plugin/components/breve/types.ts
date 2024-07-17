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
};

export type BreveSelect = {
	isHighlightHover: () => boolean;
	isPopoverHover: () => boolean;
	getPopoverAnchor: () => Anchor | null;
	getPopoverLevel: () => number;
	isProofreadEnabled: () => boolean;
	isFeatureEnabled: ( feature: string ) => boolean;
	getDisabledFeatures: () => Array< string >;
};

export type BreveDispatch = {
	setHighlightHover: ( isHover: boolean ) => void;
	setPopoverHover: ( isHover: boolean ) => void;
	setPopoverAnchor: ( anchor: Anchor ) => void;
	increasePopoverLevel: () => void;
	decreasePopoverLevel: () => void;
	toggleProofread: ( force?: boolean ) => void;
	toggleFeature: ( feature: string, force?: boolean ) => void;
};

export type BreveFeatureConfig = {
	name: string;
	title: string;
	tagName: string;
	className: string;
};

export type BreveFeature = {
	config: BreveFeatureConfig;
	highlight: ( text: string ) => Array< HighlightedText >;
};

export type HighlightedText = {
	text: string;
	suggestion?: string;
	startIndex: number;
	endIndex: number;
};
