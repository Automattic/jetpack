import { Card, CardBody, CardHeader, Spinner } from '@wordpress/components';
import type { ReactNode } from 'react';

type SectionCardProps = {
	title: string;
	metricLabel?: string;
	isLoading?: boolean;
	isEmpty?: boolean;
	emptyMessage?: string;
	children: ReactNode;
	className?: string;
};

type SectionCardBodyProps = Pick<
	SectionCardProps,
	'isLoading' | 'isEmpty' | 'emptyMessage' | 'children'
>;

const renderBody = ( { isLoading, isEmpty, emptyMessage, children }: SectionCardBodyProps ) => {
	if ( isLoading ) {
		return (
			<div className="podcast-stats__section-loading">
				<Spinner />
			</div>
		);
	}
	if ( isEmpty ) {
		return <p className="podcast-stats__section-empty">{ emptyMessage }</p>;
	}
	return children;
};

const SectionCard = ( {
	title,
	metricLabel,
	isLoading = false,
	isEmpty = false,
	emptyMessage,
	children,
	className,
}: SectionCardProps ) => {
	const cardClass = [ 'podcast-stats__section-card', className ].filter( Boolean ).join( ' ' );
	return (
		<Card className={ cardClass }>
			<CardHeader>
				<div className="podcast-stats__section-card-header">
					<h3 className="podcast-stats__section-title">{ title }</h3>
					{ metricLabel && <span className="podcast-stats__section-metric">{ metricLabel }</span> }
				</div>
			</CardHeader>
			<CardBody>{ renderBody( { isLoading, isEmpty, emptyMessage, children } ) }</CardBody>
		</Card>
	);
};

export default SectionCard;
