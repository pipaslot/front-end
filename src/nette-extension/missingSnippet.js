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

