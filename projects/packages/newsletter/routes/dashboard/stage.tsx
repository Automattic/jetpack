import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { queryClient } from '../../_inc/subscribers/lib/query-client';

const Stage = () => {
	return (
		<QueryClientProvider client={ queryClient }>
			{ /* "Newsletter" is a product name, do not translate. */ }
			<Page title="Newsletter" />
		</QueryClientProvider>
	);
};

export { Stage as stage };
