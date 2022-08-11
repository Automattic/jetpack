import { render } from 'preact';
import './action-bar.scss';
import { CommentIcon, EllipsisIcon, FollowIcon, StarIcon } from './icons';

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
