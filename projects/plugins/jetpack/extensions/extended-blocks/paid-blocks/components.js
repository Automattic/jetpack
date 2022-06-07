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
 * @param {Function}  props.onBannerVisibilityChange - Callback to set banner visibility.
 * @param {Function} props.onChildBannerVisibilityChange - Callback to set child banner visibility.
 * @param {boolean} props.hasParentBanner - True if a parent of this block has a banner, which may or may not be visible.
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
export const PaidBlockProvider = ( {
	onBannerVisibilityChange,
	onChildBannerVisibilityChange,
	hasParentBanner,
	children,
} ) => (
	<PaidBlockContext.Provider
		value={ { onBannerVisibilityChange, onChildBannerVisibilityChange, hasParentBanner } }
		children={ children }
	/>
);
