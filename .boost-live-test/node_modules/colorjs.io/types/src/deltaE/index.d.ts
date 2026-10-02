declare namespace _default {
    export { deltaE76 };
    export { deltaECMC };
    export { deltaE2000 };
    export { deltaEJz };
    export { deltaEITP };
    export { deltaEOK };
    export { deltaEOK2 };
    export { deltaEHCT };
    export { deltaEHelmlab };
}
export default _default;
export type Methods = keyof typeof import("./index.js").default extends `deltaE${infer Method}` ? Method : string;
import deltaE76 from "./deltaE76.js";
import deltaECMC from "./deltaECMC.js";
import deltaE2000 from "./deltaE2000.js";
import deltaEJz from "./deltaEJz.js";
import deltaEITP from "./deltaEITP.js";
import deltaEOK from "./deltaEOK.js";
import deltaEOK2 from "./deltaEOK2.js";
import deltaEHCT from "./deltaEHCT.js";
import deltaEHelmlab from "./deltaEHelmlab.js";
export { deltaE76, deltaECMC, deltaE2000, deltaEJz, deltaEITP, deltaEOK, deltaEOK2, deltaEHCT, deltaEHelmlab };
//# sourceMappingURL=index.d.ts.map