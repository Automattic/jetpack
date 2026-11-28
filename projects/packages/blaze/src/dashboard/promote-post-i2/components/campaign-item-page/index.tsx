import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import DocumentHead from '../../../compat/components/document-head';
import { useSelector, getSelectedSiteId } from '../../../compat/state';
import { CALYPSO_CONTACT } from '../../../compat/utils';
import { useCampaignsQuery } from '../../../data/promote-post/use-promote-post-campaigns-query';
import CampaignItemDetails from '../campaign-item-details';
import MainWrapper from '../main-wrapper';

interface Props {
	campaignId: number;
}

const noCampaignListMessage = () =>
	createInterpolateElement(
		/* translators: Validation error when filling out domain checkout contact details form */ __(
			'There was a problem obtaining the campaign. Please try again or <contactSupportLink>contact support</contactSupportLink>.',
			'jetpack-blaze'
		),
		{
			contactSupportLink: <Link href={ CALYPSO_CONTACT } />,
		}
	);

/**
 *
 * @param props
 */
export default function CampaignItemPage( props: Props ) {
	const { campaignId } = props;
	const siteId = useSelector( getSelectedSiteId ) || 0;
	const campaignQuery = useCampaignsQuery( siteId || 0, campaignId );
	const { data: campaign } = campaignQuery;
	const { isLoading: campaignsIsLoading, isError } = campaignQuery;

	if ( isError ) {
		return (
			<MainWrapper>
				<Notice.Root intent="error" className="promote-post-notice">
					<Notice.Description>{ noCampaignListMessage() }</Notice.Description>
				</Notice.Root>
			</MainWrapper>
		);
	}

	const isLoading = ! campaign || campaignsIsLoading;

	return (
		<MainWrapper>
			<DocumentHead
				title={ sprintf(
					/* translators: %(productName)s is the product name, Blaze Ads. */ __(
						'%(productName)s - Campaign details',
						'jetpack-blaze'
					),
					{ productName: 'Blaze Ads' }
				) }
			/>
			{ ! isLoading && campaign && (
				<CampaignItemDetails isLoading={ isLoading } siteId={ +siteId } campaign={ campaign } />
			) }
		</MainWrapper>
	);
}
