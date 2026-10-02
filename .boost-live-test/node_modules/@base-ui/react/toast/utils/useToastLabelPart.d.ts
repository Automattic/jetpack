import * as React from 'react';
/**
 * Shared logic for `Toast.Title` and `Toast.Description`, which only differ by the rendered tag,
 * the fallback content, and which id setter they register with. Resolves the content and returns
 * the pieces each part passes to `useRenderElement` and `useToastLabelElement`.
 */
export declare function useToastLabelPart(idProp: string | undefined, childrenProp: React.ReactNode, part: 'title' | 'description'): {
  id: string | undefined;
  children: React.ReactNode;
  type: string | undefined;
  setId: React.Dispatch<React.SetStateAction<string | undefined>>;
};
/**
 * Mounts the evaluated label element only when it carries renderable content (so a `render` prop's
 * own children count, while a childless styling-only `render` stays conditional), registering the
 * generated id with the root while the part renders.
 */
export declare function useToastLabelElement(element: React.ReactElement | null, id: string | undefined, setId: React.Dispatch<React.SetStateAction<string | undefined>>): React.ReactElement | null;