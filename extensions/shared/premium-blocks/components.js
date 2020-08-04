
/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Premium Block context
 * Used to pass data between components of a Premium Block.
 */
export const PremiumBlockContext = createContext();

/**
 * Premium Block Provider
 *
 * @param {object}  props - Provider properties.
 * @param {Function}  props.onBannerVisibilityChange - Callback to set banner visibility.
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
export const PremiumBlockProvider = ( { onBannerVisibilityChange, children } ) =>
	<PremiumBlockContext.Provider
		value={ onBannerVisibilityChange }
		children={ children }
	/>;
