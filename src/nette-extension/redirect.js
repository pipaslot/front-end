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
            if (settings.redirectUrl == undefined)settings.redirectUrl = true;
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm && $elm.hasClass("no-redirect")){
                    settings.redirect = false;
                }
                if ($elm && $elm.hasClass("no-redirect-url")){
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
                        //AJAX redirect
                        $.nette.ajax({
                            url: payload.redirect,
                            redirectUrl: settings.redirectUrl
                        });
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
})(jQuery, document, pipas.url);