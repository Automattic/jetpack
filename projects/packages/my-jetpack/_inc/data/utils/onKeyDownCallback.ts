// Used to wrap a callback function in a keydown event listener to act as a button element would
const onKeyDownCallback = ( event: KeyboardEvent, callback: () => void ) => {
	if ( event.key === 'Enter' || event.key === ' ' ) {
		callback();
	}
};

export default onKeyDownCallback;
