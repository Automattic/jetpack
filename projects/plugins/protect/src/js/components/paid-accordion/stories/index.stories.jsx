import { Text } from '@automattic/jetpack-components';
import { wordpress, plugins } from '@wordpress/icons';
import React from 'react';
import PaidAccordion, { PaidAccordionItem } from '..';

export default {
	title: 'Plugins/Protect/Paid Accordion',
	component: PaidAccordion,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 800 } }>
				<Story />
			</div>
		),
	],
};

// eslint-disable-next-line no-unused-vars
export const Default = args => (
	<PaidAccordion>
		<PaidAccordionItem
			id="wordpress"
			label="WordPress (5.9-5.9.1)"
			title="Contributor+ Stored Cross-Site Scripting"
			icon={ wordpress }
		>
			<Text variant="title-small" mb={ 2 }>
				What is the problem?
			</Text>
			<Text mb={ 5 }>
				Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
				Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow them to
				perform to Stored Cross-Site Scripting attacks
			</Text>
			<Text variant="title-small" mb={ 2 }>
				How to fix it?
			</Text>
			<Text>Update to WordPress 5.9.2</Text>
		</PaidAccordionItem>
		<PaidAccordionItem
			id="jetpack"
			label="Jetpack < 9.8"
			title="Carousel Module Non-Published Page/Post Attachment Comment Leak"
			icon={ plugins }
		>
			<Text variant="title-small" mb={ 2 }>
				What is the problem?
			</Text>
			<Text mb={ 5 }>
				Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
				Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow them to
				perform to Stored Cross-Site Scripting attacks
			</Text>
			<Text variant="title-small" mb={ 2 }>
				How to fix it?
			</Text>
			<Text>Update to WordPress 5.9.2</Text>
		</PaidAccordionItem>
		<PaidAccordionItem
			id="jetpack-2"
			label="Jetpack < 9.8"
			title="Carousel Module Non-Published Page/Post Attachment Comment Leak"
			icon={ plugins }
		>
			<Text variant="title-small" mb={ 2 }>
				What is the problem?
			</Text>
			<Text mb={ 5 }>
				Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
				Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow them to
				perform to Stored Cross-Site Scripting attacks
			</Text>
			<Text variant="title-small" mb={ 2 }>
				How to fix it?
			</Text>
			<Text>Update to WordPress 5.9.2</Text>
		</PaidAccordionItem>
		<PaidAccordionItem
			id="jetpack-3"
			label="Jetpack < 9.8"
			title="Carousel Module Non-Published Page/Post Attachment Comment Leak"
			icon={ plugins }
		>
			<Text variant="title-small" mb={ 2 }>
				What is the problem?
			</Text>
			<Text mb={ 5 }>
				Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
				Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow them to
				perform to Stored Cross-Site Scripting attacks
			</Text>
			<Text variant="title-small" mb={ 2 }>
				How to fix it?
			</Text>
			<Text>Update to WordPress 5.9.2</Text>
		</PaidAccordionItem>
		<PaidAccordionItem
			id="jetpack-4"
			label="Jetpack < 9.8"
			title="Carousel Module Non-Published Page/Post Attachment Comment Leak"
			icon={ plugins }
		>
			<Text variant="title-small" mb={ 2 }>
				What is the problem?
			</Text>
			<Text mb={ 5 }>
				Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
				Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow them to
				perform to Stored Cross-Site Scripting attacks
			</Text>
			<Text variant="title-small" mb={ 2 }>
				How to fix it?
			</Text>
			<Text>Update to WordPress 5.9.2</Text>
		</PaidAccordionItem>
	</PaidAccordion>
);
