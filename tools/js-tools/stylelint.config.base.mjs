import { fileURLToPath } from 'node:url';

const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss' ) ),
};

export default baseConfig;
