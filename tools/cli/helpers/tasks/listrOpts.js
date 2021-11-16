/**
 * External dependencies
 */
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';

/**
 * Returns standard options for verbose renderers.
 *
 * @param {object} options - Argv from command line.
 * @returns {object} - Options object for Listr.
 */
export default function listrOpts( options ) {
	options = {
		v: options.v || false,
		...options,
	};

	return {
		concurrent: ! options.v,
		renderer: options.v ? VerboseRenderer : UpdateRenderer,
	};
}
