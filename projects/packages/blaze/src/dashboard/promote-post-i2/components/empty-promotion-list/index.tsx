import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { EmptyState } from '@wordpress/ui';
import SupportLink from '../../../components/support-link';
import './style.scss';

type Props = {
	type: 'campaigns' | 'posts' | 'payments';
};

/**
 *
 * @param props
 */
export default function EmptyPromotionList( props: Props ) {
	const { type } = props;

	let title;
	let subtitle;

	if ( type === 'campaigns' ) {
		title = __( 'You have no campaigns', 'jetpack-blaze' );
		subtitle = createInterpolateElement(
			__(
				'You have not created any campaigns. Click <learnMoreLink>Promote</learnMoreLink> to get started.',
				'jetpack-blaze'
			),
			{
				learnMoreLink: <SupportLink />,
			}
		);
	} else if ( type === 'posts' ) {
		title = __( 'You have content to promote', 'jetpack-blaze' );
		subtitle = __(
			'You have not published any posts, pages or products yet. Make sure your content is published and come back to promote it.',
			'jetpack-blaze'
		);
	} else if ( type === 'payments' ) {
		title = __( 'We couldn’t find any payments.', 'jetpack-blaze' );
		subtitle = __(
			'You haven’t made any payments yet. Once you do, they’ll show up here.',
			'jetpack-blaze'
		);
	}

	return (
		<EmptyState.Root className="empty-promotion-list__container">
			<EmptyState.Title>{ title }</EmptyState.Title>
			<EmptyState.Description>{ subtitle }</EmptyState.Description>
		</EmptyState.Root>
	);
}
