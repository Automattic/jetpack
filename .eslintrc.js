module.exports = {
	"parser": "babel-eslint",
	"extends": "wpcalypso/react-a11y",
	"env": {
		"browser": true,
		"es6": true,
		"mocha": true,
		"node": true,
		"jquery": true
	},
	"ecmaFeatures": {
		"jsx": true,
		"modules": true
	},
	"plugins": [
		"eslint-plugin-react",
		"lodash"
	],
	"rules": {
		"array-bracket-spacing": [ 2, "always" ],
		"brace-style": [ 2, "1tbs" ],
		// REST API objects include underscores
		"camelcase": 0,
		"comma-spacing": 2,
		"curly": 2,
		"computed-property-spacing": [ 2, "always" ],
		"func-call-spacing": 2,
		"indent": [ 2, "tab", { "SwitchCase": 1 } ],
		"jsx-quotes": [ 2, "prefer-double" ],
		"key-spacing": 2,
		"keyword-spacing": 2,
		"lodash/import-scope": [ 2, "method" ],
		"max-len": 0, // Ignored for Jetpack
		"new-cap": [ 2, { "capIsNew": false, "newIsCap": true } ],
		"no-else-return": 2,
		"no-extra-semi": 2,
		"no-multiple-empty-lines": [ 2, { max: 1 } ],
		"no-multi-spaces": 2,
		"no-restricted-imports": [ 2, "lib/sites-list", "lib/mixins/data-observe" ],
		"no-restricted-modules": [ 2, "lib/sites-list", "lib/mixins/data-observe" ],
		"no-shadow": 2,
		"no-spaced-func": 2,
		"no-trailing-spaces": 2,
		// Allows Chai `expect` expressions
		"no-unused-expressions": 0,
		"no-unused-vars": 2,
		"no-var": 2,
		"object-curly-spacing": [ 2, "always" ],
		"operator-linebreak": [ 2, "after", { "overrides": {
			"?": "before",
			":": "before"
		} } ],
		"padded-blocks": [ 2, "never" ],
		"prefer-const": 2,
		"quote-props": [ 2, "as-needed", { "keywords": true } ],
		"quotes": [ 2, "single", "avoid-escape" ],
		"react/jsx-curly-spacing": [ 2, "always" ],
		"react/jsx-no-bind": 2,
		"react/jsx-space-before-closing": 2,
		"react/no-danger": 2,
		"react/no-did-mount-set-state": 2,
		"react/no-did-update-set-state": 2,
		"react/no-is-mounted": 2,
		"react/prefer-es6-class": 1,
		"semi": 2,
		"semi-spacing": 2,
		"space-before-blocks": [ 2, "always" ],
		"space-before-function-paren": [ 2, "never" ],
		"space-in-parens": [ 2, "always" ],
		"space-infix-ops": [ 2, { "int32Hint": false } ],
		"space-unary-ops": [ 2, {
			"overrides": {
				"!": true
			}
		} ],
		"template-curly-spacing": [ 2, "always" ],
		"valid-jsdoc": [ 2, { "requireReturn": false } ],
		"wpcalypso/i18n-ellipsis": 2,
		"wpcalypso/i18n-no-collapsible-whitespace": 2,
		"wpcalypso/i18n-no-this-translate": 2,
		"wpcalypso/i18n-no-variables": 2,
		"wpcalypso/i18n-mismatched-placeholders": 2,
		"wpcalypso/import-docblock": 2,
		"wpcalypso/jsx-gridicon-size": 0, // Ignored for Jetpack
		"wpcalypso/jsx-classname-namespace": 0 // Ignored for Jetpack
	}
}
