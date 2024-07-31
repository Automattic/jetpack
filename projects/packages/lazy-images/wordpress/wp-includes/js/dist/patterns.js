/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  privateApis: () => (/* reexport */ privateApis),
  store: () => (/* reexport */ store)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/patterns/build-module/store/actions.js
var actions_namespaceObject = {};
__webpack_require__.r(actions_namespaceObject);
__webpack_require__.d(actions_namespaceObject, {
  convertSyncedPatternToStatic: () => (convertSyncedPatternToStatic),
  createPattern: () => (createPattern),
  createPatternFromFile: () => (createPatternFromFile),
  setEditingPattern: () => (setEditingPattern)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/patterns/build-module/store/selectors.js
var selectors_namespaceObject = {};
__webpack_require__.r(selectors_namespaceObject);
__webpack_require__.d(selectors_namespaceObject, {
  isEditingPattern: () => (selectors_isEditingPattern)
});

;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/store/reducer.js
/**
 * WordPress dependencies
 */

function isEditingPattern(state = {}, action) {
  if (action?.type === 'SET_EDITING_PATTERN') {
    return {
      ...state,
      [action.clientId]: action.isEditing
    };
  }
  return state;
}
/* harmony default export */ const reducer = ((0,external_wp_data_namespaceObject.combineReducers)({
  isEditingPattern
}));

;// CONCATENATED MODULE: external ["wp","blocks"]
const external_wp_blocks_namespaceObject = window["wp"]["blocks"];
;// CONCATENATED MODULE: external ["wp","coreData"]
const external_wp_coreData_namespaceObject = window["wp"]["coreData"];
;// CONCATENATED MODULE: external ["wp","blockEditor"]
const external_wp_blockEditor_namespaceObject = window["wp"]["blockEditor"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/constants.js
const PATTERN_TYPES = {
  theme: 'pattern',
  user: 'wp_block'
};
const PATTERN_DEFAULT_CATEGORY = 'all-patterns';
const PATTERN_USER_CATEGORY = 'my-patterns';
const EXCLUDED_PATTERN_SOURCES = ['core', 'pattern-directory/core', 'pattern-directory/featured'];
const PATTERN_SYNC_TYPES = {
  full: 'fully',
  unsynced: 'unsynced'
};

// TODO: This should not be hardcoded. Maybe there should be a config and/or an UI.
const PARTIAL_SYNCING_SUPPORTED_BLOCKS = {
  'core/paragraph': ['content'],
  'core/heading': ['content'],
  'core/button': ['text', 'url', 'linkTarget', 'rel'],
  'core/image': ['id', 'url', 'title', 'alt']
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/store/actions.js
/**
 * WordPress dependencies
 */





/**
 * Internal dependencies
 */


/**
 * Returns a generator converting one or more static blocks into a pattern, or creating a new empty pattern.
 *
 * @param {string}             title        Pattern title.
 * @param {'full'|'unsynced'}  syncType     They way block is synced, 'full' or 'unsynced'.
 * @param {string|undefined}   [content]    Optional serialized content of blocks to convert to pattern.
 * @param {number[]|undefined} [categories] Ids of any selected categories.
 */
const createPattern = (title, syncType, content, categories) => async ({
  registry
}) => {
  const meta = syncType === PATTERN_SYNC_TYPES.unsynced ? {
    wp_pattern_sync_status: syncType
  } : undefined;
  const reusableBlock = {
    title,
    content,
    status: 'publish',
    meta,
    wp_pattern_category: categories
  };
  const updatedRecord = await registry.dispatch(external_wp_coreData_namespaceObject.store).saveEntityRecord('postType', 'wp_block', reusableBlock);
  return updatedRecord;
};

/**
 * Create a pattern from a JSON file.
 * @param {File}               file         The JSON file instance of the pattern.
 * @param {number[]|undefined} [categories] Ids of any selected categories.
 */
const createPatternFromFile = (file, categories) => async ({
  dispatch
}) => {
  const fileContent = await file.text();
  /** @type {import('./types').PatternJSON} */
  let parsedContent;
  try {
    parsedContent = JSON.parse(fileContent);
  } catch (e) {
    throw new Error('Invalid JSON file');
  }
  if (parsedContent.__file !== 'wp_block' || !parsedContent.title || !parsedContent.content || typeof parsedContent.title !== 'string' || typeof parsedContent.content !== 'string' || parsedContent.syncStatus && typeof parsedContent.syncStatus !== 'string') {
    throw new Error('Invalid pattern JSON file');
  }
  const pattern = await dispatch.createPattern(parsedContent.title, parsedContent.syncStatus, parsedContent.content, categories);
  return pattern;
};

/**
 * Returns a generator converting a synced pattern block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
const convertSyncedPatternToStatic = clientId => ({
  registry
}) => {
  const patternBlock = registry.select(external_wp_blockEditor_namespaceObject.store).getBlock(clientId);
  function cloneBlocksAndRemoveBindings(blocks) {
    return blocks.map(block => {
      let metadata = block.attributes.metadata;
      if (metadata) {
        metadata = {
          ...metadata
        };
        delete metadata.id;
        delete metadata.bindings;
      }
      return (0,external_wp_blocks_namespaceObject.cloneBlock)(block, {
        metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined
      }, cloneBlocksAndRemoveBindings(block.innerBlocks));
    });
  }
  registry.dispatch(external_wp_blockEditor_namespaceObject.store).replaceBlocks(patternBlock.clientId, cloneBlocksAndRemoveBindings(patternBlock.innerBlocks));
};

/**
 * Returns an action descriptor for SET_EDITING_PATTERN action.
 *
 * @param {string}  clientId  The clientID of the pattern to target.
 * @param {boolean} isEditing Whether the block should be in editing state.
 * @return {Object} Action descriptor.
 */
function setEditingPattern(clientId, isEditing) {
  return {
    type: 'SET_EDITING_PATTERN',
    clientId,
    isEditing
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/store/constants.js
/**
 * Module Constants
 */
const STORE_NAME = 'core/patterns';

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/store/selectors.js
/**
 * Returns true if pattern is in the editing state.
 *
 * @param {Object} state    Global application state.
 * @param {number} clientId the clientID of the block.
 * @return {boolean} Whether the pattern is in the editing state.
 */
function selectors_isEditingPattern(state, clientId) {
  return state.isEditingPattern[clientId];
}

;// CONCATENATED MODULE: external ["wp","privateApis"]
const external_wp_privateApis_namespaceObject = window["wp"]["privateApis"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/lock-unlock.js
/**
 * WordPress dependencies
 */

const {
  lock,
  unlock
} = (0,external_wp_privateApis_namespaceObject.__dangerousOptInToUnstableAPIsOnlyForCoreModules)('I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.', '@wordpress/patterns');

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/store/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */






/**
 * Post editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 *
 * @type {Object}
 */
const storeConfig = {
  reducer: reducer
};

/**
 * Store definition for the editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
const store = (0,external_wp_data_namespaceObject.createReduxStore)(STORE_NAME, {
  ...storeConfig
});
(0,external_wp_data_namespaceObject.register)(store);
unlock(store).registerPrivateActions(actions_namespaceObject);
unlock(store).registerPrivateSelectors(selectors_namespaceObject);

;// CONCATENATED MODULE: external "React"
const external_React_namespaceObject = window["React"];
;// CONCATENATED MODULE: external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// CONCATENATED MODULE: external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// CONCATENATED MODULE: external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// CONCATENATED MODULE: external ["wp","notices"]
const external_wp_notices_namespaceObject = window["wp"]["notices"];
;// CONCATENATED MODULE: external ["wp","compose"]
const external_wp_compose_namespaceObject = window["wp"]["compose"];
;// CONCATENATED MODULE: external ["wp","htmlEntities"]
const external_wp_htmlEntities_namespaceObject = window["wp"]["htmlEntities"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/category-selector.js

/**
 * WordPress dependencies
 */





const unescapeString = arg => {
  return (0,external_wp_htmlEntities_namespaceObject.decodeEntities)(arg);
};
const CATEGORY_SLUG = 'wp_pattern_category';
function CategorySelector({
  categoryTerms,
  onChange,
  categoryMap
}) {
  const [search, setSearch] = (0,external_wp_element_namespaceObject.useState)('');
  const debouncedSearch = (0,external_wp_compose_namespaceObject.useDebounce)(setSearch, 500);
  const suggestions = (0,external_wp_element_namespaceObject.useMemo)(() => {
    return Array.from(categoryMap.values()).map(category => unescapeString(category.label)).filter(category => {
      if (search !== '') {
        return category.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    }).sort((a, b) => a.localeCompare(b));
  }, [search, categoryMap]);
  function handleChange(termNames) {
    const uniqueTerms = termNames.reduce((terms, newTerm) => {
      if (!terms.some(term => term.toLowerCase() === newTerm.toLowerCase())) {
        terms.push(newTerm);
      }
      return terms;
    }, []);
    onChange(uniqueTerms);
  }
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.FormTokenField, {
    className: "patterns-menu-items__convert-modal-categories",
    value: categoryTerms,
    suggestions: suggestions,
    onChange: handleChange,
    onInputChange: debouncedSearch,
    label: (0,external_wp_i18n_namespaceObject.__)('Categories'),
    tokenizeOnBlur: true,
    __experimentalExpandOnFocus: true,
    __next40pxDefaultSize: true,
    __nextHasNoMarginBottom: true
  });
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/private-hooks.js
/**
 * WordPress dependencies
 */




/**
 * Internal dependencies
 */


/**
 * Helper hook that creates a Map with the core and user patterns categories
 * and removes any duplicates. It's used when we need to create new user
 * categories when creating or importing patterns.
 * This hook also provides a function to find or create a pattern category.
 *
 * @return {Object} The merged categories map and the callback function to find or create a category.
 */
function useAddPatternCategory() {
  const {
    saveEntityRecord,
    invalidateResolution
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_coreData_namespaceObject.store);
  const {
    corePatternCategories,
    userPatternCategories
  } = (0,external_wp_data_namespaceObject.useSelect)(select => {
    const {
      getUserPatternCategories,
      getBlockPatternCategories
    } = select(external_wp_coreData_namespaceObject.store);
    return {
      corePatternCategories: getBlockPatternCategories(),
      userPatternCategories: getUserPatternCategories()
    };
  }, []);
  const categoryMap = (0,external_wp_element_namespaceObject.useMemo)(() => {
    // Merge the user and core pattern categories and remove any duplicates.
    const uniqueCategories = new Map();
    userPatternCategories.forEach(category => {
      uniqueCategories.set(category.label.toLowerCase(), {
        label: category.label,
        name: category.name,
        id: category.id
      });
    });
    corePatternCategories.forEach(category => {
      if (!uniqueCategories.has(category.label.toLowerCase()) &&
      // There are two core categories with `Post` label so explicitly remove the one with
      // the `query` slug to avoid any confusion.
      category.name !== 'query') {
        uniqueCategories.set(category.label.toLowerCase(), {
          label: category.label,
          name: category.name
        });
      }
    });
    return uniqueCategories;
  }, [userPatternCategories, corePatternCategories]);
  async function findOrCreateTerm(term) {
    try {
      const existingTerm = categoryMap.get(term.toLowerCase());
      if (existingTerm?.id) {
        return existingTerm.id;
      }
      // If we have an existing core category we need to match the new user category to the
      // correct slug rather than autogenerating it to prevent duplicates, eg. the core `Headers`
      // category uses the singular `header` as the slug.
      const termData = existingTerm ? {
        name: existingTerm.label,
        slug: existingTerm.name
      } : {
        name: term
      };
      const newTerm = await saveEntityRecord('taxonomy', CATEGORY_SLUG, termData, {
        throwOnError: true
      });
      invalidateResolution('getUserPatternCategories');
      return newTerm.id;
    } catch (error) {
      if (error.code !== 'term_exists') {
        throw error;
      }
      return error.data.term_id;
    }
  }
  return {
    categoryMap,
    findOrCreateTerm
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/create-pattern-modal.js

/**
 * WordPress dependencies
 */






/**
 * Internal dependencies
 */





function CreatePatternModal({
  className = 'patterns-menu-items__convert-modal',
  modalTitle = (0,external_wp_i18n_namespaceObject.__)('Create pattern'),
  ...restProps
}) {
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Modal, {
    title: modalTitle,
    onRequestClose: restProps.onClose,
    overlayClassName: className
  }, (0,external_React_namespaceObject.createElement)(CreatePatternModalContents, {
    ...restProps
  }));
}
function CreatePatternModalContents({
  confirmLabel = (0,external_wp_i18n_namespaceObject.__)('Create'),
  defaultCategories = [],
  content,
  onClose,
  onError,
  onSuccess,
  defaultSyncType = PATTERN_SYNC_TYPES.full,
  defaultTitle = ''
}) {
  const [syncType, setSyncType] = (0,external_wp_element_namespaceObject.useState)(defaultSyncType);
  const [categoryTerms, setCategoryTerms] = (0,external_wp_element_namespaceObject.useState)(defaultCategories);
  const [title, setTitle] = (0,external_wp_element_namespaceObject.useState)(defaultTitle);
  const [isSaving, setIsSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const {
    createPattern
  } = unlock((0,external_wp_data_namespaceObject.useDispatch)(store));
  const {
    createErrorNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  const {
    categoryMap,
    findOrCreateTerm
  } = useAddPatternCategory();
  async function onCreate(patternTitle, sync) {
    if (!title || isSaving) {
      return;
    }
    try {
      setIsSaving(true);
      const categories = await Promise.all(categoryTerms.map(termName => findOrCreateTerm(termName)));
      const newPattern = await createPattern(patternTitle, sync, typeof content === 'function' ? content() : content, categories);
      onSuccess({
        pattern: newPattern,
        categoryId: PATTERN_DEFAULT_CATEGORY
      });
    } catch (error) {
      createErrorNotice(error.message, {
        type: 'snackbar',
        id: 'pattern-create'
      });
      onError?.();
    } finally {
      setIsSaving(false);
      setCategoryTerms([]);
      setTitle('');
    }
  }
  return (0,external_React_namespaceObject.createElement)("form", {
    onSubmit: event => {
      event.preventDefault();
      onCreate(title, syncType);
    }
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalVStack, {
    spacing: "5"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.TextControl, {
    label: (0,external_wp_i18n_namespaceObject.__)('Name'),
    value: title,
    onChange: setTitle,
    placeholder: (0,external_wp_i18n_namespaceObject.__)('My pattern'),
    className: "patterns-create-modal__name-input",
    __nextHasNoMarginBottom: true,
    __next40pxDefaultSize: true
  }), (0,external_React_namespaceObject.createElement)(CategorySelector, {
    categoryTerms: categoryTerms,
    onChange: setCategoryTerms,
    categoryMap: categoryMap
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToggleControl, {
    label: (0,external_wp_i18n_namespaceObject._x)('Synced', 'Option that makes an individual pattern synchronized'),
    help: (0,external_wp_i18n_namespaceObject.__)('Sync this pattern across multiple locations.'),
    checked: syncType === PATTERN_SYNC_TYPES.full,
    onChange: () => {
      setSyncType(syncType === PATTERN_SYNC_TYPES.full ? PATTERN_SYNC_TYPES.unsynced : PATTERN_SYNC_TYPES.full);
    }
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalHStack, {
    justify: "right"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "tertiary",
    onClick: () => {
      onClose();
      setTitle('');
    }
  }, (0,external_wp_i18n_namespaceObject.__)('Cancel')), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "primary",
    type: "submit",
    "aria-disabled": !title || isSaving,
    isBusy: isSaving
  }, confirmLabel))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/duplicate-pattern-modal.js

/**
 * WordPress dependencies
 */





/**
 * Internal dependencies
 */


function getTermLabels(pattern, categories) {
  // Theme patterns rely on core pattern categories.
  if (pattern.type !== PATTERN_TYPES.user) {
    return categories.core?.filter(category => pattern.categories.includes(category.name)).map(category => category.label);
  }
  return categories.user?.filter(category => pattern.wp_pattern_category.includes(category.id)).map(category => category.label);
}
function useDuplicatePatternProps({
  pattern,
  onSuccess
}) {
  const {
    createSuccessNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  const categories = (0,external_wp_data_namespaceObject.useSelect)(select => {
    const {
      getUserPatternCategories,
      getBlockPatternCategories
    } = select(external_wp_coreData_namespaceObject.store);
    return {
      core: getBlockPatternCategories(),
      user: getUserPatternCategories()
    };
  });
  if (!pattern) {
    return null;
  }
  return {
    content: pattern.content,
    defaultCategories: getTermLabels(pattern, categories),
    defaultSyncType: pattern.type !== PATTERN_TYPES.user // Theme patterns are unsynced by default.
    ? PATTERN_SYNC_TYPES.unsynced : pattern.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full,
    defaultTitle: (0,external_wp_i18n_namespaceObject.sprintf)( /* translators: %s: Existing pattern title */
    (0,external_wp_i18n_namespaceObject.__)('%s (Copy)'), typeof pattern.title === 'string' ? pattern.title : pattern.title.raw),
    onSuccess: ({
      pattern: newPattern
    }) => {
      createSuccessNotice((0,external_wp_i18n_namespaceObject.sprintf)(
      // translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
      (0,external_wp_i18n_namespaceObject.__)('"%s" duplicated.'), newPattern.title.raw), {
        type: 'snackbar',
        id: 'patterns-create'
      });
      onSuccess?.({
        pattern: newPattern
      });
    }
  };
}
function DuplicatePatternModal({
  pattern,
  onClose,
  onSuccess
}) {
  const duplicatedProps = useDuplicatePatternProps({
    pattern,
    onSuccess
  });
  if (!pattern) {
    return null;
  }
  return (0,external_React_namespaceObject.createElement)(CreatePatternModal, {
    modalTitle: (0,external_wp_i18n_namespaceObject.__)('Duplicate pattern'),
    confirmLabel: (0,external_wp_i18n_namespaceObject.__)('Duplicate'),
    onClose: onClose,
    onError: onClose,
    ...duplicatedProps
  });
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/rename-pattern-modal.js

/**
 * WordPress dependencies
 */







function RenamePatternModal({
  onClose,
  onError,
  onSuccess,
  pattern,
  ...props
}) {
  const originalName = (0,external_wp_htmlEntities_namespaceObject.decodeEntities)(pattern.title);
  const [name, setName] = (0,external_wp_element_namespaceObject.useState)(originalName);
  const [isSaving, setIsSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const {
    editEntityRecord,
    __experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_coreData_namespaceObject.store);
  const {
    createSuccessNotice,
    createErrorNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  const onRename = async event => {
    event.preventDefault();
    if (!name || name === pattern.title || isSaving) {
      return;
    }
    try {
      await editEntityRecord('postType', pattern.type, pattern.id, {
        title: name
      });
      setIsSaving(true);
      setName('');
      onClose?.();
      const savedRecord = await saveSpecifiedEntityEdits('postType', pattern.type, pattern.id, ['title'], {
        throwOnError: true
      });
      onSuccess?.(savedRecord);
      createSuccessNotice((0,external_wp_i18n_namespaceObject.__)('Pattern renamed'), {
        type: 'snackbar',
        id: 'pattern-update'
      });
    } catch (error) {
      onError?.();
      const errorMessage = error.message && error.code !== 'unknown_error' ? error.message : (0,external_wp_i18n_namespaceObject.__)('An error occurred while renaming the pattern.');
      createErrorNotice(errorMessage, {
        type: 'snackbar',
        id: 'pattern-update'
      });
    } finally {
      setIsSaving(false);
      setName('');
    }
  };
  const onRequestClose = () => {
    onClose?.();
    setName('');
  };
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Modal, {
    title: (0,external_wp_i18n_namespaceObject.__)('Rename'),
    ...props,
    onRequestClose: onClose
  }, (0,external_React_namespaceObject.createElement)("form", {
    onSubmit: onRename
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalVStack, {
    spacing: "5"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.TextControl, {
    __nextHasNoMarginBottom: true,
    __next40pxDefaultSize: true,
    label: (0,external_wp_i18n_namespaceObject.__)('Name'),
    value: name,
    onChange: setName,
    required: true
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalHStack, {
    justify: "right"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "tertiary",
    onClick: onRequestClose
  }, (0,external_wp_i18n_namespaceObject.__)('Cancel')), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "primary",
    type: "submit"
  }, (0,external_wp_i18n_namespaceObject.__)('Save'))))));
}

;// CONCATENATED MODULE: external ["wp","primitives"]
const external_wp_primitives_namespaceObject = window["wp"]["primitives"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/symbol.js

/**
 * WordPress dependencies
 */

const symbol = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M21.3 10.8l-5.6-5.6c-.7-.7-1.8-.7-2.5 0l-5.6 5.6c-.7.7-.7 1.8 0 2.5l5.6 5.6c.3.3.8.5 1.2.5s.9-.2 1.2-.5l5.6-5.6c.8-.7.8-1.9.1-2.5zm-1 1.4l-5.6 5.6c-.1.1-.3.1-.4 0l-5.6-5.6c-.1-.1-.1-.3 0-.4l5.6-5.6s.1-.1.2-.1.1 0 .2.1l5.6 5.6c.1.1.1.3 0 .4zm-16.6-.4L10 5.5l-1-1-6.3 6.3c-.7.7-.7 1.8 0 2.5L9 19.5l1.1-1.1-6.3-6.3c-.2 0-.2-.2-.1-.3z"
}));
/* harmony default export */ const library_symbol = (symbol);

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/pattern-convert-button.js

/**
 * WordPress dependencies
 */









/**
 * Internal dependencies
 */





/**
 * Menu control to convert block(s) to a pattern block.
 *
 * @param {Object}   props                        Component props.
 * @param {string[]} props.clientIds              Client ids of selected blocks.
 * @param {string}   props.rootClientId           ID of the currently selected top-level block.
 * @param {()=>void} props.closeBlockSettingsMenu Callback to close the block settings menu dropdown.
 * @return {import('react').ComponentType} The menu control or null.
 */
function PatternConvertButton({
  clientIds,
  rootClientId,
  closeBlockSettingsMenu
}) {
  const {
    createSuccessNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  const {
    replaceBlocks
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_blockEditor_namespaceObject.store);
  // Ignore reason: false positive of the lint rule.
  // eslint-disable-next-line @wordpress/no-unused-vars-before-return
  const {
    setEditingPattern
  } = unlock((0,external_wp_data_namespaceObject.useDispatch)(store));
  const [isModalOpen, setIsModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  const canConvert = (0,external_wp_data_namespaceObject.useSelect)(select => {
    var _getBlocksByClientId;
    const {
      canUser
    } = select(external_wp_coreData_namespaceObject.store);
    const {
      getBlocksByClientId,
      canInsertBlockType,
      getBlockRootClientId
    } = select(external_wp_blockEditor_namespaceObject.store);
    const rootId = rootClientId || (clientIds.length > 0 ? getBlockRootClientId(clientIds[0]) : undefined);
    const blocks = (_getBlocksByClientId = getBlocksByClientId(clientIds)) !== null && _getBlocksByClientId !== void 0 ? _getBlocksByClientId : [];
    const isReusable = blocks.length === 1 && blocks[0] && (0,external_wp_blocks_namespaceObject.isReusableBlock)(blocks[0]) && !!select(external_wp_coreData_namespaceObject.store).getEntityRecord('postType', 'wp_block', blocks[0].attributes.ref);
    const _canConvert =
    // Hide when this is already a synced pattern.
    !isReusable &&
    // Hide when patterns are disabled.
    canInsertBlockType('core/block', rootId) && blocks.every(block =>
    // Guard against the case where a regular block has *just* been converted.
    !!block &&
    // Hide on invalid blocks.
    block.isValid &&
    // Hide when block doesn't support being made into a pattern.
    (0,external_wp_blocks_namespaceObject.hasBlockSupport)(block.name, 'reusable', true)) &&
    // Hide when current doesn't have permission to do that.
    !!canUser('create', 'blocks');
    return _canConvert;
  }, [clientIds, rootClientId]);
  const {
    getBlocksByClientId
  } = (0,external_wp_data_namespaceObject.useSelect)(external_wp_blockEditor_namespaceObject.store);
  const getContent = (0,external_wp_element_namespaceObject.useCallback)(() => (0,external_wp_blocks_namespaceObject.serialize)(getBlocksByClientId(clientIds)), [getBlocksByClientId, clientIds]);
  if (!canConvert) {
    return null;
  }
  const handleSuccess = ({
    pattern
  }) => {
    if (pattern.wp_pattern_sync_status !== PATTERN_SYNC_TYPES.unsynced) {
      const newBlock = (0,external_wp_blocks_namespaceObject.createBlock)('core/block', {
        ref: pattern.id
      });
      replaceBlocks(clientIds, newBlock);
      setEditingPattern(newBlock.clientId, true);
      closeBlockSettingsMenu();
    }
    createSuccessNotice(pattern.wp_pattern_sync_status === PATTERN_SYNC_TYPES.unsynced ? (0,external_wp_i18n_namespaceObject.sprintf)(
    // translators: %s: the name the user has given to the pattern.
    (0,external_wp_i18n_namespaceObject.__)('Unsynced pattern created: %s'), pattern.title.raw) : (0,external_wp_i18n_namespaceObject.sprintf)(
    // translators: %s: the name the user has given to the pattern.
    (0,external_wp_i18n_namespaceObject.__)('Synced pattern created: %s'), pattern.title.raw), {
      type: 'snackbar',
      id: 'convert-to-pattern-success'
    });
    setIsModalOpen(false);
  };
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.MenuItem, {
    icon: library_symbol,
    onClick: () => setIsModalOpen(true),
    "aria-expanded": isModalOpen,
    "aria-haspopup": "dialog"
  }, (0,external_wp_i18n_namespaceObject.__)('Create pattern')), isModalOpen && (0,external_React_namespaceObject.createElement)(CreatePatternModal, {
    content: getContent,
    onSuccess: pattern => {
      handleSuccess(pattern);
    },
    onError: () => {
      setIsModalOpen(false);
    },
    onClose: () => {
      setIsModalOpen(false);
    }
  }));
}

;// CONCATENATED MODULE: external ["wp","url"]
const external_wp_url_namespaceObject = window["wp"]["url"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/patterns-manage-button.js

/**
 * WordPress dependencies
 */








/**
 * Internal dependencies
 */


function PatternsManageButton({
  clientId
}) {
  const {
    canRemove,
    isVisible,
    managePatternsUrl
  } = (0,external_wp_data_namespaceObject.useSelect)(select => {
    const {
      getBlock,
      canRemoveBlock,
      getBlockCount,
      getSettings
    } = select(external_wp_blockEditor_namespaceObject.store);
    const {
      canUser
    } = select(external_wp_coreData_namespaceObject.store);
    const reusableBlock = getBlock(clientId);
    const isBlockTheme = getSettings().__unstableIsBlockBasedTheme;
    return {
      canRemove: canRemoveBlock(clientId),
      isVisible: !!reusableBlock && (0,external_wp_blocks_namespaceObject.isReusableBlock)(reusableBlock) && !!canUser('update', 'blocks', reusableBlock.attributes.ref),
      innerBlockCount: getBlockCount(clientId),
      // The site editor and templates both check whether the user
      // has edit_theme_options capabilities. We can leverage that here
      // and omit the manage patterns link if the user can't access it.
      managePatternsUrl: isBlockTheme && canUser('read', 'templates') ? (0,external_wp_url_namespaceObject.addQueryArgs)('site-editor.php', {
        path: '/patterns'
      }) : (0,external_wp_url_namespaceObject.addQueryArgs)('edit.php', {
        post_type: 'wp_block'
      })
    };
  }, [clientId]);

  // Ignore reason: false positive of the lint rule.
  // eslint-disable-next-line @wordpress/no-unused-vars-before-return
  const {
    convertSyncedPatternToStatic
  } = unlock((0,external_wp_data_namespaceObject.useDispatch)(store));
  if (!isVisible) {
    return null;
  }
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, canRemove && (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.MenuItem, {
    onClick: () => convertSyncedPatternToStatic(clientId)
  }, (0,external_wp_i18n_namespaceObject.__)('Detach')), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.MenuItem, {
    href: managePatternsUrl
  }, (0,external_wp_i18n_namespaceObject.__)('Manage patterns')));
}
/* harmony default export */ const patterns_manage_button = (PatternsManageButton);

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/index.js

/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */


function PatternsMenuItems({
  rootClientId
}) {
  return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockSettingsMenuControls, null, ({
    selectedClientIds,
    onClose
  }) => (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(PatternConvertButton, {
    clientIds: selectedClientIds,
    rootClientId: rootClientId,
    closeBlockSettingsMenu: onClose
  }), selectedClientIds.length === 1 && (0,external_React_namespaceObject.createElement)(patterns_manage_button, {
    clientId: selectedClientIds[0]
  })));
}

;// CONCATENATED MODULE: external ["wp","a11y"]
const external_wp_a11y_namespaceObject = window["wp"]["a11y"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/rename-pattern-category-modal.js

/**
 * WordPress dependencies
 */









/**
 * Internal dependencies
 */

function RenamePatternCategoryModal({
  category,
  existingCategories,
  onClose,
  onError,
  onSuccess,
  ...props
}) {
  const id = (0,external_wp_element_namespaceObject.useId)();
  const textControlRef = (0,external_wp_element_namespaceObject.useRef)();
  const [name, setName] = (0,external_wp_element_namespaceObject.useState)((0,external_wp_htmlEntities_namespaceObject.decodeEntities)(category.name));
  const [isSaving, setIsSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const [validationMessage, setValidationMessage] = (0,external_wp_element_namespaceObject.useState)(false);
  const validationMessageId = validationMessage ? `patterns-rename-pattern-category-modal__validation-message-${id}` : undefined;
  const {
    saveEntityRecord,
    invalidateResolution
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_coreData_namespaceObject.store);
  const {
    createErrorNotice,
    createSuccessNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  const onChange = newName => {
    if (validationMessage) {
      setValidationMessage(undefined);
    }
    setName(newName);
  };
  const onSave = async event => {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    if (!name || name === category.name) {
      const message = (0,external_wp_i18n_namespaceObject.__)('Please enter a new name for this category.');
      (0,external_wp_a11y_namespaceObject.speak)(message, 'assertive');
      setValidationMessage(message);
      textControlRef.current?.focus();
      return;
    }

    // Check existing categories to avoid creating duplicates.
    if (existingCategories.patternCategories.find(existingCategory => {
      // Compare the id so that the we don't disallow the user changing the case of their current category
      // (i.e. renaming 'test' to 'Test').
      return existingCategory.id !== category.id && existingCategory.label.toLowerCase() === name.toLowerCase();
    })) {
      const message = (0,external_wp_i18n_namespaceObject.__)('This category already exists. Please use a different name.');
      (0,external_wp_a11y_namespaceObject.speak)(message, 'assertive');
      setValidationMessage(message);
      textControlRef.current?.focus();
      return;
    }
    try {
      setIsSaving(true);

      // User pattern category properties may differ as they can be
      // normalized for use alongside template part areas, core pattern
      // categories etc. As a result we won't just destructure the passed
      // category object.
      const savedRecord = await saveEntityRecord('taxonomy', CATEGORY_SLUG, {
        id: category.id,
        slug: category.slug,
        name
      });
      invalidateResolution('getUserPatternCategories');
      onSuccess?.(savedRecord);
      onClose();
      createSuccessNotice((0,external_wp_i18n_namespaceObject.__)('Pattern category renamed.'), {
        type: 'snackbar',
        id: 'pattern-category-update'
      });
    } catch (error) {
      onError?.();
      createErrorNotice(error.message, {
        type: 'snackbar',
        id: 'pattern-category-update'
      });
    } finally {
      setIsSaving(false);
      setName('');
    }
  };
  const onRequestClose = () => {
    onClose();
    setName('');
  };
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Modal, {
    title: (0,external_wp_i18n_namespaceObject.__)('Rename'),
    onRequestClose: onRequestClose,
    ...props
  }, (0,external_React_namespaceObject.createElement)("form", {
    onSubmit: onSave
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalVStack, {
    spacing: "5"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalVStack, {
    spacing: "2"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.TextControl, {
    ref: textControlRef,
    __nextHasNoMarginBottom: true,
    __next40pxDefaultSize: true,
    label: (0,external_wp_i18n_namespaceObject.__)('Name'),
    value: name,
    onChange: onChange,
    "aria-describedby": validationMessageId,
    required: true
  }), validationMessage && (0,external_React_namespaceObject.createElement)("span", {
    className: "patterns-rename-pattern-category-modal__validation-message",
    id: validationMessageId
  }, validationMessage)), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalHStack, {
    justify: "right"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "tertiary",
    onClick: onRequestClose
  }, (0,external_wp_i18n_namespaceObject.__)('Cancel')), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    __next40pxDefaultSize: true,
    variant: "primary",
    type: "submit",
    "aria-disabled": !name || name === category.name || isSaving,
    isBusy: isSaving
  }, (0,external_wp_i18n_namespaceObject.__)('Save'))))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/use-set-pattern-bindings.js
/**
 * WordPress dependencies
 */





/**
 * Internal dependencies
 */


function removeBindings(bindings, syncedAttributes) {
  let updatedBindings = {};
  for (const attributeName of syncedAttributes) {
    // Omit any pattern override bindings from the `updatedBindings` object.
    if (bindings?.[attributeName]?.source !== 'core/pattern-overrides' && bindings?.[attributeName]?.source !== undefined) {
      updatedBindings[attributeName] = bindings[attributeName];
    }
  }
  if (!Object.keys(updatedBindings).length) {
    updatedBindings = undefined;
  }
  return updatedBindings;
}
function addBindings(bindings, syncedAttributes) {
  const updatedBindings = {
    ...bindings
  };
  for (const attributeName of syncedAttributes) {
    if (!bindings?.[attributeName]) {
      updatedBindings[attributeName] = {
        source: 'core/pattern-overrides'
      };
    }
  }
  return updatedBindings;
}
function useSetPatternBindings({
  name,
  attributes,
  setAttributes
}, currentPostType) {
  var _attributes$metadata$, _usePrevious;
  const hasPatternOverridesSource = (0,external_wp_data_namespaceObject.useSelect)(select => {
    const {
      getBlockBindingsSource
    } = unlock(select(external_wp_blocks_namespaceObject.store));

    // For editing link to the site editor if the theme and user permissions support it.
    return !!getBlockBindingsSource('core/pattern-overrides');
  }, []);
  const metadataName = (_attributes$metadata$ = attributes?.metadata?.name) !== null && _attributes$metadata$ !== void 0 ? _attributes$metadata$ : '';
  const prevMetadataName = (_usePrevious = (0,external_wp_compose_namespaceObject.usePrevious)(metadataName)) !== null && _usePrevious !== void 0 ? _usePrevious : '';
  const bindings = attributes?.metadata?.bindings;
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Bindings should only be created when editing a wp_block post type,
    // and also when there's a change to the user-given name for the block.
    // Also check that the pattern overrides source is registered.
    if (!hasPatternOverridesSource || currentPostType !== 'wp_block' || metadataName === prevMetadataName) {
      return;
    }
    const syncedAttributes = PARTIAL_SYNCING_SUPPORTED_BLOCKS[name];
    const attributeSources = syncedAttributes.map(attributeName => attributes.metadata?.bindings?.[attributeName]?.source);
    const isConnectedToOtherSources = attributeSources.every(source => source && source !== 'core/pattern-overrides');

    // Avoid overwriting other (e.g. meta) bindings.
    if (isConnectedToOtherSources) {
      return;
    }

    // The user-given name for the block was deleted, remove the bindings.
    if (!metadataName?.length && prevMetadataName?.length) {
      const updatedBindings = removeBindings(bindings, syncedAttributes);
      setAttributes({
        metadata: {
          ...attributes.metadata,
          bindings: updatedBindings
        }
      });
    }

    // The user-given name for the block was set, set the bindings.
    if (!prevMetadataName?.length && metadataName.length) {
      const updatedBindings = addBindings(bindings, syncedAttributes);
      setAttributes({
        metadata: {
          ...attributes.metadata,
          bindings: updatedBindings
        }
      });
    }
  }, [hasPatternOverridesSource, bindings, prevMetadataName, metadataName, currentPostType, name, attributes.metadata, setAttributes]);
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/components/reset-overrides-control.js

/**
 * WordPress dependencies
 */






function recursivelyFindBlockWithName(blocks, name) {
  for (const block of blocks) {
    if (block.attributes.metadata?.name === name) {
      return block;
    }
    const found = recursivelyFindBlockWithName(block.innerBlocks, name);
    if (found) {
      return found;
    }
  }
}
function ResetOverridesControl(props) {
  const registry = (0,external_wp_data_namespaceObject.useRegistry)();
  const name = props.attributes.metadata?.name;
  const patternWithOverrides = (0,external_wp_data_namespaceObject.useSelect)(select => {
    if (!name) {
      return undefined;
    }
    const {
      getBlockParentsByBlockName,
      getBlocksByClientId
    } = select(external_wp_blockEditor_namespaceObject.store);
    const patternBlock = getBlocksByClientId(getBlockParentsByBlockName(props.clientId, 'core/block'))[0];
    if (!patternBlock?.attributes.content?.[name]) {
      return undefined;
    }
    return patternBlock;
  }, [props.clientId, name]);
  const resetOverrides = async () => {
    var _editedRecord$blocks;
    const editedRecord = await registry.resolveSelect(external_wp_coreData_namespaceObject.store).getEditedEntityRecord('postType', 'wp_block', patternWithOverrides.attributes.ref);
    const blocks = (_editedRecord$blocks = editedRecord.blocks) !== null && _editedRecord$blocks !== void 0 ? _editedRecord$blocks : (0,external_wp_blocks_namespaceObject.parse)(editedRecord.content);
    const block = recursivelyFindBlockWithName(blocks, name);
    const newAttributes = Object.assign(
    // Reset every existing attribute to undefined.
    Object.fromEntries(Object.keys(props.attributes).map(key => [key, undefined])),
    // Then assign the original attributes.
    block.attributes);
    props.setAttributes(newAttributes);
  };
  return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockControls, {
    group: "other"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToolbarGroup, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToolbarButton, {
    onClick: resetOverrides,
    disabled: !patternWithOverrides,
    __experimentalIsFocusable: true
  }, (0,external_wp_i18n_namespaceObject.__)('Reset'))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/private-apis.js
/**
 * Internal dependencies
 */










const privateApis = {};
lock(privateApis, {
  CreatePatternModal: CreatePatternModal,
  CreatePatternModalContents: CreatePatternModalContents,
  DuplicatePatternModal: DuplicatePatternModal,
  useDuplicatePatternProps: useDuplicatePatternProps,
  RenamePatternModal: RenamePatternModal,
  PatternsMenuItems: PatternsMenuItems,
  RenamePatternCategoryModal: RenamePatternCategoryModal,
  useSetPatternBindings: useSetPatternBindings,
  ResetOverridesControl: ResetOverridesControl,
  useAddPatternCategory: useAddPatternCategory,
  PATTERN_TYPES: PATTERN_TYPES,
  PATTERN_DEFAULT_CATEGORY: PATTERN_DEFAULT_CATEGORY,
  PATTERN_USER_CATEGORY: PATTERN_USER_CATEGORY,
  EXCLUDED_PATTERN_SOURCES: EXCLUDED_PATTERN_SOURCES,
  PATTERN_SYNC_TYPES: PATTERN_SYNC_TYPES,
  PARTIAL_SYNCING_SUPPORTED_BLOCKS: PARTIAL_SYNCING_SUPPORTED_BLOCKS
});

;// CONCATENATED MODULE: ./node_modules/@wordpress/patterns/build-module/index.js
/**
 * Internal dependencies
 */



(window.wp = window.wp || {}).patterns = __webpack_exports__;
/******/ })()
;