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