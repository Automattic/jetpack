global.wpI18n = require( '@wordpress/i18n' );

/** Loader class. */
class I18nLoader {
	/** Map paths to promise-factory functions. */
	expect = {};

	/**
	 * "Download" an i18n file.
	 *
	 * Actually just returns a promise from `this.expect`, if any,
	 * or throws an error.
	 *
	 * @param {string} path - Path being "downloaded".
	 * @param {string} domain - Text domain.
	 * @returns {Promise} Promise.
	 */
	downloadI18n( path, domain ) {
		const ret = this.expect[ path ];
		if ( typeof ret === 'undefined' ) {
			throw new Error( `Unexpected call for ${ path }` );
		}
		if ( ret === null ) {
			throw new Error( `Path ${ path } was requested multiple times` );
		}
		this.expect[ expect ] = null;
		return ret( domain );
	}

	/**
	 * Mock a path.
	 *
	 * @param {string} path - Path.
	 * @param {object} data - I18n data.
	 */
	expectI18n( path, data ) {
		this.expect[ path ] = domain => {
			const localeData = data.locale_data[ domain ] || data.locale_data.messages;
			localeData[ '' ].domain = domain;
			global.wpI18n.setLocaleData( localeData, domain );
			return Promise.resolve();
		};
	}

	/**
	 * Mock an error.
	 *
	 * @param {string} path - Path.
	 * @param {Error}  err - Error.
	 */
	expectError = ( path, err ) => {
		this.expect[ path ] = () => {
			return Promise.reject( err );
		};
	};
}

global.I18nLoader = I18nLoader;
global.jpI18nLoader = new I18nLoader();
global.window = {
	...global.window,
	wp: {
		i18n: global.wpI18n,
		jpI18nLoader: global.jpI18nLoader,
	},
};
