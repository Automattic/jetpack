/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from '@wordpress/element';
import { SubscriberDataViews } from './components/subscriber-data-views';

import './style.module.scss';

const queryClient = new QueryClient();

const JetpackSubscribers = () => {
	return (
		<QueryClientProvider client={ queryClient }>
			<SubscriberDataViews />
			<p>ok</p>
		</QueryClientProvider>
	);
};

/**
 * The initial renderer function.
 */
async function render() {
	const container = document.getElementById( 'jetpack-subscribers' );
	if ( null === container ) {
		return;
	}
	createRoot( container ).render( <JetpackSubscribers /> );
}

render();
