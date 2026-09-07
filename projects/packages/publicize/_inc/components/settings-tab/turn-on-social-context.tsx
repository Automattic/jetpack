import { createContext, useContext } from '@wordpress/element';

export type TurnOnSocialContextValue = {
	/** True from the moment "Turn on Social" is clicked until the page reloads. */
	isEnabling: boolean;
	/** Enable the Social module, then reload once the save resolves. */
	turnOn: () => void;
};

/**
 * Shares the "turning Social on" latch between the page shell — which decides
 * whether to collapse to the turn-on surface — and the turn-on button, which
 * triggers the enable + reload. The latch stays true from click until the
 * reload, so the dashboard never flashes the enabled tabs during the save: we
 * wait on the toggle, keep the button busy, then reload straight onto Overview.
 */
const TurnOnSocialContext = createContext< TurnOnSocialContextValue >( {
	isEnabling: false,
	turnOn: () => {},
} );

export const TurnOnSocialProvider = TurnOnSocialContext.Provider;

export const useTurnOnSocial = () => useContext( TurnOnSocialContext );
