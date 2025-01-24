import {
	__experimentalNumberControl as ExperimentalNumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	TextControl,
} from '@wordpress/components';

/**
 * This uses the experimental NumberControl from the block
 * editor where available, otherwise it falls back to a
 * standard TextControl, limited to numbers.
 *
 * @param {any} props - the NumberControl component props
 * @return {object} - NumberControl component
 */
const NumberControl =
	ExperimentalNumberControl ||
	function CustomNumberControl( props ) {
		return <TextControl type="number" inputMode="numeric" { ...props } />;
	};

export default NumberControl;
