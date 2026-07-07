import type { ConsentCategory } from './types';

export function getCategoryPreferenceKey(
	category: Pick< ConsentCategory, 'key' | 'preferenceKey' >
): string {
	if ( category.preferenceKey ) {
		return category.preferenceKey;
	}

	if ( category.key === 'functional' ) {
		return 'required';
	}

	if ( category.key === 'marketing' ) {
		return 'advertising';
	}

	return category.key;
}
