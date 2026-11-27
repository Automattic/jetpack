import { formatCurrency, formatNumber } from '@automattic/number-formatters';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';
import { Badge, Icon, Tabs, VisuallyHidden } from '@wordpress/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { localizeUrl } from '../../../compat/utils';
import useCreditBalanceQuery from '../../../data/promote-post/use-promote-post-credit-balance-query';
import { useCreditExpirationLines } from '../../hooks/use-credit-expiration-lines';
import { TabOption, TabType } from '../../main';
import { getCreditExpirationInfo } from '../../utils';

import './style.scss';

type Props = {
	tabs: TabOption[];
	selectedTab: TabType;
};

/**
 * The credit balance, with its expiry dates in a popover.
 *
 * @param props                  - Props.
 * @param props.formattedBalance - Balance to show.
 * @return The balance.
 */
function CreditBalanceContent( { formattedBalance }: { formattedBalance: string } ) {
	const { data: { history: creditsHistory = [] } = {} } = useCreditBalanceQuery();
	const [ isVisible, setIsVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLSpanElement | null >( null );

	// Get all credits sorted by expiration (not just those expiring soon)
	const { sortedHistory } = useMemo(
		() => getCreditExpirationInfo( creditsHistory ),
		[ creditsHistory ]
	);

	const expirationLines = useCreditExpirationLines( sortedHistory, true );

	return (
		<>
			{ __( 'Credits:', 'jetpack-blaze' ) } { formattedBalance }
			<span
				ref={ setPopoverAnchor }
				onMouseEnter={ () => setIsVisible( true ) }
				onMouseLeave={ () => setIsVisible( false ) }
			>
				<a
					className="credits-inline-support-link"
					href={ localizeUrl( 'https://wordpress.com/support/promote-a-post/blaze-credits/' ) }
					target="_blank"
					rel="noopener noreferrer"
					aria-label={ __( 'About Blaze credits (opens in a new tab)', 'jetpack-blaze' ) }
				>
					<Icon icon={ help } size={ 16 } />
				</a>
			</span>
			{ isVisible && expirationLines && (
				<Popover
					offset={ 26 }
					placement="right"
					anchor={ popoverAnchor }
					className="promote-post-i2__filter-credits-popover"
					noArrow={ false }
				>
					<div>
						<div className="promote-post-i2__filter-credits-popover-header">
							{ expirationLines[ 0 ] }
						</div>
						<ul>
							{ expirationLines.slice( 1 ).map( ( line: ReactNode, index: number ) => (
								<li key={ index }>{ line }</li>
							) ) }
						</ul>
					</div>
				</Popover>
			) }
		</>
	);
}

/**
 * The Posts / Campaigns / Payments tab strip under the stats, with the credit balance on the right. Render inside `Tabs.Root`.
 *
 * @param props             - Props.
 * @param props.tabs        - Tabs to show.
 * @param props.selectedTab - Selected tab.
 * @return The tab strip.
 */
export default function PromotePostTabBar( { tabs, selectedTab }: Props ) {
	const { data: { balance: creditBalance = '0.00' } = {} } = useCreditBalanceQuery();
	const hasCredits = parseFloat( creditBalance ) > 0;

	return (
		<div className="promote-post-i2__tabs">
			<div className="promote-post-i2__tabs-inner">
				<Tabs.List variant="minimal">
					{ tabs
						.filter( ( { enabled = true } ) => enabled )
						.map( ( { id, name, itemCount, isCountAmount, label = '' } ) => (
							<Tabs.Tab key={ id } value={ id } aria-current={ selectedTab === id }>
								{ name }
								{ itemCount ? (
									<Badge intent="none" className="promote-post-i2__tab-count">
										{ `${ isCountAmount ? '$' : '' }${ formatNumber( itemCount, {
											decimals: isCountAmount ? 2 : 0,
										} ) }` }
									</Badge>
								) : null }
								{ label && <VisuallyHidden>{ label }</VisuallyHidden> }
							</Tabs.Tab>
						) ) }
				</Tabs.List>
				{ hasCredits && (
					<div className="blaze-credits-container">
						<CreditBalanceContent
							formattedBalance={ formatCurrency( parseFloat( creditBalance ), 'USD' ) }
						/>
					</div>
				) }
			</div>
		</div>
	);
}
