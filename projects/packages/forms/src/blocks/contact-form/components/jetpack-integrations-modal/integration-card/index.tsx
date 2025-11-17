/**
 * External dependencies
 */
import { Card } from '@wordpress/components';
/**
 * Internal dependencies
 */
import IntegrationCardBody from './integration-card-body.tsx';
import IntegrationCardHeader from './integration-card-header.tsx';
import './style.scss';
/**
 * Types
 */
import type { IntegrationCardData } from '../../../../../types/index.ts';
import type { ReactNode } from 'react';

export type IntegrationCardProps = {
	title: string;
	description: string;
	icon?: string | ReactNode;
	isExpanded: boolean;
	onToggle: () => void;
	children?: ReactNode;
	cardData?: IntegrationCardData;
	toggleTooltip?: string;
	borderBottom?: boolean;
};

const IntegrationCard = ( {
	title,
	description,
	icon = 'admin-plugins', // Default to admin-plugins icon if none provided
	isExpanded,
	onToggle,
	children,
	cardData = {},
	toggleTooltip,
	borderBottom = true,
}: IntegrationCardProps ) => {
	return (
		<Card
			className="integration-card"
			isBorderless={ true }
			borderBottom={ borderBottom }
			isRounded={ false }
		>
			<IntegrationCardHeader
				title={ title }
				description={ description }
				icon={ icon }
				isExpanded={ isExpanded }
				onToggle={ onToggle }
				cardData={ cardData }
				toggleTooltip={ toggleTooltip }
			/>
			<IntegrationCardBody isExpanded={ isExpanded } cardData={ cardData }>
				{ children }
			</IntegrationCardBody>
		</Card>
	);
};

export default IntegrationCard;
