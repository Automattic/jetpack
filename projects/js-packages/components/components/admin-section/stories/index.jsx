/**
 * External dependencies
 */
import React from 'react';
import JetpackAdminSection from '../index.jsx';
import JetpackAdminPage from '../../admin-page';

export default {
	title: 'Playground/Admin Section',
	component: JetpackAdminSection,
};

// Export additional stories using pre-defined values
const Template = args => (
	<JetpackAdminPage>
		<JetpackAdminSection { ...args }>
			Sample Section 1 - Controls will apply to this section
		</JetpackAdminSection>
		<JetpackAdminSection>Sample Section 2</JetpackAdminSection>
	</JetpackAdminPage>
);

const DefaultArgs = {
	bgColor: 'grey',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
