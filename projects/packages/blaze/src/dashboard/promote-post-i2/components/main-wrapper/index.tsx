import { ReactNode } from 'react';
import { useSelector, getCurrentQueryArguments } from '../../../compat/state';
import BlazePressWidget from '../../../components/blazepress-widget';
import usePromoteParams from '../../../data/promote-post/use-promote-params';

interface Props {
	children: ReactNode;
}

/**
 *
 * @param root0
 * @param root0.children
 */
export default function MainWrapper( { children }: Props ) {
	const { isModalOpen, selectedSiteId, selectedPostId, selectedCampaignId, keyValue } =
		usePromoteParams();

	const currentQuery = useSelector( getCurrentQueryArguments );
	const sourceQuery = currentQuery?.source;
	const source = sourceQuery ? sourceQuery.toString() : undefined;

	return (
		<div className="promote-post-i2">
			{ children }

			{ selectedSiteId && keyValue && ( selectedPostId || selectedCampaignId ) && (
				<BlazePressWidget
					isVisible={ isModalOpen }
					siteId={ selectedSiteId }
					postId={ selectedPostId }
					campaignId={ selectedCampaignId }
					keyValue={ keyValue }
					source={ source }
				/>
			) }
		</div>
	);
}
