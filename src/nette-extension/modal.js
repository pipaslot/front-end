/*
 * If called element contains class ajax-modal,opens AJAX response at bootstrap modal window
 *
 * classes:
 *  - modal-ajax:       Cause open response at modal
 *  - modal-ajax-lg:    Opens large dialog
 *  - modal-ajax-sm:    Opens small dialog
 */

(/**
 * @param {jQuery} $
 * @param {pipas.modal} modal
 */
    function ($, modal) {
    $.nette.ext('modal-ajax', {
        prepare: function (settings) {
            settings.modalAjax = {
                enabled: false,
                wasOpen: false,
                previousTitle: ""
            };
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm) {
                    if ($elm.hasClass("modal-ajax")) {
                        settings.modalAjax.enabled = true;
                        modal.setSizeMedium()
                    } else if ($elm.hasClass("modal-ajax-sm")) {
                        settings.modalAjax.enabled = true;
                        modal.setSizeSmall()
                    } else if ($elm.hasClass("modal-ajax-lg")) {
                        settings.modalAjax.enabled = true;
                        modal.setSizeLarge()
                    } else {
                        if ($elm.parents('#' + modal.id).length > 0)settings.modalAjax.enabled = true;
                    }
                    if (settings.modalAjax.enabled) {
                        var that = this;
                        settings.modalAjax.wasOpen = modal.isVisible();
                        settings.modalAjax.previousTitle = modal.getTitle();
                        if ($elm.attr("title"))modal.setTitle($elm.attr("title"))
                        modal.show();
                        modal.showSpinner();
                        modal.element().on('hide.bs.modal', function () {
                            if (that.jqXHR)that.jqXHR.abort();
                        });
                    }
                }
            }
        },
        before: function (jqXHR, settings) {
            if (settings.modalAjax.enabled) {
                if (this.jqXHR)this.jqXHR.abort();// Abort previous jqXHR
                this.jqXHR = jqXHR;
            }
        },
        success: function (payload, status, jqXHR, settings) {
            if (settings.modalAjax.enabled) {
                modal.setBody(payload);
                modal.moveButtons();
                //If is defined message extension, tried to parse messages
                var message = this.ext('message');
                if (message)message.parseElement(modal.element());
                if (!payload || payload.trim() == "") {
                    modal.hide();
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
        id: null,
        jqXHR: null
    });

})(jQuery, pipas.modal);