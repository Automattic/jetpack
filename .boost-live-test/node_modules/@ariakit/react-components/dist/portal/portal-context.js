"use client";
import { createContext } from "react";
//#region src/portal/portal-context.tsx
/**
* Stores the element that will contain the portal. By default, it will be the
* body of the document.
* @example
* ```jsx
* const container = document.getElementById("container");
*
* function App() {
*   return (
*     <PortalContext.Provider value={container}>
*       <Portal />
*     </PortalContext.Provider>
*   );
* }
* ```
*/
const PortalContext = createContext(null);
//#endregion
export { PortalContext };

//# sourceMappingURL=portal-context.js.map