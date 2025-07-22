// Re-export Text utilities from visx
import {
	Text as VisxText,
	useText as useVisxText,
	getStringWidth as getVisxStringWidth,
} from '@visx/text';

// Re-export with preserved module structure
export const Text = VisxText;
export const useText = useVisxText;
export const getStringWidth = getVisxStringWidth;
