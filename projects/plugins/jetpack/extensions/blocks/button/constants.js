import { __experimentalUseGradient as useGradient } from '@wordpress/block-editor'; // eslint-disable-line wpcalypso/no-unsafe-wp-apis

export const IS_GRADIENT_AVAILABLE = !! useGradient;

export const INITIAL_BORDER_RADIUS_POSITION = 5;
export const MAX_BORDER_RADIUS_VALUE = 50;
export const MIN_BORDER_RADIUS_VALUE = 0;
