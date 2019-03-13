(function(e, a) { for(var i in a) e[i] = a[i]; }(window, /******/ (function(modules) { // webpackBootstrap
/******/ 	function hotDisposeChunk(chunkId) {
/******/ 		delete installedChunks[chunkId];
/******/ 	}
/******/ 	var parentHotUpdateCallback = window["webpackHotUpdate"];
/******/ 	window["webpackHotUpdate"] = // eslint-disable-next-line no-unused-vars
/******/ 	function webpackHotUpdateCallback(chunkId, moreModules) {
/******/ 		hotAddUpdateChunk(chunkId, moreModules);
/******/ 		if (parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
/******/ 	} ;
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadUpdateChunk(chunkId) {
/******/ 		var script = document.createElement("script");
/******/ 		script.charset = "utf-8";
/******/ 		script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
/******/ 		if (null) script.crossOrigin = null;
/******/ 		document.head.appendChild(script);
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadManifest(requestTimeout) {
/******/ 		requestTimeout = requestTimeout || 10000;
/******/ 		return new Promise(function(resolve, reject) {
/******/ 			if (typeof XMLHttpRequest === "undefined") {
/******/ 				return reject(new Error("No browser support"));
/******/ 			}
/******/ 			try {
/******/ 				var request = new XMLHttpRequest();
/******/ 				var requestPath = __webpack_require__.p + "" + hotCurrentHash + ".hot-update.json";
/******/ 				request.open("GET", requestPath, true);
/******/ 				request.timeout = requestTimeout;
/******/ 				request.send(null);
/******/ 			} catch (err) {
/******/ 				return reject(err);
/******/ 			}
/******/ 			request.onreadystatechange = function() {
/******/ 				if (request.readyState !== 4) return;
/******/ 				if (request.status === 0) {
/******/ 					// timeout
/******/ 					reject(
/******/ 						new Error("Manifest request to " + requestPath + " timed out.")
/******/ 					);
/******/ 				} else if (request.status === 404) {
/******/ 					// no update available
/******/ 					resolve();
/******/ 				} else if (request.status !== 200 && request.status !== 304) {
/******/ 					// other failure
/******/ 					reject(new Error("Manifest request to " + requestPath + " failed."));
/******/ 				} else {
/******/ 					// success
/******/ 					try {
/******/ 						var update = JSON.parse(request.responseText);
/******/ 					} catch (e) {
/******/ 						reject(e);
/******/ 						return;
/******/ 					}
/******/ 					resolve(update);
/******/ 				}
/******/ 			};
/******/ 		});
/******/ 	}
/******/
/******/ 	var hotApplyOnUpdate = true;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentHash = "c3fac7152059088d649c";
/******/ 	var hotRequestTimeout = 10000;
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentChildModule;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParents = [];
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParentsTemp = [];
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateRequire(moduleId) {
/******/ 		var me = installedModules[moduleId];
/******/ 		if (!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if (me.hot.active) {
/******/ 				if (installedModules[request]) {
/******/ 					if (installedModules[request].parents.indexOf(moduleId) === -1) {
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					}
/******/ 				} else {
/******/ 					hotCurrentParents = [moduleId];
/******/ 					hotCurrentChildModule = request;
/******/ 				}
/******/ 				if (me.children.indexOf(request) === -1) {
/******/ 					me.children.push(request);
/******/ 				}
/******/ 			} else {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" +
/******/ 						request +
/******/ 						") from disposed module " +
/******/ 						moduleId
/******/ 				);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		var ObjectFactory = function ObjectFactory(name) {
/******/ 			return {
/******/ 				configurable: true,
/******/ 				enumerable: true,
/******/ 				get: function() {
/******/ 					return __webpack_require__[name];
/******/ 				},
/******/ 				set: function(value) {
/******/ 					__webpack_require__[name] = value;
/******/ 				}
/******/ 			};
/******/ 		};
/******/ 		for (var name in __webpack_require__) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(__webpack_require__, name) &&
/******/ 				name !== "e" &&
/******/ 				name !== "t"
/******/ 			) {
/******/ 				Object.defineProperty(fn, name, ObjectFactory(name));
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId) {
/******/ 			if (hotStatus === "ready") hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			return __webpack_require__.e(chunkId).then(finishChunkLoading, function(err) {
/******/ 				finishChunkLoading();
/******/ 				throw err;
/******/ 			});
/******/
/******/ 			function finishChunkLoading() {
/******/ 				hotChunksLoading--;
/******/ 				if (hotStatus === "prepare") {
/******/ 					if (!hotWaitingFilesMap[chunkId]) {
/******/ 						hotEnsureUpdateChunk(chunkId);
/******/ 					}
/******/ 					if (hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 						hotUpdateDownloaded();
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		fn.t = function(value, mode) {
/******/ 			if (mode & 1) value = fn(value);
/******/ 			return __webpack_require__.t(value, mode & ~1);
/******/ 		};
/******/ 		return fn;
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateModule(moduleId) {
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_disposeHandlers: [],
/******/ 			_main: hotCurrentChildModule !== moduleId,
/******/
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if (dep === undefined) hot._selfAccepted = true;
/******/ 				else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 				else hot._acceptedDependencies[dep] = callback || function() {};
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if (dep === undefined) hot._selfDeclined = true;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 				else hot._declinedDependencies[dep] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if (!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if (idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		hotCurrentChildModule = undefined;
/******/ 		return hot;
/******/ 	}
/******/
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for (var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailableFilesMap = {};
/******/ 	var hotDeferred;
/******/
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = +id + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/
/******/ 	function hotCheck(apply) {
/******/ 		if (hotStatus !== "idle") {
/******/ 			throw new Error("check() is only allowed in idle status");
/******/ 		}
/******/ 		hotApplyOnUpdate = apply;
/******/ 		hotSetStatus("check");
/******/ 		return hotDownloadManifest(hotRequestTimeout).then(function(update) {
/******/ 			if (!update) {
/******/ 				hotSetStatus("idle");
/******/ 				return null;
/******/ 			}
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			hotAvailableFilesMap = update.c;
/******/ 			hotUpdateNewHash = update.h;
/******/
/******/ 			hotSetStatus("prepare");
/******/ 			var promise = new Promise(function(resolve, reject) {
/******/ 				hotDeferred = {
/******/ 					resolve: resolve,
/******/ 					reject: reject
/******/ 				};
/******/ 			});
/******/ 			hotUpdate = {};
/******/ 			var chunkId = "editor-beta";
/******/ 			// eslint-disable-next-line no-lone-blocks
/******/ 			{
/******/ 				/*globals chunkId */
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if (
/******/ 				hotStatus === "prepare" &&
/******/ 				hotChunksLoading === 0 &&
/******/ 				hotWaitingFiles === 0
/******/ 			) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 			return promise;
/******/ 		});
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) {
/******/ 		if (!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for (var moduleId in moreModules) {
/******/ 			if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if (--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if (!hotAvailableFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var deferred = hotDeferred;
/******/ 		hotDeferred = null;
/******/ 		if (!deferred) return;
/******/ 		if (hotApplyOnUpdate) {
/******/ 			// Wrap deferred object in Promise to mark it as a well-handled Promise to
/******/ 			// avoid triggering uncaught exception warning in Chrome.
/******/ 			// See https://bugs.chromium.org/p/chromium/issues/detail?id=465666
/******/ 			Promise.resolve()
/******/ 				.then(function() {
/******/ 					return hotApply(hotApplyOnUpdate);
/******/ 				})
/******/ 				.then(
/******/ 					function(result) {
/******/ 						deferred.resolve(result);
/******/ 					},
/******/ 					function(err) {
/******/ 						deferred.reject(err);
/******/ 					}
/******/ 				);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for (var id in hotUpdate) {
/******/ 				if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			deferred.resolve(outdatedModules);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotApply(options) {
/******/ 		if (hotStatus !== "ready")
/******/ 			throw new Error("apply() is only allowed in ready status");
/******/ 		options = options || {};
/******/
/******/ 		var cb;
/******/ 		var i;
/******/ 		var j;
/******/ 		var module;
/******/ 		var moduleId;
/******/
/******/ 		function getAffectedStuff(updateModuleId) {
/******/ 			var outdatedModules = [updateModuleId];
/******/ 			var outdatedDependencies = {};
/******/
/******/ 			var queue = outdatedModules.slice().map(function(id) {
/******/ 				return {
/******/ 					chain: [id],
/******/ 					id: id
/******/ 				};
/******/ 			});
/******/ 			while (queue.length > 0) {
/******/ 				var queueItem = queue.pop();
/******/ 				var moduleId = queueItem.id;
/******/ 				var chain = queueItem.chain;
/******/ 				module = installedModules[moduleId];
/******/ 				if (!module || module.hot._selfAccepted) continue;
/******/ 				if (module.hot._selfDeclined) {
/******/ 					return {
/******/ 						type: "self-declined",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				if (module.hot._main) {
/******/ 					return {
/******/ 						type: "unaccepted",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				for (var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if (!parent) continue;
/******/ 					if (parent.hot._declinedDependencies[moduleId]) {
/******/ 						return {
/******/ 							type: "declined",
/******/ 							chain: chain.concat([parentId]),
/******/ 							moduleId: moduleId,
/******/ 							parentId: parentId
/******/ 						};
/******/ 					}
/******/ 					if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 					if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if (!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push({
/******/ 						chain: chain.concat([parentId]),
/******/ 						id: parentId
/******/ 					});
/******/ 				}
/******/ 			}
/******/
/******/ 			return {
/******/ 				type: "accepted",
/******/ 				moduleId: updateModuleId,
/******/ 				outdatedModules: outdatedModules,
/******/ 				outdatedDependencies: outdatedDependencies
/******/ 			};
/******/ 		}
/******/
/******/ 		function addAllToSet(a, b) {
/******/ 			for (var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if (a.indexOf(item) === -1) a.push(item);
/******/ 			}
/******/ 		}
/******/
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/
/******/ 		var warnUnexpectedRequire = function warnUnexpectedRequire() {
/******/ 			console.warn(
/******/ 				"[HMR] unexpected require(" + result.moduleId + ") to disposed module"
/******/ 			);
/******/ 		};
/******/
/******/ 		for (var id in hotUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				moduleId = toModuleId(id);
/******/ 				/** @type {TODO} */
/******/ 				var result;
/******/ 				if (hotUpdate[id]) {
/******/ 					result = getAffectedStuff(moduleId);
/******/ 				} else {
/******/ 					result = {
/******/ 						type: "disposed",
/******/ 						moduleId: id
/******/ 					};
/******/ 				}
/******/ 				/** @type {Error|false} */
/******/ 				var abortError = false;
/******/ 				var doApply = false;
/******/ 				var doDispose = false;
/******/ 				var chainInfo = "";
/******/ 				if (result.chain) {
/******/ 					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 				}
/******/ 				switch (result.type) {
/******/ 					case "self-declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of self decline: " +
/******/ 									result.moduleId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of declined dependency: " +
/******/ 									result.moduleId +
/******/ 									" in " +
/******/ 									result.parentId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "unaccepted":
/******/ 						if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 						if (!options.ignoreUnaccepted)
/******/ 							abortError = new Error(
/******/ 								"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "accepted":
/******/ 						if (options.onAccepted) options.onAccepted(result);
/******/ 						doApply = true;
/******/ 						break;
/******/ 					case "disposed":
/******/ 						if (options.onDisposed) options.onDisposed(result);
/******/ 						doDispose = true;
/******/ 						break;
/******/ 					default:
/******/ 						throw new Error("Unexception type " + result.type);
/******/ 				}
/******/ 				if (abortError) {
/******/ 					hotSetStatus("abort");
/******/ 					return Promise.reject(abortError);
/******/ 				}
/******/ 				if (doApply) {
/******/ 					appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 					addAllToSet(outdatedModules, result.outdatedModules);
/******/ 					for (moduleId in result.outdatedDependencies) {
/******/ 						if (
/******/ 							Object.prototype.hasOwnProperty.call(
/******/ 								result.outdatedDependencies,
/******/ 								moduleId
/******/ 							)
/******/ 						) {
/******/ 							if (!outdatedDependencies[moduleId])
/******/ 								outdatedDependencies[moduleId] = [];
/******/ 							addAllToSet(
/******/ 								outdatedDependencies[moduleId],
/******/ 								result.outdatedDependencies[moduleId]
/******/ 							);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 				if (doDispose) {
/******/ 					addAllToSet(outdatedModules, [result.moduleId]);
/******/ 					appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for (i = 0; i < outdatedModules.length; i++) {
/******/ 			moduleId = outdatedModules[i];
/******/ 			if (
/******/ 				installedModules[moduleId] &&
/******/ 				installedModules[moduleId].hot._selfAccepted
/******/ 			)
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 		}
/******/
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
/******/ 			if (hotAvailableFilesMap[chunkId] === false) {
/******/ 				hotDisposeChunk(chunkId);
/******/ 			}
/******/ 		});
/******/
/******/ 		var idx;
/******/ 		var queue = outdatedModules.slice();
/******/ 		while (queue.length > 0) {
/******/ 			moduleId = queue.pop();
/******/ 			module = installedModules[moduleId];
/******/ 			if (!module) continue;
/******/
/******/ 			var data = {};
/******/
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for (j = 0; j < disposeHandlers.length; j++) {
/******/ 				cb = disposeHandlers[j];
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/
/******/ 			// when disposing there is no need to call dispose handler
/******/ 			delete outdatedDependencies[moduleId];
/******/
/******/ 			// remove "parents" references from all children
/******/ 			for (j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if (!child) continue;
/******/ 				idx = child.parents.indexOf(moduleId);
/******/ 				if (idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// remove outdated dependency from module children
/******/ 		var dependency;
/******/ 		var moduleOutdatedDependencies;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 						dependency = moduleOutdatedDependencies[j];
/******/ 						idx = module.children.indexOf(dependency);
/******/ 						if (idx >= 0) module.children.splice(idx, 1);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Not in "apply" phase
/******/ 		hotSetStatus("apply");
/******/
/******/ 		hotCurrentHash = hotUpdateNewHash;
/******/
/******/ 		// insert new code
/******/ 		for (moduleId in appliedUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					var callbacks = [];
/******/ 					for (i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 						dependency = moduleOutdatedDependencies[i];
/******/ 						cb = module.hot._acceptedDependencies[dependency];
/******/ 						if (cb) {
/******/ 							if (callbacks.indexOf(cb) !== -1) continue;
/******/ 							callbacks.push(cb);
/******/ 						}
/******/ 					}
/******/ 					for (i = 0; i < callbacks.length; i++) {
/******/ 						cb = callbacks[i];
/******/ 						try {
/******/ 							cb(moduleOutdatedDependencies);
/******/ 						} catch (err) {
/******/ 							if (options.onErrored) {
/******/ 								options.onErrored({
/******/ 									type: "accept-errored",
/******/ 									moduleId: moduleId,
/******/ 									dependencyId: moduleOutdatedDependencies[i],
/******/ 									error: err
/******/ 								});
/******/ 							}
/******/ 							if (!options.ignoreErrored) {
/******/ 								if (!error) error = err;
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Load self accepted modules
/******/ 		for (i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch (err) {
/******/ 				if (typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch (err2) {
/******/ 						if (options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "self-accept-error-handler-errored",
/******/ 								moduleId: moduleId,
/******/ 								error: err2,
/******/ 								originalError: err
/******/ 							});
/******/ 						}
/******/ 						if (!options.ignoreErrored) {
/******/ 							if (!error) error = err2;
/******/ 						}
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				} else {
/******/ 					if (options.onErrored) {
/******/ 						options.onErrored({
/******/ 							type: "self-accept-errored",
/******/ 							moduleId: moduleId,
/******/ 							error: err
/******/ 						});
/******/ 					}
/******/ 					if (!options.ignoreErrored) {
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if (error) {
/******/ 			hotSetStatus("fail");
/******/ 			return Promise.reject(error);
/******/ 		}
/******/
/******/ 		hotSetStatus("idle");
/******/ 		return new Promise(function(resolve) {
/******/ 			resolve(outdatedModules);
/******/ 		});
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {},
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire(0)(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./extensions/blocks/contact-info/address/edit.js":
/*!********************************************************!*\
  !*** ./extensions/blocks/contact-info/address/edit.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _classnames = _interopRequireDefault(__webpack_require__(/*! classnames */ \"./extensions/node_modules/classnames/index.js\"));\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/address/save.js\"));\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nclass AddressEdit extends _element.Component {\n  constructor(...args) {\n    super(...args);\n    this.preventEnterKey = this.preventEnterKey.bind(this);\n  }\n\n  preventEnterKey(event) {\n    if (event.key === 'Enter') {\n      event.preventDefault();\n      return;\n    }\n  }\n\n  render() {\n    const {\n      attributes: {\n        address,\n        addressLine2,\n        addressLine3,\n        city,\n        region,\n        postal,\n        country,\n        linkToGoogleMaps\n      },\n      isSelected,\n      setAttributes\n    } = this.props;\n    const hasContent = [address, addressLine2, addressLine3, city, region, postal, country].some(value => value !== '');\n    const classNames = (0, _classnames.default)({\n      'jetpack-address-block': true,\n      'is-selected': isSelected\n    });\n    const externalLink = React.createElement(_components.ToggleControl, {\n      label: (0, _i18n.__)('Link address to Google Maps'),\n      checked: linkToGoogleMaps,\n      onChange: newlinkToGoogleMaps => setAttributes({\n        linkToGoogleMaps: newlinkToGoogleMaps\n      })\n    });\n    return React.createElement(\"div\", {\n      className: classNames\n    }, !isSelected && hasContent && (0, _save.default)(this.props), (isSelected || !hasContent) && React.createElement(_element.Fragment, null, React.createElement(_editor.PlainText, {\n      value: address,\n      placeholder: (0, _i18n.__)('Street Address'),\n      \"aria-label\": (0, _i18n.__)('Street Address'),\n      onChange: newAddress => setAttributes({\n        address: newAddress\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: addressLine2,\n      placeholder: (0, _i18n.__)('Address Line 2'),\n      \"aria-label\": (0, _i18n.__)('Address Line 2'),\n      onChange: newAddressLine2 => setAttributes({\n        addressLine2: newAddressLine2\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: addressLine3,\n      placeholder: (0, _i18n.__)('Address Line 3'),\n      \"aria-label\": (0, _i18n.__)('Address Line 3'),\n      onChange: newAddressLine3 => setAttributes({\n        addressLine3: newAddressLine3\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: city,\n      placeholder: (0, _i18n.__)('City'),\n      \"aria-label\": (0, _i18n.__)('City'),\n      onChange: newCity => setAttributes({\n        city: newCity\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: region,\n      placeholder: (0, _i18n.__)('State/Province/Region'),\n      \"aria-label\": (0, _i18n.__)('State/Province/Region'),\n      onChange: newRegion => setAttributes({\n        region: newRegion\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: postal,\n      placeholder: (0, _i18n.__)('Postal/Zip Code'),\n      \"aria-label\": (0, _i18n.__)('Postal/Zip Code'),\n      onChange: newPostal => setAttributes({\n        postal: newPostal\n      }),\n      onKeyDown: this.preventEnterKey\n    }), React.createElement(_editor.PlainText, {\n      value: country,\n      placeholder: (0, _i18n.__)('Country'),\n      \"aria-label\": (0, _i18n.__)('Country'),\n      onChange: newCountry => setAttributes({\n        country: newCountry\n      }),\n      onKeyDown: this.preventEnterKey\n    }), externalLink));\n  }\n\n}\n\nvar _default = AddressEdit;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/address/edit.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/address/index.js":
/*!*********************************************************!*\
  !*** ./extensions/blocks/contact-info/address/index.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.settings = exports.name = void 0;\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _edit = _interopRequireDefault(__webpack_require__(/*! ./edit */ \"./extensions/blocks/contact-info/address/edit.js\"));\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/address/save.js\"));\n\nvar _renderMaterialIcon = _interopRequireDefault(__webpack_require__(/*! ../../../utils/render-material-icon */ \"./extensions/utils/render-material-icon.jsx\"));\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst attributes = {\n  address: {\n    type: 'string',\n    default: ''\n  },\n  addressLine2: {\n    type: 'string',\n    default: ''\n  },\n  addressLine3: {\n    type: 'string',\n    default: ''\n  },\n  city: {\n    type: 'string',\n    default: ''\n  },\n  region: {\n    type: 'string',\n    default: ''\n  },\n  postal: {\n    type: 'string',\n    default: ''\n  },\n  country: {\n    type: 'string',\n    default: ''\n  },\n  linkToGoogleMaps: {\n    type: 'boolean',\n    default: false\n  }\n};\nconst name = 'address';\nexports.name = name;\nconst settings = {\n  title: (0, _i18n.__)('Address'),\n  description: (0, _i18n.__)('Lets you add a physical address with Schema markup.'),\n  keywords: [(0, _i18n._x)('location', 'block search term'), (0, _i18n._x)('direction', 'block search term'), (0, _i18n._x)('place', 'block search term')],\n  icon: (0, _renderMaterialIcon.default)(React.createElement(_element.Fragment, null, React.createElement(_components.Path, {\n    d: \"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z\"\n  }), React.createElement(_components.Circle, {\n    cx: \"12\",\n    cy: \"9\",\n    r: \"2.5\"\n  }))),\n  category: 'jetpack',\n  attributes,\n  parent: ['jetpack/contact-info'],\n  edit: _edit.default,\n  save: _save.default\n};\nexports.settings = settings;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/address/index.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/address/save.js":
/*!********************************************************!*\
  !*** ./extensions/blocks/contact-info/address/save.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = exports.googleMapsUrl = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst hasAddress = ({\n  address,\n  addressLine2,\n  addressLine3,\n  city,\n  region,\n  postal,\n  country\n}) => {\n  return [address, addressLine2, addressLine3, city, region, postal, country].some(value => value !== '');\n};\n\nconst Address = ({\n  attributes: {\n    address,\n    addressLine2,\n    addressLine3,\n    city,\n    region,\n    postal,\n    country\n  }\n}) => React.createElement(_element.Fragment, null, address && React.createElement(\"div\", {\n  className: \"jetpack-address__address jetpack-address__address1\"\n}, address), addressLine2 && React.createElement(\"div\", {\n  className: \"jetpack-address__address jetpack-address__address2\"\n}, addressLine2), addressLine3 && React.createElement(\"div\", {\n  className: \"jetpack-address__address jetpack-address__address3\"\n}, addressLine3), city && !(region || postal) && React.createElement(\"div\", {\n  className: \"jetpack-address__city\"\n}, city), city && (region || postal) && React.createElement(\"div\", null, [React.createElement(\"span\", {\n  className: \"jetpack-address__city\"\n}, city), ', ', React.createElement(\"span\", {\n  className: \"jetpack-address__region\"\n}, region), ' ', React.createElement(\"span\", {\n  className: \"jetpack-address__postal\"\n}, postal)]), !city && (region || postal) && React.createElement(\"div\", null, [React.createElement(\"span\", {\n  className: \"jetpack-address__region\"\n}, region), ' ', React.createElement(\"span\", {\n  className: \"jetpack-address__postal\"\n}, postal)]), country && React.createElement(\"div\", {\n  className: \"jetpack-address__country\"\n}, country));\n\nconst googleMapsUrl = ({\n  attributes: {\n    address,\n    addressLine2,\n    addressLine3,\n    city,\n    region,\n    postal,\n    country\n  }\n}) => {\n  const addressUrl = address ? `${address},` : '';\n  const addressLine2Url = addressLine2 ? `${addressLine2},` : '';\n  const addressLine3Url = addressLine3 ? `${addressLine3},` : '';\n  const cityUrl = city ? `+${city},` : '';\n  let regionUrl = region ? `+${region},` : '';\n  regionUrl = postal ? `${regionUrl}+${postal}` : regionUrl;\n  const countryUrl = country ? `+${country}` : '';\n  return `https://www.google.com/maps/search/${addressUrl}${addressLine2Url}${addressLine3Url}${cityUrl}${regionUrl}${countryUrl}`.replace(' ', '+');\n};\n\nexports.googleMapsUrl = googleMapsUrl;\n\nconst save = props => hasAddress(props.attributes) && React.createElement(\"div\", {\n  className: props.className\n}, props.attributes.linkToGoogleMaps && React.createElement(\"a\", {\n  href: googleMapsUrl(props),\n  target: \"_blank\",\n  rel: \"noopener noreferrer\",\n  title: (0, _i18n.__)('Open address in Google Maps')\n}, React.createElement(Address, props)), !props.attributes.linkToGoogleMaps && React.createElement(Address, props));\n\nvar _default = save;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/address/save.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/edit.js":
/*!************************************************!*\
  !*** ./extensions/blocks/contact-info/edit.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _classnames = _interopRequireDefault(__webpack_require__(/*! classnames */ \"./extensions/node_modules/classnames/index.js\"));\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst ALLOWED_BLOCKS = ['jetpack/markdown', 'jetpack/address', 'jetpack/email', 'jetpack/phone', 'jetpack/map', 'jetpack/business-hours', 'core/paragraph', 'core/image', 'core/heading', 'core/gallery', 'core/list', 'core/quote', 'core/shortcode', 'core/audio', 'core/code', 'core/cover', 'core/html', 'core/separator', 'core/spacer', 'core/subhead', 'core/video'];\nconst TEMPLATE = [['jetpack/email'], ['jetpack/phone'], ['jetpack/address']];\n\nconst ContactInfoEdit = props => {\n  const {\n    attributes: {},\n    isSelected\n  } = props;\n  return React.createElement(\"div\", {\n    className: (0, _classnames.default)({\n      'jetpack-contact-info-block': true,\n      'is-selected': isSelected\n    })\n  }, React.createElement(_editor.InnerBlocks, {\n    allowedBlocks: ALLOWED_BLOCKS,\n    templateLock: false,\n    template: TEMPLATE\n  }));\n};\n\nvar _default = ContactInfoEdit;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/edit.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/editor.js":
/*!**************************************************!*\
  !*** ./extensions/blocks/contact-info/editor.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _registerJetpackBlock = _interopRequireDefault(__webpack_require__(/*! ../../utils/register-jetpack-block */ \"./extensions/utils/register-jetpack-block.js\"));\n\nvar _ = __webpack_require__(/*! . */ \"./extensions/blocks/contact-info/index.js\");\n\n/**\n * Internal dependencies\n */\n(0, _registerJetpackBlock.default)(_.name, _.settings, _.childBlocks);\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/editor.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/editor.scss":
/*!****************************************************!*\
  !*** ./extensions/blocks/contact-info/editor.scss ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("throw new Error(\"Module build failed (from ../wp-calypso/packages/calypso-build/node_modules/mini-css-extract-plugin-with-rtl/dist/loader.js):\\nModuleBuildError: Module build failed (from ../wp-calypso/packages/calypso-build/node_modules/postcss-loader/src/index.js):\\nError: Loading PostCSS Plugin failed: Cannot find module 'postcss-custom-properties'\\n\\n(@/Users/miguel/dev/wp-calypso/packages/calypso-build/postcss.config.js)\\n    at load (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:27:13)\\n    at Object.keys.filter.map (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:53:16)\\n    at Array.map (<anonymous>)\\n    at plugins (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:52:8)\\n    at config.load.then (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/index.js:72:18)\\n    at runLoaders (/Users/miguel/dev/jetpack/extensions/node_modules/webpack/lib/NormalModule.js:301:20)\\n    at /Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:367:11\\n    at /Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:233:18\\n    at context.callback (/Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:111:13)\\n    at Promise.resolve.then.then.catch (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-loader/src/index.js:208:9)\");\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/editor.scss?");

/***/ }),

/***/ "./extensions/blocks/contact-info/email/edit.js":
/*!******************************************************!*\
  !*** ./extensions/blocks/contact-info/email/edit.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/email/save.js\"));\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\nvar _simpleInput = _interopRequireDefault(__webpack_require__(/*! ../../../utils/simple-input */ \"./extensions/utils/simple-input.js\"));\n\n/**\n * Internal dependencies\n */\nconst EmailEdit = props => {\n  const {\n    setAttributes\n  } = props;\n  return (0, _simpleInput.default)('email', props, (0, _i18n.__)('Email'), _save.default, nextValue => setAttributes({\n    email: nextValue\n  }));\n};\n\nvar _default = EmailEdit;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/email/edit.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/email/index.js":
/*!*******************************************************!*\
  !*** ./extensions/blocks/contact-info/email/index.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.settings = exports.name = void 0;\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _edit = _interopRequireDefault(__webpack_require__(/*! ./edit */ \"./extensions/blocks/contact-info/email/edit.js\"));\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/email/save.js\"));\n\nvar _renderMaterialIcon = _interopRequireDefault(__webpack_require__(/*! ../../../utils/render-material-icon */ \"./extensions/utils/render-material-icon.jsx\"));\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst attributes = {\n  email: {\n    type: 'string',\n    default: ''\n  }\n};\nconst name = 'email';\nexports.name = name;\nconst settings = {\n  title: (0, _i18n.__)('Email Address'),\n  description: (0, _i18n.__)('Lets you add an email address with an automatically generated click-to-email link.'),\n  keywords: ['e-mail', // not translatable on purpose\n  'email', // not translatable on purpose\n  (0, _i18n._x)('message', 'block search term')],\n  icon: (0, _renderMaterialIcon.default)(React.createElement(_components.Path, {\n    d: \"M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z\"\n  })),\n  category: 'jetpack',\n  attributes,\n  edit: _edit.default,\n  save: _save.default,\n  parent: ['jetpack/contact-info']\n};\nexports.settings = settings;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/email/index.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/email/save.js":
/*!******************************************************!*\
  !*** ./extensions/blocks/contact-info/email/save.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _emailValidator = _interopRequireDefault(__webpack_require__(/*! email-validator */ \"./extensions/node_modules/email-validator/index.js\"));\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\n/**\n * External dependencies\n */\nconst renderEmail = inputText => {\n  const explodedInput = inputText.split(/(\\s+)/).map((email, i) => {\n    // Remove and punctuation from the end of the email address.\n    const emailToValidate = email.replace(/([.,\\/#!$%\\^&\\*;:{}=\\-_`~()\\]\\[])+$/g, '');\n\n    if (email.indexOf('@') && _emailValidator.default.validate(emailToValidate)) {\n      return email === emailToValidate ? // Email.\n      React.createElement(\"a\", {\n        href: `mailto:${email}`,\n        key: i\n      }, email) : // Email with punctionation.\n      React.createElement(_element.Fragment, {\n        key: i\n      }, React.createElement(\"a\", {\n        href: `mailto:${email}`,\n        key: i\n      }, emailToValidate), React.createElement(_element.Fragment, null, email.slice(-(email.length - emailToValidate.length))));\n    } // Just a plain string.\n\n\n    return React.createElement(_element.Fragment, {\n      key: i\n    }, email);\n  });\n  return explodedInput;\n};\n\nconst save = ({\n  attributes: {\n    email\n  },\n  className\n}) => email && React.createElement(\"div\", {\n  className: className\n}, renderEmail(email));\n\nvar _default = save;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/email/save.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/index.js":
/*!*************************************************!*\
  !*** ./extensions/blocks/contact-info/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.childBlocks = exports.settings = exports.name = void 0;\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _edit = _interopRequireDefault(__webpack_require__(/*! ./edit */ \"./extensions/blocks/contact-info/edit.js\"));\n\nvar _renderMaterialIcon = _interopRequireDefault(__webpack_require__(/*! ../../utils/render-material-icon */ \"./extensions/utils/render-material-icon.jsx\"));\n\nvar _i18n = __webpack_require__(/*! ../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\n__webpack_require__(/*! ./editor.scss */ \"./extensions/blocks/contact-info/editor.scss\");\n\n__webpack_require__(/*! ./style.scss */ \"./extensions/blocks/contact-info/style.scss\");\n\nvar _address = __webpack_require__(/*! ./address/ */ \"./extensions/blocks/contact-info/address/index.js\");\n\nvar _email = __webpack_require__(/*! ./email/ */ \"./extensions/blocks/contact-info/email/index.js\");\n\nvar _phone = __webpack_require__(/*! ./phone/ */ \"./extensions/blocks/contact-info/phone/index.js\");\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst attributes = {};\n\nconst save = ({\n  className\n}) => React.createElement(\"div\", {\n  className: className\n}, React.createElement(_editor.InnerBlocks.Content, null));\n\nconst name = 'contact-info';\nexports.name = name;\nconst settings = {\n  title: (0, _i18n.__)('Contact Info'),\n  description: (0, _i18n.__)('Lets you add an email address, phone number, and physical address with improved markup for better SEO results.'),\n  keywords: [(0, _i18n._x)('email', 'block search term'), (0, _i18n._x)('phone', 'block search term'), (0, _i18n._x)('address', 'block search term')],\n  icon: (0, _renderMaterialIcon.default)(React.createElement(_components.Path, {\n    d: \"M19 5v14H5V5h14m0-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 10H6v-1.53c0-2.5 3.97-3.58 6-3.58s6 1.08 6 3.58V18zm-9.69-2h7.38c-.69-.56-2.38-1.12-3.69-1.12s-3.01.56-3.69 1.12z\"\n  })),\n  category: 'jetpack',\n  supports: {\n    align: ['wide', 'full'],\n    html: false\n  },\n  attributes,\n  edit: _edit.default,\n  save\n};\nexports.settings = settings;\nconst childBlocks = [{\n  name: _address.name,\n  settings: _address.settings\n}, {\n  name: _email.name,\n  settings: _email.settings\n}, {\n  name: _phone.name,\n  settings: _phone.settings\n}];\nexports.childBlocks = childBlocks;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/index.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/phone/edit.js":
/*!******************************************************!*\
  !*** ./extensions/blocks/contact-info/phone/edit.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/phone/save.js\"));\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\nvar _simpleInput = _interopRequireDefault(__webpack_require__(/*! ../../../utils/simple-input */ \"./extensions/utils/simple-input.js\"));\n\n/**\n * Internal dependencies\n */\nconst PhoneEdit = props => {\n  const {\n    setAttributes\n  } = props;\n  return (0, _simpleInput.default)('phone', props, (0, _i18n.__)('Phone number'), _save.default, nextValue => setAttributes({\n    phone: nextValue\n  }));\n};\n\nvar _default = PhoneEdit;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/phone/edit.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/phone/index.js":
/*!*******************************************************!*\
  !*** ./extensions/blocks/contact-info/phone/index.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.settings = exports.name = void 0;\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _edit = _interopRequireDefault(__webpack_require__(/*! ./edit */ \"./extensions/blocks/contact-info/phone/edit.js\"));\n\nvar _save = _interopRequireDefault(__webpack_require__(/*! ./save */ \"./extensions/blocks/contact-info/phone/save.js\"));\n\nvar _renderMaterialIcon = _interopRequireDefault(__webpack_require__(/*! ../../../utils/render-material-icon */ \"./extensions/utils/render-material-icon.jsx\"));\n\nvar _i18n = __webpack_require__(/*! ../../../utils/i18n */ \"./extensions/utils/i18n.js\");\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nconst attributes = {\n  phone: {\n    type: 'string',\n    default: ''\n  }\n};\nconst name = 'phone';\nexports.name = name;\nconst settings = {\n  title: (0, _i18n.__)('Phone Number'),\n  description: (0, _i18n.__)('Lets you add a phone number with an automatically generated click-to-call link.'),\n  keywords: [(0, _i18n._x)('mobile', 'block search term'), (0, _i18n._x)('telephone', 'block search term'), (0, _i18n._x)('cell', 'block search term')],\n  icon: (0, _renderMaterialIcon.default)(React.createElement(_components.Path, {\n    d: \"M6.54 5c.06.89.21 1.76.45 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79h1.51m9.86 12.02c.85.24 1.72.39 2.6.45v1.49c-1.32-.09-2.59-.35-3.8-.75l1.2-1.19M7.5 3H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.49c0-.55-.45-1-1-1-1.24 0-2.45-.2-3.57-.57-.1-.04-.21-.05-.31-.05-.26 0-.51.1-.71.29l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1z\"\n  })),\n  category: 'jetpack',\n  attributes,\n  parent: ['jetpack/contact-info'],\n  edit: _edit.default,\n  save: _save.default\n};\nexports.settings = settings;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/phone/index.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/phone/save.js":
/*!******************************************************!*\
  !*** ./extensions/blocks/contact-info/phone/save.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.renderPhone = renderPhone;\nexports.default = void 0;\n\n/**\n * Internal dependencies\n */\nfunction renderPhone(inputText) {\n  const arrayOfNumbers = inputText.match(/\\d+\\.\\d+|\\d+\\b|\\d+(?=\\w)/g);\n\n  if (!arrayOfNumbers) {\n    // No numbers found\n    return inputText;\n  }\n\n  const indexOfFirstNumber = inputText.indexOf(arrayOfNumbers[0]); // Assume that eveything after the first number should be part of the phone number.\n  // care about the first prefix character.\n\n  let phoneNumber = indexOfFirstNumber ? inputText.substring(indexOfFirstNumber - 1) : inputText;\n  let prefix = indexOfFirstNumber ? inputText.substring(0, indexOfFirstNumber) : '';\n  let justNumber = phoneNumber.replace(/\\D/g, ''); // Phone numbers starting with + should be part of the number.\n\n  if (/[0-9/+/(]/.test(phoneNumber[0])) {\n    // Remove the special character from the prefix so they don't appear twice.\n    prefix = prefix.slice(0, -1); // Phone numbers starting with + shoud be part of the number.\n\n    if (phoneNumber[0] === '+') {\n      justNumber = '+' + justNumber;\n    }\n  } else {\n    // Remove the first character.\n    phoneNumber = phoneNumber.substring(1);\n  }\n\n  const prefixSpan = prefix.trim() ? React.createElement(\"span\", {\n    key: \"phonePrefix\",\n    className: \"phone-prefix\"\n  }, prefix) : null;\n  return [prefixSpan, React.createElement(\"a\", {\n    key: \"phoneNumber\",\n    href: `tel:${justNumber}`\n  }, phoneNumber)];\n}\n\nconst save = ({\n  attributes: {\n    phone\n  },\n  className\n}) => phone && React.createElement(\"div\", {\n  className: className\n}, renderPhone(phone));\n\nvar _default = save;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/phone/save.js?");

/***/ }),

/***/ "./extensions/blocks/contact-info/style.scss":
/*!***************************************************!*\
  !*** ./extensions/blocks/contact-info/style.scss ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("throw new Error(\"Module build failed (from ../wp-calypso/packages/calypso-build/node_modules/mini-css-extract-plugin-with-rtl/dist/loader.js):\\nModuleBuildError: Module build failed (from ../wp-calypso/packages/calypso-build/node_modules/postcss-loader/src/index.js):\\nError: Loading PostCSS Plugin failed: Cannot find module 'postcss-custom-properties'\\n\\n(@/Users/miguel/dev/wp-calypso/packages/calypso-build/postcss.config.js)\\n    at load (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:27:13)\\n    at Object.keys.filter.map (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:53:16)\\n    at Array.map (<anonymous>)\\n    at plugins (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/plugins.js:52:8)\\n    at config.load.then (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-load-config/src/index.js:72:18)\\n    at runLoaders (/Users/miguel/dev/jetpack/extensions/node_modules/webpack/lib/NormalModule.js:301:20)\\n    at /Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:367:11\\n    at /Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:233:18\\n    at context.callback (/Users/miguel/dev/jetpack/extensions/node_modules/loader-runner/lib/LoaderRunner.js:111:13)\\n    at Promise.resolve.then.then.catch (/Users/miguel/dev/wp-calypso/packages/calypso-build/node_modules/postcss-loader/src/index.js:208:9)\");\n\n//# sourceURL=webpack:///./extensions/blocks/contact-info/style.scss?");

/***/ }),

/***/ "./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js":
/*!*********************************************************************************!*\
  !*** ./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _interopRequireDefault(obj) {\n  return obj && obj.__esModule ? obj : {\n    default: obj\n  };\n}\n\nmodule.exports = _interopRequireDefault;\n\n//# sourceURL=webpack:///./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js?");

/***/ }),

/***/ "./extensions/node_modules/classnames/index.js":
/*!*****************************************************!*\
  !*** ./extensions/node_modules/classnames/index.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!\n  Copyright (c) 2017 Jed Watson.\n  Licensed under the MIT License (MIT), see\n  http://jedwatson.github.io/classnames\n*/\n/* global define */\n\n(function () {\n\t'use strict';\n\n\tvar hasOwn = {}.hasOwnProperty;\n\n\tfunction classNames () {\n\t\tvar classes = [];\n\n\t\tfor (var i = 0; i < arguments.length; i++) {\n\t\t\tvar arg = arguments[i];\n\t\t\tif (!arg) continue;\n\n\t\t\tvar argType = typeof arg;\n\n\t\t\tif (argType === 'string' || argType === 'number') {\n\t\t\t\tclasses.push(arg);\n\t\t\t} else if (Array.isArray(arg) && arg.length) {\n\t\t\t\tvar inner = classNames.apply(null, arg);\n\t\t\t\tif (inner) {\n\t\t\t\t\tclasses.push(inner);\n\t\t\t\t}\n\t\t\t} else if (argType === 'object') {\n\t\t\t\tfor (var key in arg) {\n\t\t\t\t\tif (hasOwn.call(arg, key) && arg[key]) {\n\t\t\t\t\t\tclasses.push(key);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\treturn classes.join(' ');\n\t}\n\n\tif ( true && module.exports) {\n\t\tclassNames.default = classNames;\n\t\tmodule.exports = classNames;\n\t} else if (true) {\n\t\t// register as 'classnames', consistent with npm package name\n\t\t!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {\n\t\t\treturn classNames;\n\t\t}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),\n\t\t\t\t__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));\n\t} else {}\n}());\n\n\n//# sourceURL=webpack:///./extensions/node_modules/classnames/index.js?");

/***/ }),

/***/ "./extensions/node_modules/email-validator/index.js":
/*!**********************************************************!*\
  !*** ./extensions/node_modules/email-validator/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\n\r\nvar tester = /^[-!#$%&'*+\\/0-9=?A-Z^_a-z{|}~](\\.?[-!#$%&'*+\\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\\.?[a-zA-Z0-9])*\\.[a-zA-Z](-?[a-zA-Z0-9])+$/;\r\n// Thanks to:\r\n// http://fightingforalostcause.net/misc/2006/compare-email-regex.php\r\n// http://thedailywtf.com/Articles/Validating_Email_Addresses.aspx\r\n// http://stackoverflow.com/questions/201323/what-is-the-best-regular-expression-for-validating-email-addresses/201378#201378\r\nexports.validate = function(email)\r\n{\r\n\tif (!email)\r\n\t\treturn false;\r\n\t\t\r\n\tif(email.length>254)\r\n\t\treturn false;\r\n\r\n\tvar valid = tester.test(email);\r\n\tif(!valid)\r\n\t\treturn false;\r\n\r\n\t// Further checking of some things regex can't handle\r\n\tvar parts = email.split(\"@\");\r\n\tif(parts[0].length>64)\r\n\t\treturn false;\r\n\r\n\tvar domainParts = parts[1].split(\".\");\r\n\tif(domainParts.some(function(part) { return part.length>63; }))\r\n\t\treturn false;\r\n\r\n\treturn true;\r\n}\n\n//# sourceURL=webpack:///./extensions/node_modules/email-validator/index.js?");

/***/ }),

/***/ "./extensions/preset/index.json":
/*!**************************************!*\
  !*** ./extensions/preset/index.json ***!
  \**************************************/
/*! exports provided: production, beta, default */
/***/ (function(module) {

eval("module.exports = {\"production\":[\"contact-info\"],\"beta\":[]};\n\n//# sourceURL=webpack:///./extensions/preset/index.json?");

/***/ }),

/***/ "./extensions/utils/get-jetpack-data.js":
/*!**********************************************!*\
  !*** ./extensions/utils/get-jetpack-data.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = getJetpackData;\nexports.JETPACK_DATA_PATH = void 0;\n\nvar _lodash = __webpack_require__(/*! lodash */ \"lodash\");\n\n/**\n * External Dependencies\n */\nconst JETPACK_DATA_PATH = 'Jetpack_Editor_Initial_State';\nexports.JETPACK_DATA_PATH = JETPACK_DATA_PATH;\n\nfunction getJetpackData() {\n  return (0, _lodash.get)('object' === typeof window ? window : null, [JETPACK_DATA_PATH], null);\n}\n\n//# sourceURL=webpack:///./extensions/utils/get-jetpack-data.js?");

/***/ }),

/***/ "./extensions/utils/get-jetpack-extension-availability.js":
/*!****************************************************************!*\
  !*** ./extensions/utils/get-jetpack-extension-availability.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = getJetpackExtensionAvailability;\n\nvar _lodash = __webpack_require__(/*! lodash */ \"lodash\");\n\nvar _index = _interopRequireDefault(__webpack_require__(/*! ../preset/index.json */ \"./extensions/preset/index.json\"));\n\nvar _getJetpackData = _interopRequireDefault(__webpack_require__(/*! ./get-jetpack-data */ \"./extensions/utils/get-jetpack-data.js\"));\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\n\n/**\n * Return whether a Jetpack Gutenberg extension is available or not.\n *\n * Defaults to `false` for production blocks, and to `true` for beta blocks.\n * This is to make it easier for folks to write their first block without needing\n * to touch the server side.\n *\n * @param {string} name The extension's name (without the `jetpack/` prefix)\n * @returns {object} Object indicating if the extension is available (property `available`) and the reason why it is\n * unavailable (property `unavailable_reason`).\n */\nfunction getJetpackExtensionAvailability(name) {\n  const data = (0, _getJetpackData.default)();\n  const defaultAvailability = (0, _lodash.includes)(_index.default.beta, name);\n  const available = (0, _lodash.get)(data, ['available_blocks', name, 'available'], defaultAvailability);\n  const unavailableReason = (0, _lodash.get)(data, ['available_blocks', name, 'unavailable_reason'], 'unknown');\n  return {\n    available,\n    ...(!available && {\n      unavailableReason\n    })\n  };\n}\n\n//# sourceURL=webpack:///./extensions/utils/get-jetpack-extension-availability.js?");

/***/ }),

/***/ "./extensions/utils/i18n.js":
/*!**********************************!*\
  !*** ./extensions/utils/i18n.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.__ = __;\nexports._n = _n;\nexports._x = _x;\nexports._nx = _nx;\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/**\n * This contains a set of wrappers for all the @wordpress/i18n localization functions.\n * Each of the wrappers has the same signature like the original corresponding function,\n * but without the textdomain at the end.\n *\n * The wrappers are necessary because we'd like to reuse i18n-calypso provided translations\n * for our Gutenberg blocks, but we'd also like to not include i18n-calypso in block bundles.\n * Instead, we use @wordpress/i18n, but it requires a textdomain in order to know where\n * to look for the translations.\n *\n * In the same time, we use those blocks in Jetpack, and in order to be able to index the\n * translations there without issues, the localization function calls in the source code\n * must not contain a textdomain.\n */\n\n/**\n * External dependencies\n */\n\n/**\n * Module variables\n */\nconst TEXTDOMAIN = 'jetpack';\n/**\n * Add a textdomain to arguments of a localization function call.\n *\n * @param {Array} originalArgs Arguments that the localization function was called with.\n *\n * @return {Array} Arguments, with textdomain added as the last one.\n */\n\nconst addTextdomain = originalArgs => {\n  const args = [...originalArgs];\n  args.push(TEXTDOMAIN);\n  return args;\n};\n/**\n * Retrieve the translation of text.\n *\n * @see https://developer.wordpress.org/reference/functions/__/\n *\n * @param {string}  text   Text to translate.\n * @param {?string} domain Domain to retrieve the translated text.\n *\n * @return {string} Translated text.\n */\n\n\nfunction __() {\n  return (0, _i18n.__)(...addTextdomain(arguments));\n}\n/**\n * Translates and retrieves the singular or plural form based on the supplied\n * number.\n *\n * @see https://developer.wordpress.org/reference/functions/_n/\n *\n * @param {string}  single The text to be used if the number is singular.\n * @param {string}  plural The text to be used if the number is plural.\n * @param {number}  number The number to compare against to use either the\n *                         singular or plural form.\n * @param {?string} domain Domain to retrieve the translated text.\n *\n * @return {string} The translated singular or plural form.\n */\n\n\nfunction _n() {\n  return (0, _i18n._n)(...addTextdomain(arguments));\n}\n/**\n * Retrieve translated string with gettext context.\n *\n * @see https://developer.wordpress.org/reference/functions/_x/\n *\n * @param {string}  text    Text to translate.\n * @param {string}  context Context information for the translators.\n * @param {?string} domain  Domain to retrieve the translated text.\n *\n * @return {string} Translated context string without pipe.\n */\n\n\nfunction _x() {\n  return (0, _i18n._x)(...addTextdomain(arguments));\n}\n/**\n * Translates and retrieves the singular or plural form based on the supplied\n * number, with gettext context.\n *\n * @see https://developer.wordpress.org/reference/functions/_nx/\n *\n * @param {string}  single  The text to be used if the number is singular.\n * @param {string}  plural  The text to be used if the number is plural.\n * @param {number}  number  The number to compare against to use either the\n *                          singular or plural form.\n * @param {string}  context Context information for the translators.\n * @param {?string} domain  Domain to retrieve the translated text.\n *\n * @return {string} The translated singular or plural form.\n */\n\n\nfunction _nx() {\n  return (0, _i18n._nx)(...addTextdomain(arguments));\n}\n\n//# sourceURL=webpack:///./extensions/utils/i18n.js?");

/***/ }),

/***/ "./extensions/utils/register-jetpack-block.js":
/*!****************************************************!*\
  !*** ./extensions/utils/register-jetpack-block.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./extensions/node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = registerJetpackBlock;\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _getJetpackExtensionAvailability = _interopRequireDefault(__webpack_require__(/*! ./get-jetpack-extension-availability */ \"./extensions/utils/get-jetpack-extension-availability.js\"));\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\n\n/**\n * Registers a gutenberg block if the availability requirements are met.\n *\n * @param {string} name The block's name.\n * @param {object} settings The block's settings.\n * @param {object} childBlocks The block's child blocks.\n * @returns {object|false} Either false if the block is not available, or the results of `registerBlockType`\n */\nfunction registerJetpackBlock(name, settings, childBlocks = []) {\n  const {\n    available,\n    unavailableReason\n  } = (0, _getJetpackExtensionAvailability.default)(name);\n  const unavailable = !available;\n\n  if (unavailable) {\n    if ('production' !== {\"npm_config_save_dev\":\"\",\"npm_config_legacy_bundling\":\"\",\"npm_config_dry_run\":\"\",\"GREP_COLOR\":\"37;45\",\"npm_config_viewer\":\"man\",\"npm_config_only\":\"\",\"npm_config_commit_hooks\":\"true\",\"npm_config_browser\":\"\",\"npm_package_dependencies_gridicons\":\"^3.1.1\",\"npm_config_also\":\"\",\"LESS_TERMCAP_mb\":\"\\u001b[01;31m\",\"npm_config_sign_git_commit\":\"\",\"npm_config_rollback\":\"true\",\"npm_package_dependencies__wordpress_url\":\"^2.3.3\",\"TERM_PROGRAM\":\"Apple_Terminal\",\"NODE\":\"/Users/miguel/.nvm/versions/node/v10.15.2/bin/node\",\"npm_config_usage\":\"\",\"npm_config_audit\":\"true\",\"npm_package_dependencies__wordpress_components\":\"^7.0.8\",\"LESS_TERMCAP_md\":\"\\u001b[01;31m\",\"INIT_CWD\":\"/Users/miguel/dev/jetpack/extensions\",\"npm_package_homepage\":\"https://github.com/Automattic/wp-calypso/tree/master/packages/jetpack-blocks#readme\",\"npm_package_devDependencies_enzyme_to_json\":\"^3.3.5\",\"NVM_CD_FLAGS\":\"-q\",\"LESS_TERMCAP_me\":\"\\u001b[0m\",\"npm_config_globalignorefile\":\"/Users/miguel/.nvm/versions/node/v10.15.2/etc/npmignore\",\"npm_package_dependencies__wordpress_token_list\":\"^1.1.0\",\"TERM\":\"xterm-256color\",\"SHELL\":\"/bin/zsh\",\"npm_config_shell\":\"/bin/zsh\",\"npm_config_maxsockets\":\"50\",\"npm_config_init_author_url\":\"\",\"npm_config_shrinkwrap\":\"true\",\"npm_config_parseable\":\"\",\"npm_config_metrics_registry\":\"https://registry.npmjs.org/\",\"TMPDIR\":\"/var/folders/5p/kt34cz6s19v4nmchh433hh1m0000gn/T/\",\"npm_config_timing\":\"\",\"npm_config_init_license\":\"ISC\",\"Apple_PubSub_Socket_Render\":\"/private/tmp/com.apple.launchd.Ekuly9vgYe/Render\",\"npm_config_if_present\":\"\",\"npm_package_dependencies__wordpress_blocks\":\"^6.0.7\",\"TERM_PROGRAM_VERSION\":\"421.1\",\"npm_package_dependencies_cookie\":\"^0.3.1\",\"npm_config_sign_git_tag\":\"\",\"npm_config_init_author_email\":\"\",\"npm_config_cache_max\":\"Infinity\",\"npm_package_scripts_prepublishOnly\":\"npm run clean; NODE_ENV=production npm run build\",\"npm_config_preid\":\"\",\"npm_config_long\":\"\",\"npm_config_local_address\":\"\",\"npm_config_git_tag_version\":\"true\",\"npm_config_cert\":\"\",\"LESS_TERMCAP_ue\":\"\\u001b[0m\",\"TERM_SESSION_ID\":\"C49489E7-7DCE-4251-A11D-C9AB2B1D9950\",\"npm_config_registry\":\"https://registry.npmjs.org/\",\"npm_config_noproxy\":\"\",\"npm_config_fetch_retries\":\"2\",\"npm_package_repository_url\":\"git+https://github.com/Automattic/wp-calypso.git\",\"npm_config_versions\":\"\",\"npm_config_message\":\"%s\",\"npm_config_key\":\"\",\"npm_package_readmeFilename\":\"README.md\",\"npm_package_dependencies__wordpress_element\":\"^2.1.9\",\"npm_package_devDependencies_webpack\":\"^4.29.6\",\"npm_package_devDependencies_react\":\"^16.8.3\",\"npm_package_description\":\"Gutenberg blocks for the Jetpack WordPress plugin\",\"NVM_DIR\":\"/Users/miguel/.nvm\",\"USER\":\"miguel\",\"npm_package_license\":\"GPL-2.0+\",\"npm_package_devDependencies_enzyme_adapter_react_16\":\"^1.9.1\",\"LS_COLORS\":\"di=34:ln=35:so=32:pi=33:ex=31:bd=36;01:cd=33;01:su=31;40;07:sg=36;40;07:tw=32;40;07:ow=33;40;07:\",\"GREP_COLORS\":\"mt=37;45\",\"npm_config_globalconfig\":\"/Users/miguel/.nvm/versions/node/v10.15.2/etc/npmrc\",\"npm_package_dependencies__wordpress_i18n\":\"^3.1.1\",\"npm_package_dependencies__wordpress_hooks\":\"^2.0.5\",\"npm_config_prefer_online\":\"\",\"npm_config_logs_max\":\"10\",\"npm_config_always_auth\":\"\",\"npm_package_dependencies_lodash\":\"^4.17.11\",\"SSH_AUTH_SOCK\":\"/private/tmp/com.apple.launchd.FNvlIO8pwi/Listeners\",\"__CF_USER_TEXT_ENCODING\":\"0x1F5:0x0:0x0\",\"npm_execpath\":\"/Users/miguel/.nvm/versions/node/v10.15.2/lib/node_modules/npm/bin/npm-cli.js\",\"npm_config_global_style\":\"\",\"npm_config_cache_lock_retries\":\"10\",\"npm_config_update_notifier\":\"true\",\"npm_config_cafile\":\"\",\"PAGER\":\"less\",\"npm_package_author_name\":\"Automattic\",\"npm_config_heading\":\"npm\",\"npm_config_audit_level\":\"low\",\"npm_package_devDependencies_copy_webpack_plugin\":\"^4.6.0\",\"npm_package_dependencies__wordpress_editor\":\"^9.0.11\",\"LSCOLORS\":\"exfxcxdxbxGxDxabagacad\",\"LESS_TERMCAP_us\":\"\\u001b[01;32m\",\"npm_config_searchlimit\":\"20\",\"npm_config_read_only\":\"\",\"npm_config_offline\":\"\",\"npm_config_fetch_retry_mintimeout\":\"10000\",\"npm_config_json\":\"\",\"npm_config_access\":\"\",\"npm_config_argv\":\"{\\\"remain\\\":[],\\\"cooked\\\":[\\\"run\\\",\\\"build\\\"],\\\"original\\\":[\\\"run\\\",\\\"build\\\"]}\",\"npm_package_dependencies_swiper\":\"4.4.6\",\"PATH\":\"/Users/miguel/.nvm/versions/node/v10.15.2/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/Users/miguel/dev/jetpack/extensions/node_modules/.bin:/Users/miguel/.nvm/versions/node/v10.15.2/bin:/Library/Frameworks/Python.framework/Versions/3.6/bin:/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin\",\"npm_config_allow_same_version\":\"\",\"npm_package_dependencies_markdown_it\":\"8.4.2\",\"npm_config_https_proxy\":\"\",\"npm_config_engine_strict\":\"\",\"npm_config_description\":\"true\",\"_\":\"/Users/miguel/.nvm/versions/node/v10.15.2/bin/node\",\"npm_config_userconfig\":\"/Users/miguel/.npmrc\",\"npm_config_init_module\":\"/Users/miguel/.npm-init.js\",\"npm_package_keywords_4\":\"wordpress\",\"npm_package_dependencies_resize_observer_polyfill\":\"^1.5.1\",\"npm_config_cidr\":\"\",\"PWD\":\"/Users/miguel/dev/jetpack/extensions\",\"npm_config_user\":\"501\",\"npm_config_node_version\":\"10.15.2\",\"npm_package_bugs_url\":\"https://github.com/Automattic/wp-calypso/issues?q=issue+label%3AJetpack+label%3A%22%5BGoal%5D+Gutenberg%22+is%3Aopen\",\"npm_lifecycle_event\":\"build\",\"EDITOR\":\"nano\",\"npm_config_save\":\"true\",\"npm_config_ignore_prepublish\":\"\",\"npm_config_editor\":\"nano\",\"npm_config_auth_type\":\"legacy\",\"npm_package_keywords_0\":\"blocks\",\"npm_package_repository_type\":\"git\",\"npm_package_dependencies_email_validator\":\"^2.0.4\",\"npm_package_name\":\"@automattic/jetpack-blocks\",\"LANG\":\"en_US.UTF-8\",\"npm_config_tag\":\"latest\",\"npm_config_script_shell\":\"\",\"npm_package_keywords_1\":\"extensions\",\"npm_package_dependencies__wordpress_keycodes\":\"^2.0.6\",\"npm_config_progress\":\"true\",\"npm_config_global\":\"\",\"npm_package_keywords_2\":\"gutenberg\",\"npm_package_scripts_build\":\"node bin/build.js\",\"npm_config_searchstaleness\":\"900\",\"npm_config_optional\":\"true\",\"npm_config_ham_it_up\":\"\",\"npm_package_keywords_3\":\"jetpack\",\"npm_package_dependencies_photon\":\"^2.0.1\",\"npm_package_dependencies__automattic_format_currency\":\"1.0.0\",\"XPC_FLAGS\":\"0x0\",\"npm_config_save_prod\":\"\",\"npm_config_force\":\"\",\"npm_config_bin_links\":\"true\",\"npm_package_devDependencies_enzyme\":\"^3.9.0\",\"npm_package_dependencies_refx\":\"^3.1.1\",\"npm_config_searchopts\":\"\",\"npm_package_dependencies_classnames\":\"^2.2.6\",\"npm_config_node_gyp\":\"/Users/miguel/.nvm/versions/node/v10.15.2/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js\",\"npm_config_depth\":\"Infinity\",\"npm_package_main\":\"dist/editor.js\",\"npm_config_sso_poll_frequency\":\"500\",\"npm_config_rebuild_bundle\":\"true\",\"npm_package_version\":\"13.1.1\",\"XPC_SERVICE_NAME\":\"0\",\"npm_config_unicode\":\"true\",\"HOME\":\"/Users/miguel\",\"SHLVL\":\"2\",\"npm_config_fetch_retry_maxtimeout\":\"60000\",\"npm_config_tag_version_prefix\":\"v\",\"npm_config_strict_ssl\":\"true\",\"npm_config_sso_type\":\"oauth\",\"npm_config_scripts_prepend_node_path\":\"warn-only\",\"npm_config_save_prefix\":\"^\",\"npm_config_loglevel\":\"notice\",\"npm_config_ca\":\"\",\"npm_config_save_exact\":\"\",\"npm_config_group\":\"20\",\"npm_config_fetch_retry_factor\":\"10\",\"npm_config_dev\":\"\",\"npm_package_dependencies__wordpress_data\":\"^4.2.1\",\"npm_config_version\":\"\",\"npm_config_prefer_offline\":\"\",\"npm_config_cache_lock_stale\":\"60000\",\"npm_package_publishConfig_access\":\"public\",\"npm_package_dependencies__wordpress_api_fetch\":\"^2.2.8\",\"npm_config_otp\":\"\",\"npm_config_cache_min\":\"10\",\"npm_config_searchexclude\":\"\",\"npm_config_cache\":\"/Users/miguel/.npm\",\"LESS\":\"-F -g -i -M -R -S -w -X -z-4\",\"LOGNAME\":\"miguel\",\"npm_lifecycle_script\":\"node bin/build.js\",\"npm_config_color\":\"true\",\"npm_package_dependencies__wordpress_date\":\"^3.0.1\",\"VISUAL\":\"nano\",\"npm_config_proxy\":\"\",\"npm_config_package_lock\":\"true\",\"LESS_TERMCAP_so\":\"\\u001b[00;47;30m\",\"LC_CTYPE\":\"UTF-8\",\"npm_config_package_lock_only\":\"\",\"npm_package_dependencies__babel_polyfill\":\"^7.2.5\",\"npm_config_save_optional\":\"\",\"NVM_BIN\":\"/Users/miguel/.nvm/versions/node/v10.15.2/bin\",\"npm_config_ignore_scripts\":\"\",\"npm_config_user_agent\":\"npm/6.4.1 node/v10.15.2 darwin x64\",\"npm_package_dependencies__wordpress_plugins\":\"^2.0.11\",\"BROWSER\":\"open\",\"npm_config_cache_lock_wait\":\"10000\",\"npm_package_devDependencies_chalk\":\"^2.4.2\",\"npm_package_dependencies__wordpress_edit_post\":\"^3.1.11\",\"npm_package_dependencies__wordpress_blob\":\"^2.1.0\",\"npm_config_production\":\"\",\"npm_config_send_metrics\":\"\",\"npm_config_save_bundle\":\"\",\"npm_package_files_0\":\"dist/\",\"npm_config_umask\":\"0022\",\"npm_config_node_options\":\"\",\"npm_config_init_version\":\"1.0.0\",\"npm_package_dependencies__wordpress_compose\":\"^3.0.1\",\"npm_config_init_author_name\":\"\",\"npm_config_git\":\"git\",\"npm_config_scope\":\"\",\"npm_package_scripts_clean\":\"npx rimraf dist\",\"npm_config_unsafe_perm\":\"true\",\"npm_config_tmp\":\"/var/folders/5p/kt34cz6s19v4nmchh433hh1m0000gn/T\",\"npm_config_onload_script\":\"\",\"npm_node_execpath\":\"/Users/miguel/.nvm/versions/node/v10.15.2/bin/node\",\"npm_config_prefix\":\"/Users/miguel/.nvm/versions/node/v10.15.2\",\"npm_config_link\":\"\",\"LESS_TERMCAP_se\":\"\\u001b[0m\"}) {\n      // eslint-disable-next-line no-console\n      console.warn(`Block ${name} couldn't be registered because it is unavailable (${unavailableReason}).`);\n    }\n\n    return false;\n  }\n\n  const result = (0, _blocks.registerBlockType)(`jetpack/${name}`, settings); // Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if\n  // their parent is available, we register them all, without checking for their individual availability.\n\n  childBlocks.forEach(childBlock => (0, _blocks.registerBlockType)(`jetpack/${childBlock.name}`, childBlock.settings));\n  return result;\n}\n\n//# sourceURL=webpack:///./extensions/utils/register-jetpack-block.js?");

/***/ }),

/***/ "./extensions/utils/render-material-icon.jsx":
/*!***************************************************!*\
  !*** ./extensions/utils/render-material-icon.jsx ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\n/**\n * External dependencies\n */\nconst renderMaterialIcon = svg => React.createElement(_components.SVG, {\n  xmlns: \"http://www.w3.org/2000/svg\",\n  width: \"24\",\n  height: \"24\",\n  viewBox: \"0 0 24 24\"\n}, React.createElement(_components.Path, {\n  fill: \"none\",\n  d: \"M0 0h24v24H0V0z\"\n}), svg);\n\nvar _default = renderMaterialIcon;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/utils/render-material-icon.jsx?");

/***/ }),

/***/ "./extensions/utils/simple-input.js":
/*!******************************************!*\
  !*** ./extensions/utils/simple-input.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\n/**\n * External dependencies\n */\nconst simpleInput = (type, props, label, view, onChange) => {\n  const {\n    isSelected\n  } = props;\n  const value = props.attributes[type];\n  return React.createElement(\"div\", {\n    className: isSelected ? `jetpack-${type}-block is-selected` : `jetpack-${type}-block`\n  }, !isSelected && value !== '' && view(props), (isSelected || value === '') && React.createElement(_editor.PlainText, {\n    value: value,\n    placeholder: label,\n    \"aria-label\": label,\n    onChange: onChange\n  }));\n};\n\nvar _default = simpleInput;\nexports.default = _default;\n\n//# sourceURL=webpack:///./extensions/utils/simple-input.js?");

/***/ }),

/***/ 0:
/*!*********************************************************************************************!*\
  !*** multi ./extensions/src/preset/setup/editor ./extensions/blocks/contact-info/editor.js ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("!(function webpackMissingModule() { var e = new Error(\"Cannot find module '/Users/miguel/dev/jetpack/extensions/src/preset/setup/editor'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }());\nmodule.exports = __webpack_require__(/*! /Users/miguel/dev/jetpack/extensions/blocks/contact-info/editor.js */\"./extensions/blocks/contact-info/editor.js\");\n\n\n//# sourceURL=webpack:///multi_./extensions/src/preset/setup/editor_./extensions/blocks/contact-info/editor.js?");

/***/ }),

/***/ "@wordpress/blocks":
/*!****************************!*\
  !*** external "wp.blocks" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.blocks;\n\n//# sourceURL=webpack:///external_%22wp.blocks%22?");

/***/ }),

/***/ "@wordpress/components":
/*!********************************!*\
  !*** external "wp.components" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.components;\n\n//# sourceURL=webpack:///external_%22wp.components%22?");

/***/ }),

/***/ "@wordpress/editor":
/*!****************************!*\
  !*** external "wp.editor" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.editor;\n\n//# sourceURL=webpack:///external_%22wp.editor%22?");

/***/ }),

/***/ "@wordpress/element":
/*!*****************************!*\
  !*** external "wp.element" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.element;\n\n//# sourceURL=webpack:///external_%22wp.element%22?");

/***/ }),

/***/ "@wordpress/i18n":
/*!**************************!*\
  !*** external "wp.i18n" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.i18n;\n\n//# sourceURL=webpack:///external_%22wp.i18n%22?");

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"lodash\"]; }());\n\n//# sourceURL=webpack:///external_%22lodash%22?");

/***/ })

/******/ })));