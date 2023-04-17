import './form-styles.js';
import { useRef } from '@wordpress/element';

export const withStyleVariables = WrappedComponent => props => {
	const { generateStyleVariables } = window.jetpackForms;
	const componentRef = useRef();

	return (
		<WrappedComponent
			style={ generateStyleVariables( componentRef?.current ) }
			{ ...props }
			ref={ componentRef }
		/>
	);
};
