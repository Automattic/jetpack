import { inIframe, isSimpleSite } from './utils';

const isEditorIFramed = inIframe();

/**
 * Create the link for the contextual tip.
 *
 * @param {object} props          - The function props.
 * @param {string} props.children - The tip content.
 * @param {string} props.section  - The tip context section.
 * @return {JSX.Element} The link element.
 */
export default function ( { children, section } ) {
	const { hostname } = window.location;
	let href = '#';

	switch ( section ) {
		case 'themes':
			href = isEditorIFramed ? `https://wordpress.com/themes/${ hostname }` : './themes.php';
			break;

		case 'plugins':
			href =
				isEditorIFramed || isSimpleSite
					? `https://wordpress.com/plugins/${ hostname }`
					: './plugin-install.php';
			break;
	}

	return (
		<a href={ href } target="_blank" rel="noreferrer noopener">
			{ children }
		</a>
	);
}
