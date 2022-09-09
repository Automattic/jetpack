import { action } from '@storybook/addon-actions';
import ContextualUpgradeTrigger from '../index';

export default {
	title: 'JS Packages/Components/Contextual Upgrade Trigger',
	component: ContextualUpgradeTrigger,
};

const Template = args => <ContextualUpgradeTrigger { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	description: 'Current status of the product (i.e. how many updates per day)',
	cta: 'Text action line, recommending the next tier',
	onClick: action( 'onClick' ),
};
