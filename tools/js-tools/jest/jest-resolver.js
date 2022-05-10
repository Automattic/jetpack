// Work around some packages that only provide module versions in jest's jsdom environment.
// https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149

module.exports = ( path, options ) => {
	return options.defaultResolver( path, {
		...options,
		packageFilter: pkg => {
			if ( pkg.name === 'uuid' || pkg.name === 'react-colorful' ) {
				delete pkg.exports;
				delete pkg.module;
			}
			return pkg;
		},
	} );
};
