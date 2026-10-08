import { ThreatsDataViews } from '@automattic/jetpack-scan';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import './style.scss';
import type { Threat } from '@automattic/jetpack-scan';

/**
 * The History tab: threats Scan has fixed, and ones that were ignored.
 *
 * @return The tab.
 */
export default function HistoryPanel() {
	const [ threats, setThreats ] = useState< Threat[] | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		apiFetch< Threat[] >( { path: '/jetpack/v4/protect-dashboard/history' } )
			.then( setThreats )
			.catch( ( e: { message?: string } ) =>
				setError(
					e?.message || __( 'Scan history is unavailable right now.', 'jetpack-protect-pkg' )
				)
			);
	}, [] );

	let body;
	if ( error ) {
		body = (
			<CardRow>
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			</CardRow>
		);
	} else if ( ! threats ) {
		body = (
			<CardRow>
				<Stack direction="row" justify="center">
					<Spinner />
				</Stack>
			</CardRow>
		);
	} else if ( threats.length === 0 ) {
		body = (
			<CardRow>
				<Text variant="body-md">
					{ __(
						'No threats have been fixed or ignored yet. They’ll appear here once Scan has dealt with one.',
						'jetpack-protect-pkg'
					) }
				</Text>
			</CardRow>
		);
	} else {
		body = (
			<CardRow className="jp-protect-history__threats">
				<ThreatsDataViews
					data={ threats }
					showStatusFilter={ false }
					persistKey="jetpack-protect-dashboard:history:view"
				/>
			</CardRow>
		);
	}

	return (
		<div className="jp-protect-dashboard__cards">
			<ProtectCard icon={ backup } title={ __( 'Scan history', 'jetpack-protect-pkg' ) }>
				{ body }
			</ProtectCard>
		</div>
	);
}
