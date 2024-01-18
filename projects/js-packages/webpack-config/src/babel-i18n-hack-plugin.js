/**
 * This is a hacky little babel plugin to rename identifiers that conflict with WordPress's i18n functions.
 */

const regex = /^_(?:[_nx]|nx)e*$/;

module.exports = () => {
	return {
		name: 'I18nHack',
		visitor: {
			Identifier( path ) {
				if ( regex.test( path.node.name ) ) {
					path.node.name = path.node.name + 'e';
				}
			},
		},
	};
};
