/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import * as Tabs from '../tabs/index.ts';

type TabValue = 'forms' | 'responses';

/**
 * Route-aware top tabs for the Forms dashboard (Forms / All Responses).
 * This component controls routing; it does not manage filters.
 *
 * @return {JSX.Element} The tabs component.
 */
export default function FormsResponsesTabs(): JSX.Element {
	const location = useLocation();
	const navigate = useNavigate();

	const value: TabValue = location.pathname === '/forms' ? 'forms' : 'responses';

	const onValueChange = useCallback(
		( nextValue: TabValue ) => {
			navigate( nextValue === 'forms' ? '/forms' : '/responses' );
		},
		[ navigate ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ onValueChange }>
			<Tabs.List density="compact">
				<Tabs.Tab value="responses">{ __( 'Responses', 'jetpack-forms' ) }</Tabs.Tab>
				<Tabs.Tab value="forms">{ __( 'Forms', 'jetpack-forms' ) }</Tabs.Tab>
			</Tabs.List>
		</Tabs.Root>
	);
}
