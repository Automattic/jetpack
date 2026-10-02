// packages/url/src/clean-for-slug.ts
import removeAccents from "remove-accents";
function cleanForSlug(string) {
  if (!string) {
    return "";
  }
  return removeAccents(string).replace(/(&nbsp;|&ndash;|&mdash;)/g, "-").replace(/[\s\./]+/g, "-").replace(/&\S+?;/g, "").replace(/[^\p{L}\p{N}_-]+/gu, "").toLowerCase().replace(/-+/g, "-").replace(/(^-+)|(-+$)/g, "");
}
export {
  cleanForSlug
};
//# sourceMappingURL=clean-for-slug.mjs.map
