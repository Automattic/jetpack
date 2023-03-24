import './form-styles.js';

export const withStyleVariables = WrappedComponent => props => {
	const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';
	const { generateStyleVariables } = window.jetpackForms;

	return <WrappedComponent style={ generateStyleVariables( EDITOR_SELECTOR ) } { ...props } />;
};
