import { action } from '@storybook/addon-actions';
import ReviewRequest from '../index';

export default {
	title: 'Backup/Components/Review Request',
	component: ReviewRequest,
};

const Template = args => <ReviewRequest { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	description:
		'What triggered the review request (i.e. Jetpack Backup completed a successful restore)',
	cta: 'Text action line, asking for a review',
	onClick: action( 'onClick' ),
};
