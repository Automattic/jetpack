import { Spinner } from '@wordpress/components';
import { useApiKey } from '@/hooks/use-api-key';
import { AccountPanel } from '@/routes/account/account-panel';
import { ConnectFlow } from '@/routes/account/connect-flow';

/**
 * Top-level Account tab. Routes between the connect stepper and the
 * connected-state account card based on the API key query.
 *
 * The query cache is the single source of truth — both `<EnterKeyStep>`'s
 * setQueryData on success and `<AccountPanel>`'s setQueryData on disconnect
 * flow through this component and flip its rendered subtree.
 *
 * @return The current account-tab UI.
 */
export function AccountTab(): JSX.Element {
	const { data, isLoading } = useApiKey();

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! data?.valid ) {
		return <ConnectFlow onSuccess={ () => {} } />;
	}

	return <AccountPanel />;
}
