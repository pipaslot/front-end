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
            toArray: function (sources) {
                var list = [];
                if (typeof sources == "string") {
                    list.push(sources);
                } else {
                    $.each(sources, function (i, val) {
                        list.push(val);
                    });
                }
                return list;
            },
            expandMapping: function (urls) {
                var list = [];
                $.each(this.toArray(urls), function (key, val) {
                    if (inner.map.hasOwnProperty(val)) {
                        for (var i in inner.map[val].src) {
                            list.push(inner.map[val].src[i]);
                        }
                    } else {
                        list.push(val);
                    }
                });
                return list;
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
         * Define dependency
         * @param name
         * @param sources
         * @returns {pipas}
         */
        this.define = function (name, sources) {
            if (inner.map.hasOwnProperty(name))throw new Error("Can not override dependency '" + name + "'.");

            inner.map[name] = {
                src: inner.toArray(sources)
            };
            return this;
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
            $.each(inner.toArray(urlList), function (i, val) {
                newList[i] = pipas.applyBasePath(val, directory);
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
         * Load files from paths and run callbacks. Use caching. base path is applied too.
         * @param {Array|String}urlList
         * @param callback
         * @param context Callback context
         */
        this.get = function (urlList, callback, context) {
            this.getDependencies(this.applyBasePathForList(inner.expandMapping(urlList)), callback, context, urlList);
        };
    };
})(jQuery);


