export type BreveControls = () => React.JSX.Element;

export type BreveState = {
	popover?: {
		isHighlightHover?: boolean;
		isPopoverHover?: boolean;
		anchors?: Array< HTMLElement | EventTarget >;
		level?: number;
		frozenAnchor?: HTMLElement | EventTarget;
	};
	configuration?: {
		enabled?: boolean;
		disabled?: Array< string >;
	};
};

export type BreveSelect = {
	isHighlightHover: () => boolean;
	isPopoverHover: () => boolean;
	getPopoverAnchor: () => HTMLElement | EventTarget;
	getPopoverLevel: () => number;
	isProofreadEnabled: () => boolean;
	isFeatureEnabled: ( feature: string ) => boolean;
	getDisabledFeatures: () => Array< string >;
};

export type BreveDispatch = {
	setHighlightHover: ( isHover: boolean ) => void;
	setPopoverHover: ( isHover: boolean ) => void;
	setPopoverAnchor: ( anchor: HTMLElement | EventTarget ) => void;
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
