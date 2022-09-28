import {
	NumberControl as BlockEditorNumberControl,
	__experimentalNumberControl as ExperimentalNumberControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	TextControl,
} from '@wordpress/components';

/**
 * This uses the publicly accessible or experimental NumberControl
 * from the block editor where available, otherwise it falls back
 * to a standard TextControl, limited to numbers.
 *
 * @param {any} props - the NumberControl component props
 * @returns {object} - NumberControl component
 */
const NumberControl =
	BlockEditorNumberControl ||
	ExperimentalNumberControl ||
	function CustomNumberControl( props ) {
		return <TextControl type="number" inputMode="numeric" { ...props } />;
	};

export default NumberControl;
