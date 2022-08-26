import { Button } from '@wordpress/components';
import { render } from 'react-dom';
// This must be loaded otherwise the production build fails with a cryptic error message.
// eslint-disable-next-line no-unused-vars
// import * as Redux from 'react-redux';
import { CommentIcon, EllipsisIcon, FollowIcon, StarIcon } from './icons';
import './action-bar.scss';

const ActionBar = () => {
	return (
		<ul className="jetpack-action-bar__action-list">
			<li>
				<Button className="jetpack-action-bar__action-button">
					<EllipsisIcon />
				</Button>
			</li>
			<li>
				<Button className="jetpack-action-bar__action-button">
					<CommentIcon />
				</Button>
			</li>
			<li>
				<Button className="jetpack-action-bar__action-button">
					<StarIcon />
				</Button>
			</li>
			<li>
				<Button className="jetpack-action-bar__action-button">
					<FollowIcon />
				</Button>
			</li>
		</ul>
	);
};

render( <ActionBar />, document.getElementById( 'jetpack-action-bar' ) );
