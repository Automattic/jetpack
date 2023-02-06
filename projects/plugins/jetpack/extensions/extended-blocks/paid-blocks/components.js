import { createContext } from '@wordpress/element';

/**
 * Paid Block context
 * Used to pass data between components of a Paid Block.
 */
export const PaidBlockContext = createContext();

/**
 * Paid Block Provider
 *
 * @param {object}  props - Provider properties.
 * @param {Function} props.onBannerVisibilityChange - Callback to set banner visibility.
 * @param {boolean} props.hasParentBanner - True if a parent of this block has a banner, which may or may not be visible.
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
export const PaidBlockProvider = ( { onBannerVisibilityChange, hasParentBanner, children } ) => (
	<PaidBlockContext.Provider
		value={ { onBannerVisibilityChange, hasParentBanner } }
		children={ children }
	/>
);
