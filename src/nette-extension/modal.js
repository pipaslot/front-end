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
                    //disable page redirection after modal i opened
                    var redirect = this.ext("redirect");
                    //check if extension is defined and if is defined method disable what is used at override default nette extension
                    if (redirect && redirect.disable)redirect.disable(settings);

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
                        modal.hide();
                    }
                    else if (payload.refresh) {
                        modal.hide();
                        pipasSpinner.show("refreshFromModal", "body");
                        location.reload();
                    }
                    //messages
                    if (payload.message) {
                        console.log("payload.message is deprecated. Please use nette extension messages as payload.messages.info[]='my mesage'");
                        messages.showInfo(payload.message);
                        modal.hide()
                    }
                    else if (payload[0] && $.isArray(payload) && typeof payload[0] == 'string') {
                        messages.showInfo(payload[0]);
                        modal.hide()
                    }
                    if (payload.messageInfo) {
                        console.log("payload.messageInfo is deprecated. Please use nette extension messages as payload.messages.info[]='my mesage'");
                        messages.showInfo(payload.messageInfo);
                        modal.hide()
                    }
                    if (payload.messageError) {
                        console.log("payload.messageError is deprecated. Please use nette extension messages as payload.messages.error[]='my mesage'");
                        messages.showError(payload.messageError);
                        modal.hide()
                    }
                    if (payload.messageWarning) {
                        console.log("payload.messageWarning is deprecated. Please use nette extension messages as payload.messages.warning[]='my mesage'");
                        messages.showWarning(payload.messageWarning);
                        modal.hide()
                    }
                    if (payload.messageSuccess) {
                        console.log("payload.messageSuccess is deprecated. Please use nette extension messages as payload.messages.success[]='my mesage'");
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