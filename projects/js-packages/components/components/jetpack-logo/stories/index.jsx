/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import { boolean, number, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import JetpackLogo from '../index.jsx';

export default {
	title: 'Playground/Jetpack Logo',
};

export const _default = () => {
	const defaultProps = {
		width: number( 'Width', 150 ),
		height: number( 'Height', 150 ),
		showText: boolean( 'Show Text', true ),
		logoColor: text( 'Color', '#AFA' ),
		className: text( 'Class Name', 'sample-classname' ),
	};

	return <JetpackLogo { ...defaultProps } />;
};
