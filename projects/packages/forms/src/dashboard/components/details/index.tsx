import { Icon, chevronRight } from '@wordpress/icons';
import './style.scss';
import type { ReactNode } from 'react';

type DetailsProps = {
	children: ReactNode;
	summary: string;
};

const Details = ( { children, summary }: DetailsProps ) => {
	return (
		<details className="jp-forms__details">
			<summary className="jp-forms__details-summary">
				<Icon className="jp-forms__details-icon" icon={ chevronRight } size={ 32 } />
				<span>{ summary }</span>
			</summary>
			<div className="jp-forms__details-content">{ children } </div>
		</details>
	);
};

export default Details;
