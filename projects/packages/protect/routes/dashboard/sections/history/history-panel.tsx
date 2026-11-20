import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import HistoryList from './history-list';
import HistorySkeleton from './history-skeleton';
import { loadHistory, useHistory } from './store';
import './style.scss';

/**
 * The History tab: threats Scan has fixed, and ones that were ignored.
 *
 * @return The tab.
 */
export default function HistoryPanel() {
	const { threats, error } = useHistory();

	useEffect( () => {
		loadHistory( true );
	}, [] );

	let body;
	if ( error && ! threats ) {
		body = (
			<CardRow>
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			</CardRow>
		);
	} else if ( ! threats ) {
		body = (
			<CardRow className="jp-protect-card__threats">
				<HistorySkeleton />
			</CardRow>
		);
	} else {
		body = (
			<CardRow className="jp-protect-card__threats">
				<HistoryList threats={ threats } />
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
