module.exports = function transformer( file, api ) {
	const j = api.jscodeshift;

	return j( file.source )
		.find( j.ConditionalExpression )
		.filter( path => {
			const { consequent, alternate } = path.value;

			// Check if the consequent or alternate is a function call to targetFunctionName
			return (
				isFunctionCallWithName( consequent, '__' ) || isFunctionCallWithName( alternate, '__' )
			);
		} )
		.forEach( path => {
			const { alternate } = path.value;

			// Add the new argument to the alternate function call
			const newAlternateArguments = [
				...alternate.arguments,
				j.literal( 0 ), // Create a literal AST node for the new argument
			];

			// Create a new CallExpression node with the updated arguments
			const newAlternate = j.callExpression( alternate.callee, newAlternateArguments );

			// Update the alternate branch of the ternary expression
			path.value.alternate = newAlternate;
		} )
		.toSource();
};

/**
 * Whether the node is a function call with the specific name
 *
 * @param node - The AST node
 * @param functionName - The function name we want to check
 */
function isFunctionCallWithName( node, functionName ) {
	return (
		node &&
		node.type === 'CallExpression' &&
		node.callee &&
		node.callee.type === 'Identifier' &&
		node.callee.name === functionName
	);
}
