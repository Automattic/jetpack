import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Tooltip } from '@wordpress/ui';
import moment from 'moment';
import { Fragment } from 'react';
import config from '../../../compat/config';
import page from '../../../compat/router';
import { useSelector, getSelectedSiteSlug } from '../../../compat/state';
import { safeImageUrl, resizeImageUrl } from '../../../compat/utils';
import { Campaign } from '../../../data/promote-post/types';
import {
	campaignStatus,
	formatCents,
	formatNumber,
	getAdvertisingDashboardPath,
	getCampaignDurationDays,
	getCampaignStartDateFormatted,
	getCampaignStatus,
	getCampaignStatusBadgeIntent,
} from '../../utils';
import './style.scss';

interface Props {
	campaign: Campaign;
}

const getCampaignEndText = ( end_date: string, status: string, is_evergreen = 0 ) => {
	if ( is_evergreen && [ campaignStatus.APPROVED, campaignStatus.ACTIVE ].includes( status ) ) {
		return __( 'Until stopped', 'jetpack-blaze' );
	} else if ( ! end_date ) {
		return '-';
	}

	// return moment in format similar to 27 June
	return moment( end_date ).format( 'D MMMM' );
};

/**
 *
 * @param props
 */
export default function CampaignItem( props: Props ) {
	const { campaign } = props;
	const {
		name,
		content_config,
		ui_status,
		end_date,
		start_date,
		campaign_stats,
		type,
		is_evergreen,
	} = campaign;

	const clicks_total = campaign_stats?.clicks_total ?? 0;
	const conversion_rate_percentage = campaign_stats?.conversion_rate
		? campaign_stats.conversion_rate * 100
		: 0;
	const conversion_rate = campaign_stats?.conversion_rate
		? `${ conversion_rate_percentage.toFixed( 2 ) }%`
		: '-';

	const selectedSiteSlug = useSelector( getSelectedSiteSlug );

	const safeUrl = safeImageUrl( content_config.imageUrl );
	const adCreativeUrl = safeUrl && resizeImageUrl( safeUrl, 108, 0 );

	const campaignDays = is_evergreen ? 7 : getCampaignDurationDays( start_date, end_date );

	const budgetUsed = is_evergreen
		? campaign_stats?.weekly_budget_used
		: campaign_stats?.total_budget_used;

	const formattedTotalSpend = `$${ formatCents( budgetUsed || 0, 2 ) }`;

	let spendString = '-';
	let spendStringMobile = '';
	if ( campaignDays && ui_status !== campaignStatus.REJECTED ) {
		spendString = is_evergreen
			? sprintf(
					/* translators: %s is a formatted amount */
					__( '%s weekly', 'jetpack-blaze' ),
					formattedTotalSpend
				)
			: formattedTotalSpend;
		spendStringMobile = sprintf(
			/* translators: %s is a formatted amount */
			__( '%s spend', 'jetpack-blaze' ),
			formattedTotalSpend
		);
	}

	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );

	const getPostType = ( type: string ) => {
		switch ( type ) {
			case 'post':
				return __( 'Post', 'jetpack-blaze' );
			case 'page':
				return __( 'Page', 'jetpack-blaze' );
			case 'product':
				return __( 'Product', 'jetpack-blaze' );
			default:
				return __( 'Post', 'jetpack-blaze' );
		}
	};

	const statusBadge = (
		<Badge intent={ getCampaignStatusBadgeIntent( ui_status ) }>
			{ getCampaignStatus( ui_status ) }
		</Badge>
	);
	const openCampaignURL = getAdvertisingDashboardPath(
		`/campaigns/${ campaign.campaign_id }/${ selectedSiteSlug }`
	);

	const navigateToDetailsPage = ( event: React.MouseEvent< HTMLElement > ) => {
		event.stopPropagation();
		page.show( openCampaignURL );
	};

	/**
	 *
	 */
	function getMobileStats() {
		const statElements = [];

		if ( spendStringMobile ) {
			statElements[ statElements.length ] = spendStringMobile;
		}

		if ( clicks_total > 0 ) {
			statElements[ statElements.length ] = sprintf(
				// translators: %s is formatted number of clicks
				_n( '%s click', '%s clicks', clicks_total, 'jetpack-blaze' ),
				formatNumber( clicks_total )
			);
		}

		return statElements.map( ( value, index ) => {
			if ( index < statElements.length - 1 ) {
				return (
					<Fragment key={ index }>
						<span>{ value }</span>
						<span className="blazepress-mobile-stats-mid-dot">&#183;</span>
					</Fragment>
				);
			}

			return <span key={ index }>{ value }</span>;
		} );
	}

	return (
		<tr onClick={ navigateToDetailsPage }>
			<td className="campaign-item__data">
				<div className="campaign-item__data-row">
					<div className="promote-post-i2__campaign-item-wrapper">
						{ adCreativeUrl && (
							<div className="campaign-item__header-image">
								<img
									src={ adCreativeUrl }
									alt={ sprintf(
										/* translators: %(name)s is the campaign name. */ __(
											'For campaign %(name)s',
											'jetpack-blaze'
										),
										{ name }
									).toString() }
								/>
							</div>
						) }
						<div className="campaign-item__title-row">
							<div className="campaign-item__post-type">{ getPostType( type ) }</div>
							<div className="campaign-item__title">{ name }</div>
							<div className="campaign-item__status-mobile">{ statusBadge }</div>
						</div>
					</div>
				</div>
				<div className="campaign-item__data-row campaign-item__data-row-mobile">
					<div className="campaign-item__stats-mobile">{ getMobileStats() }</div>
					<div className="campaign-item__actions-mobile">
						<Button
							onClick={ navigateToDetailsPage }
							variant="outline"
							size="compact"
							className="campaign-item__view-link"
						>
							<span aria-hidden="true">{ __( 'Details', 'jetpack-blaze' ) }</span>
							<span className="sr-only">
								{ sprintf(
									/* translators: %(name)s is the campaign name. */ __(
										'View details for %(name)s',
										'jetpack-blaze'
									),
									{ name }
								) }
							</span>
						</Button>
					</div>
				</div>
			</td>
			<td className="campaign-item__status">
				{ ui_status === campaignStatus.SCHEDULED ? (
					<Tooltip.Root>
						<Tooltip.Trigger render={ <div /> }>{ statusBadge }</Tooltip.Trigger>
						<Tooltip.Popup>{ getCampaignStartDateFormatted( start_date ) }</Tooltip.Popup>
					</Tooltip.Root>
				) : (
					<div>{ statusBadge }</div>
				) }
			</td>
			<td className="campaign-item__ends">
				<div>
					{ getCampaignEndText( campaign.end_date, campaign.status, campaign?.is_evergreen ) }
				</div>
			</td>
			<td className="campaign-item__spend">
				<div>{ spendString }</div>
			</td>
			<td className="campaign-item__clicks">
				<div>{ formatNumber( clicks_total ) }</div>
			</td>
			{ isWooStore && (
				<td className="campaign-item__conversion">
					<div>{ conversion_rate } </div>
				</td>
			) }

			<td className="campaign-item__action">
				<Button
					variant="outline"
					size="compact"
					onClick={ navigateToDetailsPage }
					className="campaign-item__post-details-button"
				>
					<span aria-hidden="true">{ __( 'Details', 'jetpack-blaze' ) }</span>
					<span className="sr-only">
						{ sprintf(
							/* translators: %(name)s is the campaign name. */ __(
								'View details for %(name)s',
								'jetpack-blaze'
							),
							{ name }
						) }
					</span>
				</Button>
			</td>
		</tr>
	);
}
