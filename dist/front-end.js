/**
 * Namespace for objects of pipas package
 */
var pipas = (function ($) {
    return new function () {
        var inner = {
            isDebug: false,
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
            },
            getScriptCached: function (url) {
                return $.ajax({
                    dataType: "script",
                    cache: !inner.isDebug,
                    url: url
                });
            }
        };
        /**
         * Enable/Disable debug tools
         * @param setter
         * @returns {boolean}
         */
        this.debug = function (setter) {
            if (setter !== undefined)inner.isDebug = setter ? true : false;
            return inner.isDebug;
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
                    xhr = inner.getScriptCached(url);
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

window.pipas = pipas;
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
            if (!parent)parent = "body";
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
 * User messages management
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before spinner", pipas);

    pipas.spinner = new function () {
        var inner = {
            defaultElement: $('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>'),
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
         * @param {string|null} parent If is empty, remove all parents
         * @returns Element
         */
        this.cancel = function (parent) {
            if (parent == null) {
                for (var i in inner.parents) {
                    inner.parents[i].elm.remove();
                    delete inner.parents[i];
                }
            }
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
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before progress", pipas);

    pipas.ProgressControl = function (id, _elm) {
        var val = 0;
        var max = 100;
        var percent = 0;
        var label = "&nbsp;";
        var oldAnimate = null;
        this.elm = _elm;
        var bar = _elm.find(".bar");
        bar.attr("value", 0).attr("max", max);
        this.setValue = function (value) {
            val = parseInt(value);
            if (isNaN(val))val = 0;
            percent = max > 0 ? Math.round(val / max * 100) : 0;
            if (val >= 0 && max >= 0) {
                bar.stop();
                if (oldAnimate) {
                    bar.attr("value", oldAnimate.value).attr("max", oldAnimate.max);
                }
                oldAnimate = {
                    value: val,
                    max: max
                };
                bar.animate(oldAnimate);
            }
            this.setLabel();
            if (this.isSuccess()) {
                for (var i in this.onSuccess) {
                    var cb = this.onSuccess[i];
                    cb();
                }
                this.close();
            }
            return this;
        };
        this.setMaximum = function (_max) {
            max = parseInt(_max ? _max : 100);
            _elm.find(".bar").attr("max", max);
            return this;
        };
        this.setLabel = function (_label) {
            label = _label ? _label : label;
            this.elm.find(".label").html(label + " " + percent + "%").show();
            return this;
        };
        this.isSuccess = function () {
            return val >= max;
        };
        /**
         * List of callbacks called after success
         * @type {Array}
         */
        this.onSuccess = [];
        this.close = function () {
            if (this.elm)this.elm.remove();
            pipas.overlay.hide(id);
        }
    };
    pipas.progress = new function () {
        var inner = {
            defaultElement: $('<div class="pipas-progress"><div class="wrapper"><div class="label">&nbsp;</div><progress class="bar" value="0" max="100"></progress></div></div>'),
            parents: {},
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            createProgress: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector).css("position", "relative");
                var $spinner = $parent.find("> .pipas-progress");
                if (!$spinner.length) {
                    $spinner = inner.defaultElement.clone();
                    $spinner.appendTo($parent);
                }
                return $spinner;
            }
        };
        /**
         * *
         * Show spinner with overlay defined by id on parent element
         * @param max
         * @param parent
         * @returns {pipas.ProgressControl}
         */
        this.show = function (parent) {
            var id = "progress-" + Math.round(Math.random() * 10000);
            if (!parent)parent = "body";
            if (inner.parents.hasOwnProperty(parent)) {
                inner.parents[parent].close();
            }
            var $elm = inner.createProgress(parent);
            var obj = new pipas.ProgressControl(id, $elm);

            inner.parents[parent] = obj;
            pipas.overlay.show(id, parent);
            if (parent != "body") {
                $elm.css("zIndex", 999);
            }
            return obj;
        };

        /**
         * Cancel element despite of all allocated required
         * @param {string|null} parent If is empty, remove all parents
         * @returns Element
         */
        this.cancel = function (parent) {
            if (parent == null) {
                for (var i in inner.parents) {
                    inner.parents[i].close();
                    delete inner.parents[i];
                }
            }
            if (inner.parents[parent]) {
                inner.parents[parent].close();
                delete inner.parents[parent];
            }
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
        var that = this;
        var inner = {
            /**
             * Expect string selector or jQuery object
             * @param identifier
             * @returns {object}
             */
            getContainer: function (identifier) {
                if ("object" == typeof identifier)return identifier;
                return $(identifier ? "#" + identifier : "body");
            },
            getElement: function ($container, title) {
                var titleHtml = '', $elm = $container.find("> .pipas-message");
                if (title && title != '') {
                    titleHtml = '<div class="modal-header">'
                        + '<button type="button" class="close" data-dismiss="modal">&times;</button>'
                        + '<h4 class="modal-title">' + title + '</h4>'
                        + '</div>'
                }
                if (!$elm.length) {
                    $elm = $('<div class="modal pipas-message" role="dialog">'
                        + '<div class="modal-dialog modal-sm"><div class="modal-content">'
                        + titleHtml
                        + '<div class="modal-body"></div>'
                        + '</div>'
                        + '</div></div>');
                    $container.append($elm);
                }
                return $elm
            },
            supported: ["info", "success", "danger", "warning"],
            show: function (message, messageClass, container, title) {
                if (messageClass === "error")messageClass = "danger";
                else if (inner.supported.indexOf(messageClass) < 0)messageClass = "info";

                var $cnt = inner.getContainer(container);
                var $elm = inner.getElement($cnt, title);

                var $content = $elm.find(".modal-body");
                overlay.show("message", container);

                // message type wrapper
                if ($content.find("> ." + messageClass + "s").length == 0) {
                    $content.append($("<div class='message-group " + messageClass + "s'></div>"));
                }
                //write message
                var prefix = messageClass == "danger" ? "error" : messageClass.toLowerCase();
                var prefixText = pipas.message.text[prefix];
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
                    $content.find("> ." + messageClass + "s").append($("<div class='alert alert-" + messageClass + "'><strong>" + prefixText + "</strong> <span>" + message + "</span></div>"));
                }

                // Check height overflow
                var height = $(window).height();
                if ($content.height() > height) {
                    $content.height(height - 150);
                }

                if (!$elm.is(":visible")) {
                    $elm.fadeIn();
                }


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
            }
        };

        this.showError = function (message, container, title) {
            this.show(message, "danger", container, title);
        };
        this.showInfo = function (message, container, title) {
            this.show(message, "info", container, title);
        };
        this.showSuccess = function (message, container, title) {
            this.show(message, "success", container, title);
        };
        this.showWarning = function (message, container, title) {
            this.show(message, "warning", container, title);
        };
        this.show = function (message, messageClass, container, title) {
            if ($.isArray(message)) {
                $.each(message, function (index, value) {
                    inner.show(value, messageClass, container, title);
                });
            }
            else {
                inner.show(message, messageClass, container, title);
            }
        };
        this.hide = function (container) {
            var $cnt = inner.getContainer(container);
            var $elm = inner.getElement($cnt);
            overlay.hide("message");
            $elm.remove();
        };
        /**
         * Custom text translations
         * @type {{error: string, info: string, warning: string, success: string}}
         */
        this.text = {
            error: 'Error!',
            info: 'Info!',
            warning: 'Warning!',
            success: 'Success!'
        }


    };
})(jQuery, window, pipas.overlay);
/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.progress)console.error("Progress must be declared before file upload", pipas);
    pipas.upload = {
        text: {
            upload: "Upload",
            processing: "Processing"
        },
        /** @type {Array} Callback called after all uploads */
        onUpload: [],
        /** @type {Array} Callback called after all processing */
        onSuccess: [],
        /**
         *
         * @param fileInputSelector
         * @param uploadUrl
         * @returns {pipas.upload.UploadControl}
         */
        create: function (fileInputSelector, uploadUrl) {
            return new pipas.upload.UploadControl(fileInputSelector, uploadUrl);
        },
        UploadControl: function (elementSelector, uploadUrl) {
            this.element = $(elementSelector);
            if (this.element.length > 1)throw new Error("Passed selector is not unique. Found " + this.element.length + " similar elements.");
            /** @type {Array} Callback called after upload */
            this.onUpload = [];
            /** @type {Array} Callback called after processing */
            this.onSuccess = [];
            var self = this;
            var uploadProgress, processingProgress;
            var callUpload = function () {
                var i;
                for (i in self.onUpload) {
                    self.onUpload[i].call(this, self);
                }
                //call global events
                for (i in pipas.upload.onUpload) {
                    pipas.upload.onUpload[i].call(this, self);
                }
            };
            var callSuccess = function () {
                //reset file input
                var i, file = self.element[0];
                file.value = file.defaultValue;
                // Fire on success callbacks
                for (i in self.onSuccess) {
                    self.onSuccess[i].call(this, self);
                }
                //call global events
                for (i in pipas.upload.onSuccess) {
                    pipas.upload.onSuccess[i].call(this, self);
                }
            };
            var getStatus = function () {
                if (!self.processingStatusUrl) {
                    callSuccess();
                    return;
                }
                if (!processingProgress) {
                    processingProgress = pipas.progress.show(self.progressContainerId);
                    processingProgress.setLabel(pipas.upload.text.processing);
                }
                $.ajax({
                    type: 'GET',
                    url: self.processingStatusUrl,
                    redirect: false,
                    spinner: false,
                    async: true,
                    success: function (payload) {
                        if (typeof payload == 'string') {
                            processingProgress.setValue(payload);
                        } else {
                            processingProgress.setValue(payload.status);
                        }
                        if (!processingProgress.isSuccess()) {
                            setTimeout(function () {
                                getStatus();
                            }, 300);
                        } else {
                            callSuccess();
                        }
                    }
                });
            };
            /**
             * Detach attached event to element
             */
            this.destroy = function () {
                this.element.off('change', onChange);
            };
            var onChange = function () {
                if (self.element.get(0).files.length > 0) {
                    var ajaxData = new FormData();
                    ajaxData.append('action', 'uploadImages');
                    var iterator = 0;
                    var inputName = self.element.attr("name") ? self.element.attr("name").replace(/[[\]]/g, '') : "photo";
                    $.each(self.element, function (i, obj) {
                        $.each(obj.files, function (j, file) {
                            ajaxData.append(inputName + '[' + iterator + ']', file);
                            iterator++;
                        })
                    });
                    var progress;
                    $.nette.ajax({
                        redirect: false,
                        spinner: false,
                        url: uploadUrl,
                        type: 'POST',
                        async: true,
                        data: ajaxData,
                        dataType: 'json',
                        cache: false,
                        contentType: false,
                        processData: false,
                        xhr: function () {
                            var myXhr = $.ajaxSettings.xhr();
                            if (myXhr.upload) {
                                myXhr.upload.addEventListener('progress', function (e) {
                                    if (e.lengthComputable && uploadProgress) {
                                        uploadProgress.setMaximum(e.total);
                                        uploadProgress.setValue(e.loaded);
                                        if (uploadProgress.isSuccess()) {
                                            callUpload();
                                            getStatus();
                                        }
                                    }
                                }, false);
                            }
                            return myXhr;
                        },
                        beforeSend: function () {
                            uploadProgress = pipas.progress.show(self.progressContainerId);
                            uploadProgress.setLabel(pipas.upload.text.upload);
                        },
                        success: function () {
                            if (uploadProgress)uploadProgress.close();
                        },
                        error: function (jqXHR, status, error) {
                            pipas.message.showError("Failed to upload files");
                            if (uploadProgress)uploadProgress.close();
                        }
                    });
                }
                else console.log("No file selected");
            };
            this.element.off('change', onChange).on('change', onChange);
            /** @type {string} url for obtaining processing status */
            this.processingStatusUrl = null;
            var modalId = this.element.closest(".modal").attr("id");
            /** @type {string} Identifier for progress target (as body element or id selector without grille) */
            this.progressContainerId = modalId ? modalId + " .modal-dialog" : "body";
        }
    }
})(jQuery, pipas);
/**
 * Modal dialog
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas, spinner, overlay) {
    pipas.modal = new function () {
        var $elm, that = this;
        var createButton = function (title, closing) {
            return '<button type="button" class="btn btn-secondary" ' + (closing ? 'data-dismiss="modal"' : '') + '>' + title + '</button>';
        };
        var doHide = function () {
            if ($elm) {
                that.setBody();
                that.setTitle();
                that.hideSpinner();
                that.setSizeMedium();
                overlay.hide(that.id + "overlay");
                $elm.remove();
            }
            $elm = null;
        };
        this.id = 'modal-' + Math.round(Math.random() * 10000);
        this.text = {
            close: 'Close',
            refresh: 'Refresh'
        };
        this.element = function () {
            if (!$elm) {
                $elm = $('<div class="modal fade" id="' + this.id + '" tabindex="-1" role="dialog" aria-labelledby="' + this.id + '-label">'
                    + '<div class="modal-dialog" role="document">'
                    + '<div class="modal-content">'
                    + '<div class="modal-header" style="display: none">'
                    + '<span class="modal-header-button close" data-dismiss="modal" aria-label="' + that.text.close + '"><span class="fa fa-close"></span></span>'
                    + '<a href="#" class="modal-header-button refresh" title="' + that.text.refresh + '"><span class="fa fa-refresh"></span></a>'
                    + '<h4 class="modal-title" id="' + this.id + '-label"></h4>'
                    + '</div>'
                    + '<div class="modal-body"></div>'
                    + '<div class="modal-footer">'
                    + createButton(that.text.close, true)
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>');
                $('body').append($elm);

                $elm.on('hide.bs.modal', doHide);
            }
            return $elm;
        };
        /**
         * @returns {$}
         */
        this.getContentElement = function () {
            return this.element().find('.modal-content');
        };

        /**
         * @returns {string}
         */
        this.getTitle = function () {
            return this.element().find('.modal-title').html();
        };
        /**
         * @param html
         * @returns {pipas.modal}
         */
        this.setTitle = function (html) {
            html = html ? html.trim() : '';
            this.element().find('.modal-title').html(html);
            var header = this.element().find('.modal-header');
            if (html) {
                header.show();
            }
            else header.hide();
            return this
        };
        /**
         * @returns {string}
         */
        this.getBody = function () {
            return this.element().find('.modal-body').html();
        };
        /**
         * @param html
         * @returns {pipas.modal}
         */
        this.setBody = function (html) {
            this.element().find('.modal-body').html(html ? html : '');
            return this
        };
        /**
         * @returns {string}
         */
        this.getFooter = function () {
            return this.element().find('.modal-footer').html();
        };
        /**
         * @param html
         * @returns {pipas.modal}
         */
        this.setFooter = function (html) {
            this.element().find('.modal-footer').html(html ? html : '');
            return this
        };
        /**
         * @returns {pipas.modal}
         */
        this.setSizeSmall = function () {
            this.element().find('> div').attr('class', 'modal-dialog modal-sm');
            return this;
        };
        /**
         * @returns {pipas.modal}
         */
        this.setSizeMedium = function () {
            this.element().find('> div').attr('class', 'modal-dialog');
            return this;
        };
        /**
         * @returns {pipas.modal}
         */
        this.setSizeLarge = function () {
            this.element().find('> div').attr('class', 'modal-dialog modal-lg');
            return this;
        };
        /**
         * @returns {pipas.modal}
         */
        this.show = function () {
            this.element().modal({backdrop: false, show: true});
            overlay.show(this.id + "overlay");
            return this
        };
        /**
         * @returns {bool}
         */
        this.isVisible = function () {
            return this.element().is(':visible');
        };
        /**
         * @returns {pipas.modal}
         */
        this.hide = function () {
            doHide();

            return this
        };
        /**
         * @returns {pipas.modal}
         */
        this.showSpinner = function () {
            spinner.show(this.id, this.id + ' .modal-dialog');
            this.element().find('.pipas-overlay').css('border-radius', '6px');
            return this
        };
        /**
         * @returns {pipas.modal}
         */
        this.hideSpinner = function () {
            spinner.hide(this.id);
            return this
        };
        /**
         * Move forms from body to footer
         */
        this.moveButtons = function () {
            var elm = this.element();
            var $footer = elm.find('.modal-footer');
            $footer.empty();
            elm.find(".modal-body form input[type='submit']").each(function () {
                var $formButton = $(this).hide();
                var $button = $(createButton($formButton.val()));
                $button.addClass($formButton.attr('class'));
                $footer.append($button);
                $button.off("click").on("click", function () {
                    $formButton.click();
                });
            });
            //Button close
            $footer.append(createButton(that.text.close, true));
        };
        /**
         * Set url for header refresh button
         * @returns {pipas.modal}
         */
        this.setRefreshUrl = function (url) {
            //Cut prefix http://domain-name.com/
            url = url.replace(/.*?:\/\/[^\/]+/g, "");
            this.element().find('.modal-header .refresh').attr('href', url);
            return this;
        };
        /**
         * Get url for header refresh button
         * @returns {string}
         */
        this.getRefreshUrl = function () {
            return this.element().find('.modal-header .refresh').attr('href');
        };

        /**
         * Check if passed element is at modal
         * @param element
         * @returns {boolean}
         */
        this.containsElement = function (element) {
            return $(element).closest(".modal").length > 0 ? true : false;
        }
    };
})(jQuery, pipas, pipas.spinner, pipas.overlay);
/**
 * Bower dependency loading
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    /**
     * @deprecated
     * @type {bower}
     */
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
         * @returns {boolean} If current url is same as requested, returns false
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
                    return false;
                history.pushState({
                    type: this.stateTypeName,
                    url: url
                }, null, url);

                return true;
            }
            else {
                console.error("Can not write URL");
            }
            return false;
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
        },
        /**
         * Make clone of object
         * @param {Object} obj
         * @returns {Object}
         */
        tryClone: function (obj) {
            if (obj) {
                var newObj = {};
                for (var p in obj) {
                    try {
                        newObj[p] = JSON.parse(JSON.stringify(obj[p]));
                    } catch (e) {
                    }
                }
                return newObj;
            }
            return obj;
        }
    }
})(pipas);
/*
 * Error reporting
 */
(function (message) {
    $.nette.ext('error', {
        prepare: function (settings) {
            this.init(settings);
        },
        error: function (jqXHR, status, error, settings) {
            if (jqXHR.status == 403 || jqXHR.status == 404) {
                message.showError(jqXHR.status + ' - ' + jqXHR.statusText);
            }
            else if (jqXHR.statusText == 'abort') {
                //ignored aborted
            }
            else if (jqXHR.readyState == 0) {
                message.showError("Connection failed. Please check your internet connection.");
            }
            else {
                message.showError("Link has failed to load.");
            }
        },
        success: function (payload, status, jqXHR, settings) {
            if (payload == "" && settings.error.showWarning) message.showWarning("No response received");
        }
    }, {
        defaults: {
            showWarning: true
        },
        init: function (settings) {
            settings.error = $.extend({}, this.defaults, settings.error)
        },
        ignoreWarning: function (settings) {
            this.init(settings);
            settings.error.showWarning = false;
        }
    });
})(pipas.message);


/*
 * Find document messages and shows them to modal window
 *
 * data-message-container="identifier"
 * data-message-overlay="false"
 */
(function ($, document, message) {
    $.nette.ext('message', {
        init: function () {
            this.parseElement($("body"));
        },
        success: function (payload) {
            if (payload.snippets) {
                for (var id in payload.snippets) {
                    this.parseElement($("#" + id));
                }
            }
            if (payload.messages) {
                if ((typeof payload.messages ) == 'string') {
                    message.showInfo(payload.messages);
                } else {
                    for (var type in payload.messages) {
                        message.show(payload.messages[type], type);
                    }
                }
                delete payload.messages;
            }
        }
    }, {
        mapping: {
            ".flashMessage": "info",
            ".flashMessageDanger": "danger",
            ".flashMessageInfo": "info",
            ".flashMessageSuccess": "success",
            ".flashMessageWarning": "warning",
            ".flashMessages .alert-error": "danger",
            ".flashMessages .alert-danger": "danger",
            ".flashMessages .alert-info": "info",
            ".flashMessages .alert-success": "success",
            ".flashMessages .alert-warning": "warning",
            "form ul.error li": "danger",
            "form .alert-danger": "danger"
        },
        parseElement: function ($elm, container) {
            var that = this;
            for (var key in this.mapping) {
                $elm.find(key).each(function () {
                    message.show($(this).html(), that.mapping[key], container, $(this).parent().attr('title'));
                    $(this).remove();
                });
            }
        }
    });

})(jQuery, document, pipas.message);
/*
 * Redirection if on target ajax page is required snipped missing on current page
 */
(function () {
    $.nette.ext('missingSnippet', {
        prepare: function (settings) {
            settings.missingSnippetEnabled = settings.missingSnippetEnabled || true;
        },
        success: function (payload, status, jqXHR, settings) {
            if (payload.snippets && settings.missingSnippetEnabled) {
                for (var name in payload.snippets) {
                    if ($("#" + name).length == 0) {
                        document.location.href = settings.url;
                    }
                }
            }
        }
    }, {
        disable: function (settings) {
            settings.missingSnippetEnabled = false;
        },
        enable: function (settings) {
            settings.missingSnippetEnabled = true;
        }
    });
})();


/*
 * If called element contains class ajax-modal,opens AJAX response at bootstrap modal window
 *
 * classes:
 *  - modal-ajax:       Cause open response at modal
 *  - modal-ajax-lg:    Resize to large dialog
 *  - modal-ajax-md:    Resize to medium dialog
 *  - modal-ajax-sm:    Resize to small dialog
 *  - modal-ajax-no-header Show modal without header
 */

(function ($, modal, messages, pipasUrl, pipasSpinner) {
    $.nette.ext('modal-ajax', {
        prepare: function (settings) {
            this.init(settings);
            var $elm;
            if (settings.nette && ($elm = settings.nette.el)) {
                if ($elm.hasClass("modal-ajax") || $elm.parents('#' + modal.id).length > 0)  settings.modalAjax.enabled = true;

                if (settings.modalAjax.enabled) {
                    if ($elm.hasClass("modal-ajax-md")) modal.setSizeMedium();
                    else if ($elm.hasClass("modal-ajax-sm"))modal.setSizeSmall();
                    else if ($elm.hasClass("modal-ajax-lg"))modal.setSizeLarge();

                    if ($elm.hasClass("modal-ajax-no-header")) modal.setTitle("");
                    modal.getContentElement().removeClass("modal-danger modal-warning modal-success");
                    if ($elm.hasClass("modal-ajax-danger")) modal.getContentElement().addClass("modal-danger");
                    else if ($elm.hasClass("modal-ajax-warning")) modal.getContentElement().addClass("modal-warning");
                    else if ($elm.hasClass("modal-ajax-success")) modal.getContentElement().addClass("modal-success");


                    if ($elm.attr("title") && $elm.parents(".modal-header").length == 0)modal.setTitle($elm.attr("title"));
                    //disable spinner extension
                    var spinner = this.ext("spinner");
                    if (spinner)spinner.disable(settings);
                    //disable missing snippet extension
                    var snippets = this.ext("missingSnippet");
                    if (snippets)snippets.disable(settings);
                    //ignore warning if empty response is received
                    var error = this.ext("error");
                    if (error)error.ignoreWarning(settings);
                    //disable URL address changes
                    var redirect = this.ext("redirect");
                    //check if extension is defined and if is defined method disable what is used at override default nette extension
                    if (redirect && redirect.disableUrlChange)redirect.disableUrlChange(settings);

                    //prepare modal
                    var that = this;
                    settings.modalAjax.wasOpen = modal.isVisible();
                    settings.modalAjax.previousTitle = modal.getTitle();
                    modal.show();
                    modal.element().on('hide.bs.modal', function () {
                        if (that.jqXHR)that.jqXHR.abort();
                    });
                    //Add to url information about modal mode
                    settings.url = that.applyUrlParams(settings.url);
                }
            }
        },
        before: function (jqXHR, settings) {
            if (settings.modalAjax.enabled) {
                if (this.jqXHR)this.jqXHR.abort();// Abort previous jqXHR
                this.jqXHR = jqXHR;
            }
        },
        start: function (jqXHR, settings) {
            if (settings.modalAjax.enabled) {
                modal.showSpinner();
            }
        },
        success: function (payload, status, jqXHR, settings) {
            if (settings.modalAjax.enabled) {
                modal.setRefreshUrl(pipasUrl.remove(settings.url, '_target'));
                if (typeof payload == 'string') {
                    var documentPattern = /^<[\!]?(doctype|html)[^>]*>/i;
                    if (documentPattern.test(payload)) {
                        alert("Can not load content from url: " + settings.url + " as modal, because is returning HTML page, but only clipping is expected");
                        //Hide if body is empty
                        if (modal.getBody().trim() == "")modal.hide();
                    } else {
                        modal.setBody(payload);
                        modal.moveButtons();
                    }
                } else if (payload && payload.snippets) {
                    var title, body, i;
                    for (i in this.snippetMap.title) {
                        if ((title = payload.snippets[this.snippetMap.title[i]])) {
                            var titleTrimmed = title.trim();
                            if (titleTrimmed)modal.setTitle(title);//ignore empty title
                            break;
                        }
                    }
                    for (i in this.snippetMap.body) {
                        if ((body = payload.snippets[this.snippetMap.body[i]])) {
                            modal.setBody(body);
                            modal.moveButtons();
                            break;
                        }
                    }
                    //Parse response from payload
                } else if (payload) {
                    if (payload.redirect) {
                        var redirect = this.ext("redirect");
                        //If redirection is forbidden, modal is closed
                        if (redirect && !redirect.isEnabled(settings)) {
                            modal.hide();
                        }
                    }
                    else if (payload.refresh) {
                        modal.hide();
                        pipasSpinner.show("refreshFromModal", "body");
                        location.reload();
                    }
                    else if(payload.close){
                        modal.hide();
                    }
                    //messages
                    if (payload[0] && $.isArray(payload) && typeof payload[0] == 'string') {
                        messages.showInfo(payload[0]);
                        modal.hide()
                    }
                }

                // Close dialog if is received empty response
                if (!payload || $.isEmptyObject(payload) || (typeof payload == 'string' && payload.trim() == "")) {
                    modal.hide();
                }
                //Parse messages from body and if after that is body empty, close modal
                var message = this.ext('message');
                if (message && modal.getBody().trim() != "") {
                    message.parseElement(modal.element());
                    if (modal.getBody().trim() == "")modal.hide();
                }

                //rerun nette form
                if (window.Nette) {
                    modal.element().find('form').each(function () {
                        window.Nette.initForm(this);
                    });
                }
            }
        },
        error: function (jqXHR, status, error, settings) {
            if (settings.modalAjax.enabled) {
                modal.setTitle(settings.modalAjax.previousTitle);
                if (!settings.modalAjax.wasOpen)modal.hide();
            }
        },
        complete: function (jqXHR, status, settings, netteAjax) {
            if (settings.modalAjax.enabled) {
                modal.hideSpinner();
                this.jqXHR = null;
                netteAjax.load();//refresh event handlers
            }
        }
    }, {
        defaults: {
            enabled: false,
            wasOpen: false,
            previousTitle: ""
        },
        init: function (settings) {
            settings.modalAjax = $.extend({}, this.defaults, settings.modalAjax)
        },
        jqXHR: null,
        snippetMap: {
            title: [
                "snippet--modalTitle"
            ],
            body: [
                "snippet--modalContent",
                "snippet--modal"
            ]
        },
        applyUrlParams: function (url) {
            return pipasUrl.append(url, "_target", "modal");
        },
        enable: function (settings) {
            settings.modalAjax.enabled = true;
            return settings;
        },
        isTargetModal: function (settings) {
            return settings.modalAjax && settings.modalAjax.enabled;
        }
    });

})(jQuery, pipas.modal, pipas.message, pipas.url, pipas.spinner);
/*
 * Support for nette $this->redirect()
 *
 * Example for manual calling
 * $.nette.ajax({
 *          redirect: false     // Disable redirection from server
 *          redirectUrl: false  // Disable url address changes
 *      }
 * });
 *
 * For disabling redirection apply class "no-redirect"
 */
(function ($, document, PipasUrl, PipasUtils) {
    $.nette.ext('redirect', false);
    $.nette.ext('redirect', {
        init: function () {
            //Setup document history
            PipasUrl.history.push(PipasUrl.clean(document.location.href));
            $(window).on("popstate", function (evt) {
                var state = evt.originalEvent.state;
                if (state) {
                    if (state.type && state.type === PipasUrl.stateTypeName) {
                        $.nette.ajax({
                            url: document.location.href,
                            type: 'GET'
                        });
                    } else {
                        document.location.reload();
                    }
                }
            });
        },
        prepare: function (settings) {
            if (settings.redirect == undefined)settings.redirect = true;
            if (settings.redirectUrl == undefined)settings.redirectUrl = true;
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm && $elm.hasClass("no-redirect")) {
                    settings.redirect = false;
                }
                if ($elm && $elm.hasClass("no-redirect-url")) {
                    settings.redirectUrl = false;
                }
            }
        },
        success: function (payload, status, jqXHR, settings) {
            if (settings.redirect !== false) {
                if (typeof payload === "string" && this.startsWith(payload.trim(), "<!DOCTYPE html")) {
                    //if is returned pure html, document must be hard redirected to target url
                    document.location.href = settings.url;
                }
                else if (payload.redirect) {
                    if (payload.noAjax && payload.noAjax === true) {
                        //redirect without ajax
                        document.location.href = payload.redirect;
                        return false;
                    } else {
                        var clonedSettings = PipasUtils.tryClone(settings);
                        clonedSettings.url = payload.redirect;
                        //AJAX redirect
                        $.nette.ajax(clonedSettings);
                    }
                    //enable url changes only for GET requests
                } else if ((settings.type == undefined || settings.type == "get") && settings.redirectUrl) {
                    PipasUrl.changeTo(settings.url);
                }
            }
        }
    }, {
        startsWith: function (string, prefix) {
            var sliced = string.slice(0, prefix.length);
            return sliced.toLowerCase() == prefix.toLowerCase();
        },
        /**
         * Enable for other extensions check if redirect is allowed
         * @param settings
         * @returns {boolean}
         */
        isEnabled: function (settings) {
            return settings.redirect !== false;
        },
        /**
         * Disable redirection
         * @param settings
         * @returns {*}
         */
        disable: function (settings) {
            settings.redirect = false;
            return settings;
        },
        /**
         * Disable page url changes
         * @param settings
         * @returns {*}
         */
        disableUrlChange: function (settings) {
            settings.redirectUrl = false;
            return settings;
        }

    });
})(jQuery, document, pipas.url, pipas.utils);
/*
 * Show spinner for every ajax requests
 *
 * Example for manual calling
 * $.nette.ajax({
 *          spinner:{
 *              show: false     // Disable|enable spinner
 *              parent: "body"  // Parent element jquery selector
 *              id: "myEvent"   // Custom element identifier
 *          }
 *      }
 * });
 *
 * OR shortly
 *
 * $.nette.ajax({
 *          spinner: false
 *      }
 * });
 *
 * For disabling spinner on html elements appends class 'no-spinner' to anchor element: <a href="ajax/request" class="no-spinner" data-spinner="parent identifier">
 */
(function ($, document, window, spinner) {
    $.nette.ext('spinner', {
        init: function () {
            $(document).on('keydown keyup', this.onRefresh);
            // Force hide spinner after initialization
            spinner.cancel();
        },
        prepare: function (settings) {
            this.init(settings);
            if (!settings.spinner.id) {
                settings.spinner.id = "spinner-" + Math.floor((Math.random() * 1000) + 1);
            }
            if (settings.nette) {
                if (settings.nette.el) {
                    var $elm = settings.nette.el;
                    if ($elm) {
                        if ($elm.hasClass("no-spinner")) {
                            settings.spinner.show = false;
                            return;
                        }
                        // Find no-spinner on form
                        if (settings.nette.form && settings.nette.form.hasClass("no-spinner")) {
                            settings.spinner.show = false;
                            return;
                        }

                        // Try find data-spinner
                        var parent = $elm.data("spinner");//On element occurred dispatch (anchor o form button)
                        if (parent) {
                            settings.spinner.parent = parent;
                        } else if (settings.nette.form) {
                            // Try find attribute on form element
                            parent = settings.nette.form.data("spinner");
                            if (parent) {
                                settings.spinner.parent = parent;
                            }
                        }
                    }
                }
            }
        },
        start: function (jqXHR, settings) {
            if (!settings.spinner.show)return;
            spinner.show(settings.spinner.id, settings.spinner.parent);
        },
        complete: function (payload, state, settings) {
            if (!settings.spinner.show)return;
            spinner.hide(settings.spinner.id);
        }
    }, {
        defaults: {
            show: true,
            parent: null,
            id: null
        },
        init: function (settings) {
            var isFalse = settings.spinner === false;
            var isTrue = settings.spinner === true;
            settings.spinner = $.extend({}, this.defaults, settings.spinner);
            if (isFalse)settings.spinner.show = false;
            if (isTrue)settings.spinner.show = true;
        },
        disable: function (settings) {
            this.init(settings);
            settings.spinner.show = false;
            return this;
        },
        onRefresh: function (e) {
            if (e.which === 116) {
                spinner.show("F5");
            }
            if (e.which === 82 && e.ctrlKey) {
                spinner.show("CTRL+F5");
            }
        }
    });
})(jQuery, document, window, pipas.spinner);


/**
 * On Scroll fixed headers for tables
 *
 * for using apply class "table-fixedHeader" to table element
 */
(function ($, window) {
    $.nette.ext("table-fixedHeader", {
        init: function () {
            $(window)
                .on("scroll", {ext: this}, this.moveEvent)
                .on("resize", {ext: this}, this.remakeAndMoveEvent);
        },
        load: function () {
            this.remake();
            this.move();
        }
    }, {
        targetClass: "table-fixedHeader",
        headerClass: "fixed-header-of-table",
        tables: [],//list of tables under their fixed header id
        remakeAndMoveEvent: function (event) {
            var that = event.data.ext;
            that.remake();
            that.move();
        },
        moveEvent: function (event) {
            event.data.ext.move();
        },
        remake: function () {
            // Remove existing
            $("." + this.headerClass).remove();
            this.tables = [];
            //create new
            var ext = this;
            $("." + this.targetClass).each(function () {
                var $table = $(this);
                var id = ext.createId($table);
                ext.createHeader($table, id);
                ext.tables[id] = $table;
            });
        },
        move: function () {
            var bodyPadding = parseInt($('body').css('paddingTop'));
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            for (var id in this.tables) {
                var offestStart = this.tables[id].offset().top - bodyPadding;
                var headerSize = this.tables[id].find('thead').height();
                var offsetEnd = offestStart + this.tables[id].height() - headerSize + bodyPadding;
                var $header = $("#" + this.tables[id].attr('data-fixed-header-id'));
                if (scrollTop >= offestStart && $header.is(":hidden") && scrollTop <= offsetEnd) {
                    $header.show();

                    var offsetLeft = $header.attr("data-leftOffset");
                    if (typeof offsetLeft === typeof undefined || offsetLeft === false) {
                        //Save left offset
                        $header.attr("data-leftOffset", $header.offset().left - scrollLeft);
                    }
                    $header.css('top', bodyPadding);
                }
                else if (scrollTop < offestStart || scrollTop > offsetEnd) {
                    $header.hide();
                }
                var headerLeftOffset = parseInt($header.attr("data-leftOffset"));
                if (headerLeftOffset) {
                    $header.css("left", headerLeftOffset - scrollLeft);
                }
            }
        },
        createId: function ($table) {
            var id = $table.attr('data-fixed-header-id') != null ? $table.attr('data-fixed-header-id') : 'fixed-header-' + Math.floor((Math.random() * 10000) + 1);
            $table.attr('data-fixed-header-id', id);
            return id;
        },
        createHeader: function ($table, id) {
            var $header = $($table[0].cloneNode(false));//clone tag without childs
            $header.attr('id', id);
            $header.addClass(this.headerClass);
            $table.after($header);

            //Fix header elements width
            $header.width($table.width());
            $table.find("> thead *").each(function () {
                $(this).width($(this).width());
            });
            $header.append($table.find("> thead").clone());
            $header.css({
                position: "fixed",
                top: 0,
                display: "none",
                borderBottom: "3px solid #666",
                zIndex: 950
            });
            return $header;
        }
    });
})(jQuery, window);
/*
 * Manage request an abort duplicated
 *
 * Manual calling:
 * $.nette.ajax({
 *          // True             - aborts all previous requests
 *          // False            - enable call same request multiple
 *          // Undefined||Null  - abort same previous request
 *          // string           - abort all previous requests with same identifier
 *          unique: false
 *      }
 * }); *
 *
 * Element attributes and classes: *
 * Class:       "no-unique"                 - disable aborting
 * Class:       "unique"                    - abort all previous requests
 * Attribute:   data-unique = "identifier"  - abort all previous request with same identifier
 *
 * Abort is called to if ESC is pressed
 */
(function ($, document) {
    $.nette.ext('unique', false);
    $.nette.ext('unique', {
        init: function () {
            $(document).keyup(function (e) {
                //ESC press
                if (e.keyCode == 27) {
                    $.nette.ext('unique').abortAll();
                }
            });
        },
        prepare: function (settings) {
            var identifier;
            if (settings.unique === undefined)settings.unique = null;
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm) {
                    identifier = $elm.data("unique");
                    if ($elm.hasClass("no-unique")) {
                        settings.unique = false;
                    } else if ($elm.hasClass("unique")) {
                        settings.unique = true;
                    }
                }
            }
            //set key
            if (typeof settings.unique == "string") {
                settings.uniqueKey = settings.unique;
                settings.unique = null;
            }
            else if (identifier)settings.uniqueKey = identifier;
            else settings.uniqueKey = settings.url;
        },
        before: function (xhr, settings) {
            if (settings.unique === null) {
                this.abortBy(settings.uniqueKey);
            }
            else if (settings.unique === true) {
                this.abortAll();
            }
            if (this.XHRs[settings.uniqueKey] == undefined)this.XHRs[settings.uniqueKey] = [];
            this.XHRs[settings.uniqueKey].push([xhr]);//xhr must be surrounded by one extra array, because in normal way it occur mistakes during abortion (it aborting only even requests)
        },
        complete: function (jqXHR, status, settings) {
            if (this.XHRs[settings.uniqueKey]) {
                var index = this.XHRs[settings.uniqueKey].indexOf(jqXHR);
                if (index >= 0)this.XHRs[settings.uniqueKey].splice(index, 1);
                if (Object.keys(this.XHRs[settings.uniqueKey]).length == 0) delete this.XHRs[settings.uniqueKey];
            }
        }
    }, {
        //list of grouped xhrs
        XHRs: {},
        abortAll: function () {
            for (var id in this.XHRs) {
                this.abortBy(id);
            }
        },
        abortBy: function (identifier) {
            if (this.XHRs[identifier]) {
                for (var key in this.XHRs[identifier]) {
                    this.XHRs[identifier][key][0].abort();
                }
                delete this.XHRs[identifier];
            }
        },
        setAsUnique: function (settings) {
            settings.unique = true;
            return this;
        }
    });
})(jQuery, document);

/*
 * Ajax upload control
 *
 * Assigned to input file for uploading of file with progress bar
 * Example: <input type="file" name="photos" data-upload-url="" multiple>
 *
 * Attributes:
 * data-upload-url - Upload script
 * data-upload-status-url - Url for obtaining of upload processing status
 * data-upload-on-upload - Javascript called after uploading
 * data-upload-on-success - Javascript called after uploading and finishes processing
 */
(function ($, upload) {
    $.nette.ext('upload', {

        load: function () {
            var self = this;
            for (var i in self.registered) {
                self.registered[i].destroy();
            }
            var selector = "input[type='file'][data-upload-url]";
            $(selector).each(function () {
                var $elm = $(this);
                var id = $elm.attr("id");
                if (!id) {
                    id = "fileUploadControl-" + Math.floor((Math.random() * 10000) + 1);
                    $elm.attr("id", id);
                }
                var uploadUrl = $elm.attr("data-upload-url");
                var control = pipas.upload.create("#" + id, uploadUrl);
                if ($elm.attr("data-upload-status-url")) {
                    control.processingStatusUrl = $elm.attr("data-upload-status-url");
                }
                if ($elm.attr("data-upload-on-upload")) {
                    control.onUpload.push(function () {
                        var res = eval($elm.attr("data-upload-on-upload"));
                        if (typeof res == 'function') {
                            res.apply(this, arguments);
                        }
                    });
                }
                if ($elm.attr("data-upload-on-success")) {
                    control.onSuccess.push(function () {
                        var res = eval($elm.attr("data-upload-on-success"));
                        if (typeof res == 'function') {
                            res.apply(this, arguments);
                        }
                    });
                }
                self.registered[id] = control;
            });
        }
    }, {
        registered: {}
    });
})(jQuery, pipas.upload);

/**
 * Nette AJAX initialization for:
 * - Anchors
 * - Forms without file upload
 * - Form submitted by select control with class "submit"
 *
 * Important selectors
 * - .no-ajax
 * - form select.submit
 *
 * Include this file after all extensions
 */
$(function () {
    if (navigator.userAgent.indexOf("MSIE") === "MSIE" && parseInt(navigator.appVersion, 10) < 9) {
        $.nette.init();
    } else {
        $.nette.init(function (rh) {
            //Anchors
            $('a[href]:not(.no-ajax,[target="_blank"],[href=""]):not([href^="javascript:"])')
                .off('click', rh)
                .on('click', rh);

            //Forms
            $('form:not(.no-ajax)')
                .off('submit', rh)
                .on('submit', rh)
                .off('click', ':image', rh)
                .on('click', ':image', rh)
                .off('click', ':submit', rh)
                .on('click', ':submit', rh);

            //Form select with class "submit"
            var formChangeCb = function (e) {
                $(this).parents("form").submit();
                e.preventDefault();
            };
            $('form:not(.no-ajax) select.submit')
                .off('change', formChangeCb)
                .on('change', formChangeCb);
        });
    }
});