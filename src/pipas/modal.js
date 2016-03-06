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
            return '<button type="button" class="btn btn-default" ' + (closing ? 'data-dismiss="modal"' : '') + '>' + title + '</button>';
        };
        this.id = 'modal-' + Math.round(Math.random() * 10000);
        this.element = function () {
            if (!$elm) {
                $elm = $('<div class="modal fade" id="' + this.id + '" tabindex="-1" role="dialog" aria-labelledby="' + this.id + '-label">'
                    + '<div class="modal-dialog" role="document">'
                    + '<div class="modal-content">'
                    + '<div class="modal-header">'
                    + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                    + '<h4 class="modal-title" id="' + this.id + '-label"></h4>'
                    + '</div>'
                    + '<div class="modal-body"></div>'
                    + '<div class="modal-footer">'
                    + createButton("Close", true)
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>');
                $('body').append($elm);

                $elm.on('hide.bs.modal', function () {
                    that.setBody();
                    that.setTitle();
                    that.hideSpinner();
                    overlay.hide(that.id + "overlay");
                });
            }
            return $elm;
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
            this.element().modal('hide');
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
            var $elm = this.element();
            var $footer = $elm.find('.modal-footer');
            $footer.empty();
            $elm.find(".modal-body form input[type='submit']").each(function () {
                var $formButton = $(this).hide();
                var $button = $(createButton($formButton.val()));
                $button.addClass($formButton.attr('class'));
                $footer.append($button);
                $button.off("click").on("click", function () {
                    $formButton.click();
                });
            });
            //Button close
            $footer.append(createButton("Close", true));
        };
    };
})(jQuery, pipas, pipas.spinner, pipas.overlay);