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