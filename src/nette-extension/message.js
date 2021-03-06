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
                for (var type in payload.messages) {
                    message.show(payload.messages[type], type);
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