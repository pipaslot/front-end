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
            return url == trimmed ? that.basePath + "/" + trimmed : url;
        },
        hasExtension: function (path, extension) {
            var questionMark = path.indexOf("?");
            if (questionMark >= 0) {
                path = path.substring(0, questionMark);
            }
            return (path.substring(path.length - extension.length) == extension);
        },
        history: {},
        uniqueStyles: []
    };
    /**
     * Base path into www root
     * @type {string}
     */
    this.basePath = "";

    /**
     * Load files from paths and run callbacks. Use caching
     * @param {string|Array}urlList
     * @param callback
     * @param context Callback context
     */
    this.get = function (urlList, callback, context) {
        var xhr, XHRs = [];
        $.each(inner.prepareUrls(urlList), function (i, url) {
            if (inner.history.hasOwnProperty(url)) {
                XHRs.push(inner.history[url]);
            } else if (inner.hasExtension(url, "js")) {
                xhr = $.getScript(url);
                XHRs.push(xhr);
                inner.history[url] = xhr;
            } else {
                xhr = $.get(url);
                XHRs.push(xhr);
                inner.history[url] = xhr;
            }

        });
        $.when.apply($, XHRs).done(function () {
            callback.apply(context, XHRs);
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
};


