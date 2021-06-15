// We have to stub `createInterpolateElement` with the identity function here, since the original
// `createInterpolateElement from '@wordpress/element'` only accepts strings as its first argument --
// but our replaced translation functions return a React element (`<span />`).
// This means that our rendered markup will contain `createInterpolateElement`-style
// `<placeholder>strings</placeholder>` for which we need to add an extra `str_replace()` step.
// This is done in `components.php`.
// TODO: Provide a wrapper around `@wordpress/element`'s `createInterpolateElement` that accepts
// React elements as first argument, and remove the `str_replace()` call in `components.php`.

export default x => x;
