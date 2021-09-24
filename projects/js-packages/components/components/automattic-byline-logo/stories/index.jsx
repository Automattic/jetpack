/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import AutomatticBylineLogo from '../index.jsx';

export default {
	title: 'Playground/Automattic Byline Logo',
};

export const _default = () => {
	const defaultProps = {
		title: text( 'Title', true ),
		height: text( 'Height', '50px' ),
		className: text( 'Class Name', 'sample-classname' ),
	};

	return <AutomatticBylineLogo { ...defaultProps } />;
};
