import { action } from 'storybook/actions';
import ReviewRequest from '../index';

export default {
	title: 'Backup/Components/Review Request',
	component: ReviewRequest,
};

const Template = args => <ReviewRequest { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	cta: 'Text action line, asking for a review',
	href: 'example-link.com',
	requestReason: 'What triggered the review request (i.e. restore)',
	dismissedReview: false,
	onClick: action( 'dismissMessage' ),
};
