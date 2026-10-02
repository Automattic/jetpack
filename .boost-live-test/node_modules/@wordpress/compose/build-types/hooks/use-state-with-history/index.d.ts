/**
 * useState with undo/redo history.
 *
 * @param initialValue Initial value.
 * @return Value, setValue, hasUndo, hasRedo, undo, redo.
 */
export default function useStateWithHistory<T>(initialValue: T): {
    value: unknown;
    setValue: (newValue: T, isStaged: boolean) => void;
    hasUndo: boolean;
    hasRedo: boolean;
    undo: () => void;
    redo: () => void;
};
//# sourceMappingURL=index.d.ts.map