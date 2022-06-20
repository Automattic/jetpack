module.exports = {
	overrides: [
		{
			files: [ '**/test/*.[jt]s' ],
			extends: [ require.resolve( 'jetpack-js-tools/eslintrc/jest' ) ],
		},
	],
};
