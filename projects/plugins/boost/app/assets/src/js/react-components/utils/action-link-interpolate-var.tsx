/**
 * Generates an Interpolate Element for a link which triggers the given function,
 * preventing the default event along the way.
 *
 * The callback function gets one argument; the name="" argument supplied to the
 * link element.
 *
 * @param {Function} callback   function to call when the link is clicked.
 * @param {string}   elementKey element key to use for this link. Default: 'action'
 * @return {Object}  An object with the elementKey as key and the Interpolate Element as value.
 */
const actionLinkInterpolateVar = ( callback: ( name: string ) => void, elementKey = 'action' ) => {
	const handleOnClick = event => {
		event.preventDefault();
		callback( ( event.target as Element ).getAttribute( 'name' ) );
	};

	return {
		// eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid
		[ elementKey ]: <a className="action" onClick={ handleOnClick } href="#" />,
	};
};

export default actionLinkInterpolateVar;
