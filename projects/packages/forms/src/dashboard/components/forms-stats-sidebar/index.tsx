import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Page from '../../components/page/index.tsx';

type Props = {
	formId: string;
	isOpen: boolean;
	onClose: () => void;
};

type FormStats = {
	total_responses: number;
	responses_last_7_days: number;
};

/**
 * Sidebar component to display basic stats for a single form.
 *
 * @param {Props} props - Component props.
 * @return {JSX.Element | null} Sidebar content.
 */
export default function FormsStatsSidebar( { formId, isOpen, onClose }: Props ) {
	const [ stats, setStats ] = useState< FormStats | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( ! isOpen || ! formId ) {
			return;
		}

		let isMounted = true;

		setIsLoading( true );

		apiFetch< FormStats >( {
			path: `/jetpack-forms/v1/forms/${ encodeURIComponent( formId ) }/stats`,
		} )
			.then( response => {
				if ( ! isMounted ) {
					return;
				}
				setStats( response );
				setIsLoading( false );
			} )
			.catch( () => {
				if ( ! isMounted ) {
					return;
				}
				setStats( null );
				setIsLoading( false );
			} );

		return () => {
			isMounted = false;
		};
	}, [ formId, isOpen ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<div className="jp-forms-layout__surface is-inspector">
			<Page
				showSidebarToggle={ false }
				hasPadding={ true }
				title={ __( 'Form stats', 'jetpack-forms' ) }
				subTitle=""
				actions={
					<button type="button" onClick={ onClose } className="button button-link">
						{ __( 'Close', 'jetpack-forms' ) }
					</button>
				}
			>
				{ isLoading && <p>{ __( 'Loading stats…', 'jetpack-forms' ) }</p> }
				{ ! isLoading && stats && (
					<ul className="jp-forms-stats-list">
						<li>
							<strong>{ __( 'Total submissions', 'jetpack-forms' ) }:</strong>{ ' ' }
							{ stats.total_responses }
						</li>
						<li>
							<strong>{ __( 'Last 7 days', 'jetpack-forms' ) }:</strong>{ ' ' }
							{ stats.responses_last_7_days }
						</li>
					</ul>
				) }
				{ ! isLoading && ! stats && (
					<p>{ __( 'No stats available for this form yet.', 'jetpack-forms' ) }</p>
				) }
			</Page>
		</div>
	);
}
