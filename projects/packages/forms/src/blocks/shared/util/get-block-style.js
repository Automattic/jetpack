const getBlockStyle = className => {
	const styleClass = className && className.match( /is-style-([^\s]+)/i );
	return styleClass ? styleClass[ 1 ] : '';
};

export default getBlockStyle;
