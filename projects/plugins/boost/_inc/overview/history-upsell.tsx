import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, lockOutline } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';
import { useId, useMemo, useState } from 'react';
import HistoryChartCard from './history-chart-card';
import { buildSampleHistory } from './lib/sample-history';
import UpgradeCTA from './upgrade-cta';
import './history-upsell.scss';
import type { HistoryWindow } from './lib/history-days';

type Props = {
	range: HistoryWindow;
	dayCount: 15 | 30;
	isVisible?: boolean;
};

export const previewExpandedKey = 'jetpack-boost-history-preview-expanded';

function readExpanded() {
	try {
		return window.sessionStorage.getItem( previewExpandedKey ) === '1';
	} catch {
		return false;
	}
}

// React 18 has no `inert` prop; it keeps the sample chart out of the tab order.
function makeInert( node: HTMLDivElement | null ) {
	node?.setAttribute( 'inert', '' );
}

const noop = () => {};

export default function HistoryUpsell( { range, dayCount, isVisible = true }: Props ) {
	const [ isExpanded, setIsExpanded ] = useState( readExpanded );
	const previewId = useId();
	const { startDate, endDate } = range;
	const sample = useMemo(
		() => buildSampleHistory( { startDate, endDate } ),
		[ startDate, endDate ]
	);
	const toggle = () => {
		setIsExpanded( ! isExpanded );
		try {
			window.sessionStorage.setItem( previewExpandedKey, isExpanded ? '0' : '1' );
		} catch {
			// The preview still toggles when session storage is unavailable.
		}
	};

	return (
		<Notice.Root
			intent="info"
			icon={ lockOutline }
			spokenMessage={ null }
			className="jetpack-boost-overview__history-upsell"
		>
			<Notice.Description>
				{ __( 'Learn more about your site performance over time.', 'jetpack-boost' ) }{ ' ' }
				<UpgradeCTA />
			</Notice.Description>
			<Notice.CloseIcon
				icon={ isExpanded ? chevronUp : chevronDown }
				label={
					isExpanded
						? __( 'Hide score history preview', 'jetpack-boost' )
						: __( 'Show score history preview', 'jetpack-boost' )
				}
				aria-expanded={ isExpanded }
				aria-controls={ previewId }
				onClick={ toggle }
			/>
			<div
				id={ previewId }
				className="jetpack-boost-overview__history-preview"
				role="img"
				aria-label={ __( 'Score history chart with sample data', 'jetpack-boost' ) }
				hidden={ ! isExpanded }
			>
				{ isExpanded && (
					<div ref={ makeInert }>
						<HistoryChartCard
							range={ range }
							dayCount={ dayCount }
							data={ sample }
							isVisible={ isVisible }
							canGoNext={ false }
							onPrevious={ noop }
							onNext={ noop }
							onRetry={ noop }
							onDismissFreshStart={ noop }
						/>
					</div>
				) }
			</div>
		</Notice.Root>
	);
}
