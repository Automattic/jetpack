import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import useStatusTabs from './useStatusTabs';
import './style.scss';

/**
 * Renders the status toggle for the inbox view.
 *
 * @return {JSX.Element} The status toggle component.
 */
export default function InboxStatusToggle() {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const status = searchParams.get( 'status' ) || 'inbox';

	const statusTabs = useStatusTabs();

	const handleChange = useCallback(
		newStatus => {
			setSearchParams( prev => {
				const params = new URLSearchParams( prev );
				params.set( 'status', newStatus );
				return params;
			} );
		},
		[ setSearchParams ]
	);

	return (
		<ToggleGroupControl
			className="jp-forms__inbox-status-toggle"
			value={ status }
			onChange={ handleChange }
		>
			{ statusTabs.map( option => (
				<ToggleGroupControlOption
					key={ option.value }
					value={ option.value }
					label={ option.label }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
