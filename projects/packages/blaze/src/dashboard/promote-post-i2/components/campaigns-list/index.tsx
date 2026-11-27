import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import config from '../../../compat/config';
import { CALYPSO_CONTACT } from '../../../compat/utils';
import { Campaign } from '../../../data/promote-post/types';
import { useInfiniteScroll } from '../../../data/promote-post/use-infinite-scroll';
import { DSPMessage } from '../../main';
import CampaignsTable from '../campaigns-table';
import EmptyPromotionList from '../empty-promotion-list';
import SearchBar, { SearchOptions } from '../search-bar';

const fetchErrorListMessage = () =>
	createInterpolateElement(
		/* translators: Validation error when filling out domain checkout contact details form */ __(
			'There was a problem obtaining the campaign list. Please try again or <contactSupportLink>contact support</contactSupportLink>.',
			'jetpack-blaze'
		),
		{
			contactSupportLink: <Link href={ CALYPSO_CONTACT } />,
		}
	);
const ERROR_NO_LOCAL_USER = 'no_local_user';

type Props = {
	isLoading: boolean;
	isError: DSPMessage | null;
	isFetching: boolean;
	fetchNextPage: () => void;
	handleSearchOptions: ( search: SearchOptions ) => void;
	totalCampaigns: number;
	hasMorePages: boolean;
	campaigns?: Campaign[];
};

/**
 *
 * @param props
 */
export default function CampaignsList( props: Props ) {
	const {
		isLoading,
		isError,
		isFetching,
		fetchNextPage,
		handleSearchOptions,
		totalCampaigns,
		hasMorePages,
		campaigns,
	} = props;

	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );

	const hasLocalUser = ( isError as DSPMessage )?.errorCode !== ERROR_NO_LOCAL_USER;

	const { containerRef } = useInfiniteScroll( {
		offset: '200px',
		shouldStop: ! hasMorePages || isLoading || isFetching,
		async onLoadMore() {
			await fetchNextPage();
		},
	} );

	if ( isError && hasLocalUser ) {
		return (
			<Notice.Root intent="error" className="promote-post-notice promote-post-i2__aux-wrapper">
				<Notice.Description>{ fetchErrorListMessage() }</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
			<SearchBar
				mode="campaigns"
				handleSetSearch={ search => {
					handleSearchOptions( search );
				} }
			/>

			{ ! isLoading && campaigns?.length === 0 ? (
				<div className="promote-post-i2__aux-wrapper">
					{ totalCampaigns === 0 ? (
						<EmptyPromotionList type="campaigns" />
					) : (
						<>{ __( 'No campaigns match your search', 'jetpack-blaze' ) }</>
					) }
				</div>
			) : (
				<>
					<div ref={ containerRef }>
						{ campaigns && (
							<CampaignsTable
								campaigns={ campaigns }
								isLoading={ isLoading }
								isFetchingPageResults={ isFetching }
								isWooStore={ isWooStore }
							/>
						) }
					</div>
				</>
			) }
		</>
	);
}
