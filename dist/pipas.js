/**
 * Namespace for objects of pipas package
 */
var pipas = new function () {
    var inner = {
        basePath: "",
        locale: null,
        history: {},
        uniqueStyles: []
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

        if (typeof urlList == "string") {
            return [pipas.applyBasePath(urlList, directory)];
        }
        var newList = [];
        $.each(urlList, function (i, val) {
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
     */
    this.getDependencies = function (urlList, callback, context) {
        var hasExtension = function (path, extension) {
            var questionMark = path.indexOf("?");
            if (questionMark >= 0) {
                path = path.substring(0, questionMark);
            }
            return (path.substring(path.length - extension.length) == extension);
        };
        var xhr, requests = [], args = [];
        $.each(urlList, function (i, url) {
            if (inner.history.hasOwnProperty(url)) {
                requests.push(inner.history[url]);
                if (inner.history[url].readyState) {
                    //Only for xhrs
                    args.push(inner.history[url]);
                }
            } else if (hasExtension(url, "js")) {
                xhr = $.getScript(url);
                requests.push(xhr);
                args.push(xhr);
                inner.history[url] = xhr;
            } else if (hasExtension(url, "css")) {
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
     * Load files from paths and run callbacks. Use caching. base path is applied too.
     * @param {Array|String}urlList
     * @param callback
     * @param context Callback context
     */
    this.get = function (urlList, callback, context) {
        this.getDependencies(this.applyBasePathForList(urlList), callback, context);
    };
};



/**
 * Overlay management
 * - Enables define overlay for multiple events for one target container
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    pipas.overlay = new function () {
        var inner = {
            defaultElement: $('<div>'),
            parents: [],
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            getOverlay: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector);
                var $elm = $parent.find("> .pipas-overlay");
                if (!$elm.length) {
                    $elm = inner.defaultElement.clone().addClass('pipas-overlay');
                    $parent.append($elm);
                }
                if ($parent.selector != "body") {
                    $elm.css("zIndex", 998);
                }
                return $elm
            },
            setReserved: function ($elm, listObject) {
                var array = $.map(listObject, function (value) {
                    return [value];
                });
                $elm.attr("data-pipas-reserved", array.join(" "));
            }
        };
        /**
         * Show Overlay defined by ID in parent element
         * @param id
         * @param parent Parent ID
         * @returns {*}
         */
        this.show = function (id, parent) {
            var $elm = inner.getOverlay(parent);
            var data = inner.parents[parent] || {idList: {}, elm: $elm};
            data.idList[id] = id;
            inner.parents[parent] = data;
            $elm.show();
            inner.setReserved($elm, data.idList);
            return $elm;
        };
        /**
         * Hide overlay order by id
         * @param {string} id
         */
        this.hide = function (id) {
            for (var par in inner.parents) {
                if (inner.parents.hasOwnProperty(par) && inner.parents[par].idList[id]) {
                    delete inner.parents[par].idList[id];
                    if (Object.keys(inner.parents[par].idList).length == 0) {
                        if (inner.parents[par].elm)inner.parents[par].elm.remove();
                        delete inner.parents[par];
                    } else {
                        inner.setReserved(inner.parents[par].elm, inner.parents[par].idList);
                    }
                    break;
                }
            }
        };

        /**
         * Cancel element despite of all allocated required
         * @param parent
         */
        this.cancel = function (parent) {
            if (inner.parents[parent]) {
                inner.parents[parent].elm.remove();
                delete inner.parents[parent];
            }
        };

        /**
         * Get/Set default html element
         * @param jqueryObject|string
         * @returns {*}
         */
        this.defaultElement = function (jqueryObject) {
            if (jqueryObject == undefined)return inner.defaultElement;
            inner.defaultElement = 'string' == typeof jqueryObject ? $(jqueryObject) : jqueryObject;
            return this;
        }
    };
})(jQuery, pipas);
/**
 * Bower dependency loading
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    pipas.bower = new function () {
        var inner = {
            directory: "bower_components"
        };

        /**
         * Get / Set path to bower from document root
         * @param path
         * @returns {string}
         */
        this.directory = function (path) {
            if (path != undefined) {
                inner.directory = path.replace(/^\/|\/$/g, '');
            }
            return inner.directory;
        };
        /**
         * Load files from paths and run callbacks. Use caching
         * @param {string|Array}urlList
         * @param callback
         * @param context Callback context
         */
        this.get = function (urlList, callback, context) {
            pipas.getDependencies(pipas.applyBasePathForList(urlList, inner.directory), callback, context);
        };

    };
})(jQuery, pipas);
/**
 * Message modal window
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, window, overlay) {
    pipas.message = new function () {
        var inner = {
            getContainer: function (identifier) {
                return $(identifier ? "#" + identifier : "body");
            },
            getElement: function ($container) {
                var $elm = $container.find("> .pipas-message");
                if (!$elm.length) {
                    $elm = $('<div class="modal pipas-message" role="dialog">'
                        + '<div class="modal-dialog modal-sm"><div class="modal-content">'
                        + '<div class="modal-header">'
                        + '<button type="button" class="close" data-dismiss="modal">&times;</button>'
                        + '<h4 class="modal-title">Notifications</h4>'
                        + '</div>'
                        + '<div class="modal-body"></div>'
                        + '</div>'
                        + '</div></div>');
                    $container.append($elm);
                }
                return $elm
            },
            supported:["info","success","danger","warning"]
        };

        this.showError = function (message, container) {
            this.show(message, "danger", container);
        };
        this.showInfo = function (message, container) {
            this.show(message, "info", container);
        };
        this.showSuccess = function (message, container) {
            this.show(message, "success", container);
        };
        this.showWarning = function (message, container) {
            this.show(message, "warning", container);
        };
        this.show = function (message, messageClass, container) {
             if (messageClass === "error")messageClass = "danger";
            else if (inner.supported.indexOf(messageClass)<0)messageClass = "info";

            var $cnt = inner.getContainer(container);
            var $elm = inner.getElement($cnt);

            var $content = $elm.find(".modal-body");
            overlay.show("message", container);

            // message type wrapper
            if ($content.find("> ." + messageClass + "s").length == 0) {
                $content.append($("<div class='message-group " + messageClass + "s'></div>"));
            }
            //write message
            var strong = messageClass == "danger" ? "Error" : messageClass.charAt(0).toUpperCase() + messageClass.slice(1);
            var $existing = $content.find("> ." + messageClass + "s .alert span").filter(function () {
                return $(this).text() == message;
            });
            if ($existing.length > 0) {
                $existing.each(function () {
                    var $alert = $(this).parent();
                    var $badge = $alert.find("span.badge");
                    if ($badge.length > 0) {
                        $badge.text(parseInt($badge.text()) + 1);
                    } else {
                        $alert.find("strong").after(' <span class="badge">2</span> ');
                    }
                });
            } else {
                $content.find("> ." + messageClass + "s").append($("<div class='alert alert-" + messageClass + "'><strong>" + strong + "!</strong> <span>" + message + "</span></div>"));
            }

            // Check height overflow
            var height = $(window).height();
            if ($content.height() > height) {
                $content.height(height - 150);
            }

            if (!$elm.is(":visible")) {
                $elm.fadeIn();
            }

            var that = this;
            var hideCallback = function () {
                that.hide(container);
            };
            // Close event
            $(".pipas-message")
                .off("click", hideCallback)
                .on("click", hideCallback);
            //Enter key
            $(document).on("keydown", function (event) {
                if (event.keyCode == 13) {
                    $(".pipas-message button").trigger('click');
                }
            });
            return $elm;
        };
        this.hide = function (container) {
            var $cnt = inner.getContainer(container);
            var $elm = inner.getElement($cnt);
            overlay.hide("message", container);
            $elm.remove();
        };


    };
})(jQuery, window, pipas.overlay);
/**
 * User messages management
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before spinner", pipas);

    pipas.spinner = new function () {
        var inner = {
            defaultElement: $('<svg class="pipas-spinner-svg" viewBox="0 -256 1792 1792"><defs id="defs3033"/><g transform="matrix(1,0,0,-1,121.49153,1315.7966)" id="g3027"><path d="M 496,192 Q 496,132 453.5,90 411,48 352,48 q -60,0 -102,42 -42,42 -42,102 0,60 42,102 42,42 102,42 59,0 101.5,-42 Q 496,252 496,192 z M 928,0 Q 928,-53 890.5,-90.5 853,-128 800,-128 747,-128 709.5,-90.5 672,-53 672,0 672,53 709.5,90.5 747,128 800,128 853,128 890.5,90.5 928,53 928,0 z M 320,640 Q 320,574 273,527 226,480 160,480 94,480 47,527 0,574 0,640 q 0,66 47,113 47,47 113,47 66,0 113,-47 47,-47 47,-113 z M 1360,192 q 0,-46 -33,-79 -33,-33 -79,-33 -46,0 -79,33 -33,33 -33,79 0,46 33,79 33,33 79,33 46,0 79,-33 33,-33 33,-79 z M 528,1088 Q 528,1015 476.5,963.5 425,912 352,912 279,912 227.5,963.5 176,1015 176,1088 q 0,73 51.5,124.5 51.5,51.5 124.5,51.5 73,0 124.5,-51.5 Q 528,1161 528,1088 z m 464,192 q 0,-80 -56,-136 -56,-56 -136,-56 -80,0 -136,56 -56,56 -56,136 0,80 56,136 56,56 136,56 80,0 136,-56 56,-56 56,-136 z m 544,-640 q 0,-40 -28,-68 -28,-28 -68,-28 -40,0 -68,28 -28,28 -28,68 0,40 28,68 28,28 68,28 40,0 68,-28 28,-28 28,-68 z m -208,448 q 0,-33 -23.5,-56.5 -23.5,-23.5 -56.5,-23.5 -33,0 -56.5,23.5 -23.5,23.5 -23.5,56.5 0,33 23.5,56.5 23.5,23.5 56.5,23.5 33,0 56.5,-23.5 23.5,-23.5 23.5,-56.5 z" id="path3029" style="fill:currentColor"/> </g></svg>'),
            parents: {},
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            createSpinner: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector).css("position", "relative");
                var $spinner = $parent.find("> .pipas-spinner");
                if (!$spinner.length) {
                    $spinner = $('<div class="pipas-spinner"></div>');
                    inner.defaultElement.clone().appendTo($spinner);
                    $spinner.appendTo($parent);
                }
                return $spinner;
            },
            setReserved: function ($elm, listObject) {
                var array = $.map(listObject, function (value) {
                    return [value];
                });
                $elm.attr("data-pipas-reserved", array.join(" "));
            }
        };
        /**
         * Show spinner with overlay defined by id on parent element
         * @param id
         * @param parent Parent ID
         */
        this.show = function (id, parent) {
            if (!parent)parent = "body";
            var $elm = inner.createSpinner(parent).show();
            var data = inner.parents[parent] || {idList: {}, elm: $elm};
            data.idList[id] = id;
            inner.parents[parent] = data;
            pipas.overlay.show(id, parent);
            if (parent != "body") {
                $elm.css("zIndex", 999);
            }

            inner.setReserved($elm, data.idList);
        };
        /**
         * Hide overlay order by id
         * @param {string} id
         */
        this.hide = function (id) {
            for (var par in inner.parents) {
                if (inner.parents.hasOwnProperty(par) && inner.parents[par].idList[id]) {
                    delete inner.parents[par].idList[id];
                    if (Object.keys(inner.parents[par].idList).length == 0) {
                        if (inner.parents[par].elm)inner.parents[par].elm.remove();
                        delete inner.parents[par];
                    } else {
                        inner.setReserved(inner.parents[par].elm, inner.parents[par].idList);
                    }
                    break;
                }
            }
            pipas.overlay.hide(id);
        };
        /**
         * Cancel element despite of all allocated required
         * @param {string} parent
         * @returns Element
         */
        this.cancel = function (parent) {
            if (inner.parents[parent]) {
                inner.parents[parent].elm.remove();
                delete inner.parents[parent];
            }
            pipas.overlay.cancel(parent);
        };

        /**
         * Get/Set default html element
         * @param jqueryObject|string
         * @returns {*}
         */
        this.defaultElement = function (jqueryObject) {
            if (jqueryObject == undefined)return inner.defaultElement;
            inner.defaultElement = 'string' == typeof jqueryObject ? $(jqueryObject) : jqueryObject;
            return this;
        }
    };
})(jQuery, pipas);
/**
 * URL address management
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function (history, pipas) {
    pipas.url = {
        stateTypeName: "pipasAjax",
        cleanedParameters: ["_fid"],
        history: [],
        baseUrl: "/",
        /**
         * Cleanse the URL from unnecessary parameters
         * @param {string} url
         * @returns {string}
         */
        clean: function (url) {
            for (var key in this.cleanedParameters) {

                url = this.remove(url, this.cleanedParameters[key]);
            }
            return url;
        },
        /**
         * Append new parameter to url or override old value
         * @param {string} url
         * @param {string} param
         * @param {string} value
         * @returns {Boolean|string}
         */
        append: function (url, param, value) {
            var params = this.separeParams(url);
            params[param] = value;
            return this.getPureUrl(url) + "?" + this.joinParams(params);
        },
        /**
         * Appends parameters to url from another url
         * @param {string} url
         * @param {string} data
         * @returns {Boolean|string}
         */
        appendData: function (url, data) {
            var params = this.separeParams(url);
            var array2 = this.separeParams(decodeURI(data));

            for (var i in array2) {
                params[i] = array2[i];
            }
            url = this.getPureUrl(url);
            if (Object.keys(params).length === 0)
                return url;
            return url + "?" + this.joinParams(params);
        },
        /**
         * Search parameter value
         * @param {string} url
         * @param {string} param
         * @returns {null|string}
         */
        search: function (url, param) {
            if (typeof url === 'string' && typeof param === 'string') {
                var params = this.separeParams(url);
                for (var i in params) {
                    if (i === param)
                        return params[i];
                }
            }
            return null;
        },
        /**
         * Remove parameter from URL
         * @param {string} url
         * @param {string} param
         * @returns {string}
         */
        remove: function (url, param) {
            if (typeof url === 'string' && typeof param === 'string') {
                var params = this.separeParams(url);
                for (var i in params) {
                    if (i === param) {
                        delete params[i];
                    }
                }
                if (Object.keys(params).length === 0)
                    return this.getPureUrl(url);
                url = this.getPureUrl(url) + "?" + this.joinParams(params);
            }
            return url;
        },
        /**
         * Change current url address to defined
         * @param {string} url
         * @returns {null}
         */
        changeTo: function (url) {
            if (!url) {
                url = "/";
            } else {
                url = this.clean(url);
            }
            var last = this.history.pop();
            if (last !== url) {
                this.history.push(last);
            }
            this.history.push(url);
            if (history && history.pushState) {

                if (history.state && history.state.url && history.state.url === url)
                    return null;
                history.pushState({
                    type: this.stateTypeName,
                    url: url
                }, null, url);
            }
            else {
                console.error("an not write URL");
            }
            return null;
        },
        /**
         * finds the parameter value in the data, which are acquired from GET
         * @param {string} getData
         * @param {string} param
         * @returns {string|bool} String or False
         */
        searchFromData: function (getData, param) {
            getData = decodeURI(getData);
            if (typeof getData === 'string' && typeof param === 'string') {
                var pair;
                var b = getData.split("&");
                for (var i in b) {
                    pair = b[i].split("=");
                    if (pair[0] === param) {
                        return pair[1];
                    }
                }
            }
            return false;
        },
        /**
         * Returns URL without parameters
         * @param {string} url
         * @returns {string}
         */
        getPureUrl: function (url) {
            if (typeof url === 'string') {
                var base = url.split("?");
                return base[0];
            }
            return "";
        },
        /**
         * Gets parameters from URL as array
         * @param {string} url
         * @returns {Array} asociativní pole
         */
        separeParams: function (url) {
            var list = [];
            if (typeof url === 'string') {
                var base = url.split("?");
                var params = base[base.length - 1];
                var pair, pairs = params.split("&");
                var ai = 0;//array iterator
                for (var i in pairs) {
                    if (pairs[i] !== "") {
                        pair = pairs[i].split("=");
                        if (pair[1]) {
                            if (pair[0].indexOf("[]") !== -1) {
                                //parameter is number, then from 'param[]' will be 'param[number]'
                                pair[0] = pair[0].substring(0, pair[0].length - 2) + "[" + ai + "]";
                                ai++;
                            }
                            list[pair[0]] = pair[1];
                        }
                    }
                }
            }
            return list;
        },
        /**
         * Join parameters to GET string
         * @param {Array} params
         * @returns {string}
         */
        joinParams: function (params) {
            var url = "";
            if (Array.isArray(params)) {
                for (var i in params) {
                    if (url !== "")
                        url += "&";
                    url += i + "=" + params[i];
                }
            }
            return url;
        },
        /**
         * Current document URL
         * @returns {string}
         */
        getCurrent: function () {
            return document.location.href;
        }

    };
    if (!history.state) {
        history.replaceState({
            type: pipas.url.stateTypeName
        }, null, document.location);
    }
})(history, pipas);
/**
 * Utilities and helpers
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function (pipas) {
    pipas.utils = {
        /**
         * Make clone of object
         * @param {Object} object
         * @returns {Object}
         */
        clone: function (object) {
            if (object) {
                return (JSON.parse(JSON.stringify(object)));
            }
            return object;
        }
    }
})(pipas);