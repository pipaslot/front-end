/**
 * Namespace for objects of pipas package
 */
var pipas = new function () {
    var that = this;
    var inner = {
        prepareUrls: function (url) {
            if (!url)console.error("url is not defined. Expected string or array");

            if (typeof url == "string") {
                return [inner.appendBasePath(url)];
            }
            $.each(url, function (i, val) {
                url[i] = inner.appendBasePath(val);
            });
            return url;
        },
        appendBasePath: function (url) {
            var trimmed = url.replace(/^\/|\/$/g, '');
            return url == trimmed ? that.basePath() + "/" + trimmed : url;
        },
        hasExtension: function (path, extension) {
            var questionMark = path.indexOf("?");
            if (questionMark >= 0) {
                path = path.substring(0, questionMark);
            }
            return (path.substring(path.length - extension.length) == extension);
        },
        history: {},
        uniqueStyles: [],
        basePath: "",
        locale: null
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
     * Load files from paths and run callbacks. Use caching
     * @param {string|Array}urlList
     * @param callback
     * @param context Callback context
     */
    this.get = function (urlList, callback, context) {
        var xhr, requests = [], args = [];
        $.each(inner.prepareUrls(urlList), function (i, url) {
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
        $.when.apply($, requests).done(function () {
            callback.apply(context, args);
        });
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

        $.each(inner.prepareUrls(urlList), function (i, url) {
            style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = url;
            style.media = 'all';
            inner.uniqueStyles[url] = style;
            head.appendChild(style);

        });
    };
    /**
     * Get or Set document locale
     * @param setter
     * @returns {null|string}
     */
    this.locale = function (setter) {
        if (setter != undefined)inner.locale = setter;
        return inner.locale || navigator.language || navigator.userLanguage
    }
};


