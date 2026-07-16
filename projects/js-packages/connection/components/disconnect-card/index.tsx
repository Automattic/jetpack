import { Card } from '@wordpress/ui';
import './style.scss';

interface DisconnectCardProps {
	/** The title to show on the disconnect card. */
	title?: string;
	/** Optional value/ statistic to show. */
	value?: string | number;
	/** Description to go with the stat value. */
	description?: string;
}

/**
 * Show a card with a title, value and description.
 * Used in the disconnection flow.
 *
 * @param {DisconnectCardProps} props - The Properties.
 * @return {import('react').ReactNode} DisconnectCard - The disconnect card component.
 */
const DisconnectCard = ( { title, value, description }: DisconnectCardProps ) => {
	return (
		<Card.Root className="jp-connection__disconnect-card">
			<Card.Content className="jp-connection__disconnect-card__card-content">
				<p className="jp-connection__disconnect-card__card-headline">{ title }</p>
				{ ( value || description ) && (
					<div className="jp-connection__disconnect-card__card-stat-block">
						<span className="jp-connection__disconnect-card__card-stat">{ value }</span>
						<div className="jp-connection__disconnect-card__card-description">{ description }</div>
					</div>
				) }
			</Card.Content>
		</Card.Root>
	);
};

export default DisconnectCard;
