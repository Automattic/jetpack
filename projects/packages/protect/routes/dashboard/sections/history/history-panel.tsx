import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import HistoryList from './history-list';
import { loadHistory, useHistory } from './store';

/**
 * The History tab: threats Scan has fixed, and ones that were ignored.
 *
 * @return The tab.
 */
export default function HistoryPanel() {
	const { threats, error } = useHistory();

	useEffect( () => {
		loadHistory();
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
			<>
				<CardRow className="jp-protect-card__stats">
					<Stat
						label={ __( 'Threats fixed', 'jetpack-protect-pkg' ) }
						value={ threats.filter( item => item.status === 'fixed' ).length }
					/>
					<Stat
						label={ __( 'Threats ignored', 'jetpack-protect-pkg' ) }
						value={ threats.filter( item => item.status === 'ignored' ).length }
					/>
					<Stat
						label={ __( 'All threats in history', 'jetpack-protect-pkg' ) }
						value={ threats.length }
					/>
				</CardRow>
				<CardRow className="jp-protect-card__threats">
					<HistoryList threats={ threats } />
				</CardRow>
			</>
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
