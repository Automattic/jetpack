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
import type { IntegrationCard as IntegrationCardType } from '../../../../../types/index.ts';
import type { ReactNode } from 'react';

export type IntegrationCardProps = {
	integrationCard: IntegrationCardType;
	isExpanded: boolean;
	onToggle: () => void;
	children?: ReactNode;
	borderBottom?: boolean;
};

const IntegrationCard = ( {
	integrationCard,
	isExpanded,
	onToggle,
	children,
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
				integrationCard={ integrationCard }
				isExpanded={ isExpanded }
				onToggle={ onToggle }
			/>
			<IntegrationCardBody isExpanded={ isExpanded } integrationCard={ integrationCard }>
				{ children }
			</IntegrationCardBody>
		</Card>
	);
};

export default IntegrationCard;
