/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

import {
	FacebookPreviews,
	GoogleSearchPreview,
	LinkedInPreviews,
	ThreadsPreviews,
	TwitterPreviews,
} from '@automattic/social-previews';
import { Modal, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { FC } from 'react';

export interface SerpPreviewPayload {
	title: string;
	description: string;
	url: string;
	siteTitle?: string;
	siteIcon?: string;
	image?: string;
}

interface Props {
	payload: SerpPreviewPayload;
	onClose: () => void;
}

const tabs = [
	{ name: 'google', title: 'Google' },
	{ name: 'facebook', title: 'Facebook' },
	{ name: 'x', title: 'X' },
	{ name: 'linkedin', title: 'LinkedIn' },
	{ name: 'threads', title: 'Threads' },
];

/**
 * Multi-surface SERP preview shared between the home base, the Content
 * DataViews popover, the editor sidebar, and the post list admin columns.
 *
 * Surfaces mirror the CIAB i1 design: Google (primary) + four social cards.
 */
const SerpPreviewModal: FC< Props > = ( { payload, onClose } ) => (
	<Modal
		title={ __( 'Search and social previews', 'jetpack-seo' ) }
		onRequestClose={ onClose }
		size="large"
	>
		<TabPanel tabs={ tabs } initialTabName="google" orientation="horizontal">
			{ tab => {
				switch ( tab.name ) {
					case 'google':
						return (
							<GoogleSearchPreview
								title={ payload.title }
								description={ payload.description }
								url={ payload.url }
								siteTitle={ payload.siteTitle }
								siteIcon={ payload.siteIcon }
							/>
						);
					case 'facebook':
						return (
							<FacebookPreviews
								title={ payload.title }
								description={ payload.description }
								url={ payload.url }
								image={ payload.image }
							/>
						);
					case 'x':
						return (
							<TwitterPreviews
								title={ payload.title }
								description={ payload.description }
								url={ payload.url }
								image={ payload.image }
							/>
						);
					case 'linkedin':
						return (
							<LinkedInPreviews
								title={ payload.title }
								description={ payload.description }
								url={ payload.url }
								image={ payload.image }
							/>
						);
					case 'threads':
						return (
							<ThreadsPreviews
								title={ payload.title }
								description={ payload.description }
								url={ payload.url }
								image={ payload.image }
							/>
						);
					default:
						return null;
				}
			} }
		</TabPanel>
	</Modal>
);

export default SerpPreviewModal;
