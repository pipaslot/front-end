/*
 * Redirection if on target ajax page is required snipped missing on current page
 */
(function () {
    $.nette.ext('missingSnippet', {
        success: function (payload, status, jqXHR, settings) {
            if (payload.snippets) {
                for (var name in payload.snippets) {
                    if ($("#" + name).length == 0) {
                        document.location.href = settings.url;
                    }
                }
            }
        }
    });
})();

