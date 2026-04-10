import { __ } from '@wordpress/i18n';
import './styles.scss';

const LinkedInPostActions: React.FC = () => (
	<ul className="linkedin-preview__post-actions">
		{ [
			{
				icon: 'like',
				// translators: LinkedIn "Like" action
				label: __( 'Like', 'social-previews' ),
				svg: (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path d="m12.91 7-2.25-2.57a8.2 8.2 0 0 1-1.5-2.55L9 1.37A2.08 2.08 0 0 0 7 0a2.08 2.08 0 0 0-2.06 2.08v1.17a5.8 5.8 0 0 0 .31 1.89l.28.86H2.38A1.47 1.47 0 0 0 1 7.47a1.45 1.45 0 0 0 .64 1.21 1.48 1.48 0 0 0-.37 2.06 1.54 1.54 0 0 0 .62.51h.05a1.6 1.6 0 0 0-.19.71A1.47 1.47 0 0 0 3 13.42v.1A1.46 1.46 0 0 0 4.4 15h4.83a5.6 5.6 0 0 0 2.48-.58l1-.42H14V7zM12 12.11l-1.19.52a3.6 3.6 0 0 1-1.58.37H5.1a.55.55 0 0 1-.53-.4l-.14-.48-.49-.21a.56.56 0 0 1-.34-.6l.09-.56-.42-.42a.56.56 0 0 1-.09-.68L3.55 9l-.4-.61A.28.28 0 0 1 3.3 8h5L7.14 4.51a4.2 4.2 0 0 1-.2-1.26V2.08A.09.09 0 0 1 7 2a.1.1 0 0 1 .08 0l.18.51a10 10 0 0 0 1.9 3.24l2.84 3z" />
					</svg>
				),
			},
			{
				icon: 'comment',
				// translators: LinkedIn "Comment" action
				label: __( 'Comment', 'social-previews' ),
				svg: (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path d="M5 8h5v1H5zm11-.5v.08a6 6 0 0 1-2.75 5L8 16v-3H5.5A5.51 5.51 0 0 1 0 7.5 5.62 5.62 0 0 1 5.74 2h4.76A5.5 5.5 0 0 1 16 7.5m-2 0A3.5 3.5 0 0 0 10.5 4H5.74A3.62 3.62 0 0 0 2 7.5 3.53 3.53 0 0 0 5.5 11H10v1.33l2.17-1.39A4 4 0 0 0 14 7.58zM5 7h6V6H5z" />
					</svg>
				),
			},
			{
				icon: 'repost',
				// translators: LinkedIn "Repost" action
				label: __( 'Repost', 'social-previews' ),
				svg: (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path d="M4 10H2V5c0-1.66 1.34-3 3-3h3.85L7.42 0h2.44L12 3 9.86 6H7.42l1.43-2H5c-.55 0-1 .45-1 1zm8-4v5c0 .55-.45 1-1 1H7.15l1.43-2H6.14L4 13l2.14 3h2.44l-1.43-2H11c1.66 0 3-1.34 3-3V6z" />
					</svg>
				),
			},
			{
				icon: 'send',
				// translators: LinkedIn "Send" action
				label: __( 'Send', 'social-previews' ),
				svg: (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path d="M14 2 0 6.67l5 2.64 5.67-3.98L6.7 11l2.63 5z" />
					</svg>
				),
			},
		].map( ( { icon, label, svg } ) => (
			<li key={ icon }>
				{ svg }
				<span>{ label }</span>
			</li>
		) ) }
	</ul>
);

export default LinkedInPostActions;
