import './style.scss';
import { Icon, chevronRight } from '@wordpress/icons';

const Details = ( { children, summary } ) => {
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
