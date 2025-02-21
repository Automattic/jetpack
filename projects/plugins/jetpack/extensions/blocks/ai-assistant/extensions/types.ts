export type OnSuggestion = ( suggestion: string ) => void;

type CustomBlockBehavior = ( { context } ) => void;
export type BlockBehavior = 'dropdown' | 'action' | CustomBlockBehavior;
