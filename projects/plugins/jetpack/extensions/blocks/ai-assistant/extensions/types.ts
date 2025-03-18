export type OnSuggestion = ( suggestion: string ) => void;

type CustomBlockBehavior = ( { context } ) => void;
export type BlockBehavior = 'dropdown' | 'action' | CustomBlockBehavior;

export const TYPE_ALT_TEXT = 'images-alt-text' as const;
export const TYPE_CAPTION = 'images-caption' as const;
