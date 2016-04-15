/*
 * Error reporting
 */
(function (message) {
    $.nette.ext('error', {
        prepare: function (settings) {
            this.init(settings);
        },
        error: function (jqXHR, status, error, settings) {
            if (status != "abort" && jqXHR.readyState != 0) {
                message.showError("Link has failed to load.");
                console.log(arguments);
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

                    if ($elm.attr("title"))modal.setTitle($elm.attr("title"));
                    //disable spinner extension
                    var spinner = this.ext("spinner");
                    if (spinner)spinner.disable(settings);
                    //disable missing snippet extension
                    var snippets = this.ext("missingSnippet");
                    if (snippets)snippets.disable(settings);
                    //ignore warning if empty response is received
                    var error = this.ext("error");
                    if (error)error.ignoreWarning(settings);

                    //prepare modal
                    var that = this;
                    settings.modalAjax.wasOpen = modal.isVisible();
                    settings.modalAjax.previousTitle = modal.getTitle();
                    modal.show();
                    modal.element().on('hide.bs.modal', function () {
                        if (that.jqXHR)that.jqXHR.abort();
                    });
                    //Add to url information about modal mode
                    settings.url = pipasUrl.append(settings.url, "_target", "modal");
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
                            modal.setTitle(title);
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
                        modal.hide();
                    }
                    else if (payload.refresh) {
                        modal.hide();
                        pipasSpinner.show("refreshFromModal", "body");
                        location.reload();
                    }
                    //messages
                    if (payload.message) {
                        messages.showInfo(payload.message);
                        modal.hide()
                    }
                    else if (payload[0] && $.isArray(payload) && typeof payload[0] == 'string') {
                        messages.showInfo(payload[0]);
                        modal.hide()
                    }
                    if (payload.messageInfo) {
                        messages.showInfo(payload.messageInfo);
                        modal.hide()
                    }
                    if (payload.messageError) {
                        messages.showError(payload.messageError);
                        modal.hide()
                    }
                    if (payload.messageWarning) {
                        messages.showWarning(payload.messageWarning);
                        modal.hide()
                    }
                    if (payload.messageSuccess) {
                        messages.showSuccess(payload.messageSuccess);
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
        }

    });

})(jQuery, pipas.modal, pipas.message, pipas.url, pipas.spinner);
/*
 * Support for nette $this->redirect()
 *
 * Example for manual calling
 * $.nette.ajax({
 *          redirect: false     // Disable redirection from server
 *      }
 * });
 *
 * For disabling redirection apply class "no-redirect"
 */
(function ($, document, PipasUrl) {
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
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm && $elm.hasClass("no-redirect"))
                    settings.redirect = false;
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
                        //AJAX redirect
                        $.nette.ajax({
                            url: payload.redirect
                        });
                    }
                    //enable url changes only for GET requests
                } else if (settings.type == undefined || settings.type == "get") {
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
        }
    });
})(jQuery, document, pipas.url);
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
