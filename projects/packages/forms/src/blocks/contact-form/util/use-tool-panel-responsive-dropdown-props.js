import { useViewportMatch } from '@wordpress/compose';

/**
 * Returns responsive props for the tool panel dropdown.
 *
 * On desktop, makes the dropdown opened via the three dots button open
 * to the left (in LTR) of the block inspector to ensure it doesn't
 * obscure the controls in the inspector.
 *
 * @return {object} Props for the tool panel dropdown.
 */
export default function useToolsPanelResponsiveDropdownProps() {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
}
