/**
 * Theme icon for use in SidebarOptions tab.
 *
 * @param {object} props - component properties.
 * @param {string} props.theme - 'dark' or 'light'.
 * @returns {Element} component instance
 */
export default function ThemeIcon( { theme } ) {
	const fill = theme === 'dark' ? '#000' : '#fff';
	const stroke = theme === 'dark' ? '#4F5861' : '#DDE5EE';
	return (
		<svg width="104" height="80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
			<rect x="7.5" y="7.5" width="89" height="65" rx="3.5" fill={ fill } stroke={ stroke } />
			<path
				d="M16 20a4 4 0 014-4h49a4 4 0 010 8H20a4 4 0 01-4-4zM42 55.5a1.5 1.5 0 011.5-1.5h32a1.5 1.5 0 010 3h-32a1.5 1.5 0 01-1.5-1.5zM42 60.5a1.5 1.5 0 011.5-1.5h11a1.5 1.5 0 010 3h-11a1.5 1.5 0 01-1.5-1.5zM16 47a4 4 0 014-4h12a4 4 0 014 4v12a4 4 0 01-4 4H20a4 4 0 01-4-4V47zM42 48a3 3 0 013-3h40a3 3 0 110 6H45a3 3 0 01-3-3zM8 32h89v1H8z"
				fill={ stroke }
			/>
		</svg>
	);
}
