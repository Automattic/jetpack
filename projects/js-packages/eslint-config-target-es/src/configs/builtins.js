const { getRules } = require( '../funcs' );

module.exports = {
	...require( './base' ),
	rules: getRules( { builtins: true } ),
};
