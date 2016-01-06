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