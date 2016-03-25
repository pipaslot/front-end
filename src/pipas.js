/**
 * Namespace for objects of pipas package
 */
var pipas = (function ($) {
    return new function () {
        var inner = {
            basePath: "",
            locale: null,
            history: {},
            uniqueStyles: [],
            map: [],
            aliases: {},
            toArray: function (sources) {
                var list = [];
                if (sources != undefined && sources != null) {
                    if (typeof sources == "string") {
                        list.push(sources);
                    } else {
                        $.each(sources, function (i, val) {
                            list.push(val);
                        });
                    }
                }
                return list;
            },
            /**
             * Resolve list of dependencies and returns their definitions
             * @param dependencies
             * @returns {Array}
             */
            resolveList: function (dependencies) {
                var required = inner.toArray(dependencies);
                var list = [], resolved;
                var unresolved = {
                    src: []
                };
                for (var i in required) {
                    resolved = inner.resolve(required[i]);
                    if (resolved) {
                        list.push(resolved);
                    } else {
                        //if is not resolved, appends fictive dependency contains only sources
                        unresolved.src.push(required[i]);
                    }
                }
                list.push(unresolved);
                return list;
            },
            /**
             * Resolve single dependency and return its definition, otherwise error is thrown
             * @param dependency
             * @return {object}
             * @throw Error
             */
            resolve: function (dependency) {
                //Try apply alias
                if (inner.aliases.hasOwnProperty(dependency)) {
                    dependency = inner.aliases[dependency];
                }
                if (inner.map.hasOwnProperty(dependency))return inner.map[dependency];
                return null;
            },
            hasExtension: function (path, extension) {
                var questionMark = path.indexOf("?");
                if (questionMark >= 0) {
                    path = path.substring(0, questionMark);
                }
                return (path.substring(path.length - extension.length) == extension);
            }
        };

        /**
         * Get or Set base path into www root
         * @param setter
         * @type {string}
         */
        this.basePath = function (setter) {
            if (setter != undefined)inner.basePath = setter;
            return inner.basePath
        };
        /**
         * Define dependency. Usable for application customization
         * @param name Dependency name
         * @param sources Source files (js, css)
         * @param dependencies (required dependency)
         * @param aliases
         * @param initCallback Callback called after first require call. Intended for plugin initialization called
         * @returns {pipas}
         */
        this.define = function (name, sources, dependencies, aliases, initCallback) {
            if (inner.map.hasOwnProperty(name)) {
                throw new Error("Can not override dependency '" + name + "'.");
            }
            var key, value, aliasArray = inner.toArray(aliases);
            for (key in aliasArray) {
                value = aliasArray[key];
                if (inner.aliases.hasOwnProperty(value)) {
                    if (inner.aliases[value] != name)throw new Error("Alias '" + value + "' already exist form '" + inner.aliases[value] + "'");
                }
                else {
                    inner.aliases[value] = name;
                }
            }
            //Dependencies
            var required = inner.toArray(dependencies);
            for (key in required) {
                if (!inner.resolve(required[key]))throw new Error("Required dependency '" + required[key] + "' has not been defined.");
            }
            inner.map[name] = {
                name: name,
                src: inner.toArray(sources),
                req: required,
                initCb: initCallback
            };
            return this;
        };
        /**
         * Define default dependency, if does not exist. Otherwise is ignored. Usable for runtime initializations
         * @param name
         * @param sources
         */
        this.defineDefault = function (name, sources) {
            try {
                this.define(name, sources)
            } catch (error) {

            }
        };

        /**
         * Applied basePath to url. If second parameter is defined, passed path is added between base path and url as sub-directory. Absolute path is ignored if second parameter is empty
         * @param url
         * @param directory
         * @type {String}
         */
        this.applyBasePath = function (url, directory) {
            var trimmed = url.replace(/^\/|\/$/g, '');
            if (url != trimmed) {
                if (directory != undefined)throw new Error("Path '" + url + "' must be relative type (without backslash on beginning)");
                return url;//Absolute path is ignored
            }
            return pipas.basePath() + "/" + (directory == undefined ? "" : directory.replace(/^\/|\/$/g, '') + "/") + trimmed;
        };
        /**
         * Apply method applyBasePath for each passed urls
         * @param {Array|String} urlList
         * @param {String} directory
         * @type {Array}
         */
        this.applyBasePathForList = function (urlList, directory) {
            if (!urlList)throw new Error("url is not defined. Expected string or array");
            var newList = [];
            $.each(inner.toArray(urlList), function (i, url) {
                var trimmed = url.replace(/^\/|\/$/g, '');
                if (url != trimmed) {
                    if (directory != undefined)throw new Error("Path '" + url + "' must be relative type (without backslash on beginning)");
                    newList[i] = url;//Absolute path is ignored
                } else {
                    newList[i] = pipas.basePath() + "/" + (directory == undefined ? "" : directory.replace(/^\/|\/$/g, '') + "/") + trimmed;
                }
            });
            return newList;
        };
        /**
         * Get or Set document locale
         * @param setter
         * @returns {null|string}
         */
        this.locale = function (setter) {
            if (setter != undefined)inner.locale = setter;
            return inner.locale || navigator.language || navigator.userLanguage
        };

        /**
         * Load temporary style. If is called again, old loaded style will be removed
         * @param {String} urlList
         * @returns {undefined}
         */
        this.getUniqueStyle = function (urlList) {
            var head = document.getElementsByTagName('head')[0];
            for (var i in inner.uniqueStyles) {
                head.removeChild(inner.uniqueStyles[i]);
            }
            inner.uniqueStyles = [];

            $.each(this.applyBasePathForList(urlList), function (i, url) {
                var style = document.createElement('link');
                style.rel = 'stylesheet';
                style.type = 'text/css';
                style.href = url;
                style.media = 'all';
                inner.uniqueStyles[url] = style;
                head.appendChild(style);
            });
        };
        /**
         * Loads all dependencies defined in url list. After finishing is called callback with custom context. Is applied caching. BasePath is not applied.
         * @param {Array}urlList
         * @param callback
         * @param context
         * @param defaultDependencies
         */
        this.getDependencies = function (urlList, callback, context, defaultDependencies) {
            var xhr, requests = [], args = [];
            $.each(urlList, function (i, url) {
                if (inner.history.hasOwnProperty(url)) {
                    requests.push(inner.history[url]);
                    if (inner.history[url].readyState) {
                        //Only for xhrs
                        args.push(inner.history[url]);
                    }
                } else if (inner.hasExtension(url, "js")) {
                    xhr = $.getScript(url);
                    requests.push(xhr);
                    args.push(xhr);
                    inner.history[url] = xhr;
                } else if (inner.hasExtension(url, "css")) {
                    var dfd = $.Deferred();
                    $(document.createElement('link')).attr({
                        href: url,
                        type: 'text/css',
                        rel: 'stylesheet'
                    }).appendTo('head')
                        .on("load", function () {
                            dfd.resolve("and");
                        });
                    requests.push(dfd);
                    //Deferred is not passed to callback as argument
                    inner.history[url] = dfd;
                } else {
                    xhr = $.get(url);
                    requests.push(xhr);
                    args.push(xhr);
                    inner.history[url] = xhr;
                }
            });
            $.when.apply($, requests)
                .done(function () {
                    callback.apply(context, args);
                })
                .fail(function () {
                    console.error("Cannot load dependencies: ", defaultDependencies ? defaultDependencies : urlList, "Failing report: ", arguments, "Check if is correctly defined dependency via pipas.define()");
                });
        };
        /**
         * Load files from paths and run callbacks. Use caching. Base path is applied too.
         * @param {Array|String}urlList
         * @param callback
         * @param context Callback context
         */
        this.get = function (urlList, callback, context) {
            var i, u, resolved = inner.resolveList(urlList);
            var srcs = [];
            var reqs = [];
            for (i in resolved) {
                for (u in resolved[i].src) {
                    srcs.push(this.applyBasePath(resolved[i].src[u]));
                }
                for (u in resolved[i].req) {
                    reqs.push(resolved[i].req[u]);
                }
            }
            var initCallback = function () {
                // Call init callback once after first get and then run final callback
                for (i in resolved) {
                    var initCb = resolved[i].initCb;
                    if (typeof initCb === "function") {
                        resolved[i].initCb.apply(context, arguments);
                        resolved[i].initCb = null;
                    }
                }
                if (callback)callback.apply(context, arguments)
            };
            if (reqs.length > 0) {
                this.get(reqs, function () {
                    this.getDependencies(srcs, initCallback, context, urlList);
                }, this);
            } else {
                this.getDependencies(srcs, initCallback, context, urlList);
            }
        };
        /**
         * Load files from paths and run callbacks. Use caching. Base path is applied too.
         * @param {Array|String}urlList
         * @param callback
         * @param context Callback context
         */
        this.require = this.get;
    };
})(jQuery);


