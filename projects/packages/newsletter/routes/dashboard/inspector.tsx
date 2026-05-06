import { Page } from '@wordpress/admin-ui';

const Inspector = () => {
	// Subscriber detail content lands in a follow-up PR; the empty Page keeps
	// the inspector slot stable so the route hook can target it.
	return <Page hasPadding={ false } />;
};

export { Inspector as inspector };
