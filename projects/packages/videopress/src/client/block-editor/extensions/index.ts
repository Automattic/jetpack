/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'videopress:extensions' );

const extensions = window?.videoPressExtensions || {};

debug( 'Extensions: %o', extensions );
