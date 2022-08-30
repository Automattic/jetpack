import { CommentIcon, EllipsisIcon, FollowIcon, StarIcon } from './icons';
import './action-bar.scss';

const ActionBar = () => {
	return `
		<ul class="jetpack-action-bar__action-list">
			<li>
				<button class="jetpack-action-bar__action-button">
					${ EllipsisIcon() }
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					${ CommentIcon() }
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					${ StarIcon() }
				</button>
			</li>
			<li>
				<button class="jetpack-action-bar__action-button">
					${ FollowIcon() }
				</button>
			</li>
		</ul>`;
};
document.getElementById( 'jetpack-action-bar' ).innerHTML = ActionBar();
