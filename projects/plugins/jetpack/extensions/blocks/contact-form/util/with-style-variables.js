import './form-styles.js';
import { useCallback } from '@wordpress/element';

export const withStyleVariables = WrappedComponent => props => {
	const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';
	/* eslint-disable-next-line no-undef */
	const generateVariables = useCallback( () => generateStyleVariables( EDITOR_SELECTOR ), [] );

	return <WrappedComponent style={ generateVariables() } { ...props } />;
};
