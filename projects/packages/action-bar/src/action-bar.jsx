import { render } from 'preact';
// This must be loaded otherwise the production build fails with a cryptic error message.
// eslint-disable-next-line no-unused-vars
import * as Redux from 'react-redux';
import { CommentIcon, EllipsisIcon, FollowIcon, StarIcon } from './icons';
import './action-bar.scss';

const ActionBar = () => {
	return (
		<ul className="jetpack-action-bar__action-list">
			<li>
				<button class="jetpack-action-bar__action-button">
					<EllipsisIcon />
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					<CommentIcon />
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					<StarIcon />
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					<FollowIcon />
				</button>
			</li>
		</ul>
	);
};

render( <ActionBar />, document.getElementById( 'jetpack-action-bar' ) );
