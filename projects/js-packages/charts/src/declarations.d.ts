// scss.d.ts
declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}

// Popover API React type augmentations and ToggleEvent
// NOTE: These type augmentations are only needed for React 18 and below.
// React 19+ includes Popover API types in the official React type definitions.
declare module 'react' {
	interface HTMLAttributes< T > extends AriaAttributes, DOMAttributes< T > {
		popover?: 'auto' | 'manual' | '';
	}

	interface ButtonHTMLAttributes< T > extends HTMLAttributes< T > {
		popovertarget?: string;
		popovertargetaction?: 'hide' | 'show' | 'toggle';
	}
}

declare global {
	interface ToggleEvent extends Event {
		newState: 'open' | 'closed';
		oldState: 'open' | 'closed';
	}
}

export {};
