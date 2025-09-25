/**
 * Margin configuration for legend container.
 * Can be a CSS margin string (e.g. '10px', '1rem 2rem', '10px 20px 30px 40px')
 * or an object with individual margin properties (e.g. {top: 10, right: 15, bottom: 10, left: 15})
 */
export type LegendMargin =
	| string
	| {
			top?: number | string;
			right?: number | string;
			bottom?: number | string;
			left?: number | string;
	  };
