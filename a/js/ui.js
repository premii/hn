

(function($hn) {
    'use strict';

    document.querySelector('html').classList.add('show-app');
    var CLASS_PAGE_HOME = 'page-home',
        homePage = $('.' + CLASS_PAGE_HOME),
        homePageBody = $('.bd', homePage);

    var showHome = function() {
        $hn.loading.hide();
        $hn.showPage(CLASS_PAGE_HOME);
    };
    PubSub.subscribe('show-home', showHome);

    var listItemTemplate = $('.template-list-item').html(),
        listItemTemplatePrerender = $hn.prerender(listItemTemplate);

    var loadHomeContent = function(data) {
        var html = '',
            t0Render = +new Date();

        $.each(data, function(index, item) {
            if (item.domain && item.url) {
                item.self = false;
                item.urlTitle = item.url.replace('http://', '').replace('https://', '');
            }
            else {
                item.self = true;
                item.urlTitle = ''
            }
            item.text = item.text || '';
            if (item.id) {
    //            html += $hn.t(listItemTemplate, item);
                html += listItemTemplatePrerender(item);
            }
        });

        $hn.loading.hide();
        homePageBody.parent().get(0).scrollTop = 0;
        //homePageBody.html('<ul class="list">' + html + '</ul>');
        homePageBody[0].innerHTML = '<ul class="list">' + html + '</ul>';
        $hn.perf.update('list', 'render', +new Date() - t0Render);
    };

    var firstTime = true;

    var loadHome = function(reload) {
        reload = reload || false;
        $hn.data.getArticles(loadHomeContent, reload);
        //$('h1', homePage).html('Hacker News');
        $('h1', homePage)[0].innerHTML = 'Hacker News';

        if (firstTime) {
            firstTime = false;
            PubSub.publish('first-time');
        }
    };

    var reloadHome = function() {
        loadHome(true);
    };

    var filterHome = function(type, title) {
        console.log(type, title);
        $hn.data.getArticlesByType(type, loadHomeContent);
        //$('h1', homePage).html(title)
        $('h1', homePage)[0].innerHTML = title;
    };

    PubSub.subscribe('filter-home', filterHome);
    PubSub.subscribe('reload-home', reloadHome);
    PubSub.subscribe('load-home', loadHome);



    //loadHome();
}(window.$hn));


(function($hn) {

    'use strict';
    var CLASS_SHOW_PAGE = 'show-page';

    var updatePageTitle = function(title) {
        document.title = "Hacker News" + (typeof title == 'undefined' ?  "" : (": " + title));
    };

    PubSub.subscribe('page-title', updatePageTitle);

    var showPage = function(className, title) {
        var visiblePage = $('.' + CLASS_SHOW_PAGE);
        console.log(className, visiblePage);
        if (!visiblePage.hasClass(className)) {
            visiblePage.removeClass(CLASS_SHOW_PAGE);
            PubSub.publish('onPageHidden', visiblePage.data('page'));
            $("." + className).addClass(CLASS_SHOW_PAGE);
            updatePageTitle(title);
        }
    };

    $hn.showPage = showPage;

}(window.$hn));


(function($hn) {
    'use strict';

    var CLASS_PAGE_SETTINGS = 'page-about',
        aboutPage = $('.' + CLASS_PAGE_SETTINGS),
        showAboutPage = function() {
            var templateHtml = $('.template-' + CLASS_PAGE_SETTINGS).html();
            aboutPage[0].innerHTML = (templateHtml);
            $hn.showPage(CLASS_PAGE_SETTINGS, 'About');
        },
        onClick = function(link, event) {
            $hn.loading.hide();
            console.log(link);
            if (link.hasClass('back-home')) {
                PubSub.publish('show-home');
            }
        };

    PubSub.subscribe('show-about', showAboutPage);
//    PubSub.subscribe('first-time', showAboutPage);
    $hn.onClick('.page-about a', onClick);

}(window.$hn));

(function($hn) {
    'use strict';

    var CLASS_PAGE_SETTINGS = 'page-settings',
        settingsPage = $('.' + CLASS_PAGE_SETTINGS),
        changeTheme = function(theme) {
            var htmlNode = $('html');
            htmlNode.removeClass('theme-' + htmlNode.data('theme')).addClass('theme-' + theme).data('theme', theme);

            if (theme == 'default') {
                $.removeCookie('theme');
            }
            else {
                $.cookie('theme', theme, {expires: 365*5});
            }
            $('.change-theme.selected', settingsPage).removeClass('selected');
            $('.change-theme[data-theme="'+theme+'"]', settingsPage).addClass('selected');
        },
        changeFontsize = function(fontsize) {
            var htmlNode = $('html');
            htmlNode.removeClass('font-' + htmlNode.data('font-size')).addClass('font-' + fontsize).data('font-size', fontsize);
            if (fontsize == 'normal') {
                $.removeCookie('fontsize');
            }
            else {
                $.cookie('fontsize', fontsize, {expires: 365*5});
            }
            $('.change-font-size.selected', settingsPage).removeClass('selected');
            $('.change-font-size[data-font-size="'+fontsize+'"]', settingsPage).addClass('selected');
        },
        changeReadComment = function(autoHide) {
            console.log(autoHide);
            var htmlNode = $('html'),
                hideReadCommentClass = 'hide-comment-visited';
            if (autoHide === 'yes') {
                $.removeCookie('hideReadComment');
                htmlNode.addClass(hideReadCommentClass);
            }
            else {
                $.cookie('hideReadComment', 'no', {expires: 365*5});
                htmlNode.removeClass(hideReadCommentClass);
            }
            $('.change-read-comment.selected', settingsPage).removeClass('selected');
            $('.change-read-comment[data-value="'+ autoHide +'"]', settingsPage).addClass('selected');

        },
        showSettings = function() {
            var templateHtml = $('.template-page-settings').html(),
                theme = $.cookie('theme') || 'default',
                fontSize = $.cookie('fontsize') || 'normal',
                autoHideReadComment = $.cookie('hideReadComment') || 'yes',
                versionNode,
                version = $hn.v;

            settingsPage[0].innerHTML = (templateHtml);

            $('.change-theme[data-theme="'+theme+'"]', settingsPage).addClass('selected');
            $('.change-font-size[data-font-size="'+fontSize+'"]', settingsPage).addClass('selected');
            $('.change-read-comment[data-value="'+autoHideReadComment+'"]', settingsPage).addClass('selected');

            versionNode = $('.version', settingsPage);
            versionNode[0].innerHTML = version.app + '-' + version.js + '-' + version.css;

            $hn.showPage(CLASS_PAGE_SETTINGS, 'Settings');
        },
        onClick = function(link, event) {
            $hn.loading.hide();
            console.log(link);
            if (link.hasClass('back-home')) {
                PubSub.publish('show-home');
            }
            else if (link.hasClass('change-theme')) {
                changeTheme(link.data('theme'));
            }
            else if (link.hasClass('change-font-size')) {
                changeFontsize(link.data('font-size'));
            }
            else if (link.hasClass('change-read-comment')) {
                changeReadComment(link.data('value'));
            }
        };

    PubSub.subscribe('show-settings', showSettings);
    $hn.onClick('.page-settings a', onClick);


    var init = function() {
        var theme = $.cookie('theme') || 'default',
            fontSize = $.cookie('fontsize') || 'normal',
            autoHideReadComment = $.cookie('hideReadComment') || 'yes';
        changeTheme(theme);
        changeFontsize(fontSize);
        changeReadComment(autoHideReadComment);
    };
    init();

}(window.$hn));




(function($hn) {

    'use strict';

    var CLASS_ARTICLE_PAGE = 'page-article-content',
        articlePage = $('.' + CLASS_ARTICLE_PAGE),
        templateHtml = $('.template-page-article').html();

    var showArticleContent = function(id) {
        var onCallback = function(article) {
            var t0Render = +new Date(),
                articleContent = $('.article-content', articlePage)[0];

            if (articleContent) {
                articleContent.innerHTML = article.article;
                articleContent.style.height = 'auto';
                $hn.perf.update(id, 'article-render', +new Date() - t0Render);
            }
            else {
                $hn.onError('[Error] articleContent is unknown', 'ui.js', 253);
            }
        };

        $hn.data.getArticleContent(id, onCallback);
    };

    var showArticle = function(id) {
        var onCallback = function(article) {
            $hn.loading.hide();
            var html = $hn.t(templateHtml, article);
            //articlePage.html(html);
            articlePage[0].innerHTML = (html);
            $('.article-content', articlePage)[0].style.height = '5000px';
            $hn.showPage(CLASS_ARTICLE_PAGE, 'Article: ' + article.title);
            showArticleContent(id);
        };

        $hn.data.getArticleMeta(id, onCallback);
    };

    var onPageHidden = function(pageClass) {
        if (pageClass == CLASS_ARTICLE_PAGE) {
            //console.log(pageClass);
            window.setTimeout(function() {
                console.log('clear out dom for .', pageClass);
                articlePage[0].innerHTML = '';
            }, 300);
        }
    };

    PubSub.subscribe('show-article', showArticle);

    PubSub.subscribe('onPageHidden', onPageHidden);
}(window.$hn));

(function($hn) {

    'use strict';

    var CLASS_PAGE_ARICLE_COMMENTS = 'page-article-comments',
        commentsPage = $('.' + CLASS_PAGE_ARICLE_COMMENTS),
        commentsTemplate = $('.template-page-article-comments').html(),
        commentsPrerender = $hn.prerender(commentsTemplate),
        commentItemTemplate = $('.template-comment-item').html(),
        commentItemPrerender = $hn.prerender(commentItemTemplate);

    var getCommentsHtml = function(comments, lastReadCommentId, op) {
        var html = '';
        $.each(comments, function(index, item) {
            var obj = $.extend({}, item);
            if (obj.comments) {
                obj.child_comments = getCommentsHtml(obj.comments, lastReadCommentId, op);
            }
            if (obj.user == op) {
                obj.opClass = ' op';
            }
            obj.readClass = obj.id < lastReadCommentId ? 'comment-visited' : ''; //comment-visited
            //html += $hn.t(commentItemTemplate, obj);
            html += commentItemPrerender(obj);
        });
        return '<ul>'+html+'</ul>';
    };

    var showArticleComments = function(id) {
        var onCallback = function(article) {
            var t0Render = +new Date(),
                commentsContainer = $('.article-comments', commentsPage)[0],
                opCommnetNode;

            if (article.content && article.content != '') {
                opCommnetNode = $('.article-meta .op-comment', commentsPage)[0];
                if (opCommnetNode.innerHTML=='') {
                    opCommnetNode.innerHTML = article.content;
                }
            }
            commentsContainer.innerHTML = getCommentsHtml(article.comments, article.lastReadComment || 0, article.user || '');
            commentsContainer.style.height = 'auto';
            $hn.perf.update(id, 'comments-render', +new Date() - t0Render);
        };

        $hn.data.getArticleComments(id, onCallback);
    };

    var showArticleMeta = function(id) {
        var onCallback = function(article) {
            $hn.loading.hide();
            var html = commentsPrerender(article);
            //commentsPage.html(html);
            commentsPage[0].innerHTML = (html);
            $('.article-comments', commentsPage)[0].style.height = '5000px';
            $hn.showPage(CLASS_PAGE_ARICLE_COMMENTS, 'Comments: ' + article.title);
            showArticleComments(id);
        };

        $hn.data.getArticleMeta(id, onCallback);
    };

    var onPageHidden = function(pageClass) {
        if (pageClass == CLASS_PAGE_ARICLE_COMMENTS) {
            console.log(pageClass);
            window.setTimeout(function() {
                console.log('clear out dom for .', pageClass);
                commentsPage[0].innerHTML = '';
            }, 300);
        }
    };

    PubSub.subscribe('onPageHidden', onPageHidden);
    PubSub.subscribe('show-comments', showArticleMeta);
}(window.$hn));



(function($hn) {
    /**
     * Performance related stuff
     */
    var showPerfData = function() {
        var CLASS_PAGE_PERFORMANCE = 'page-performance',
            perfPage = $('.' + CLASS_PAGE_PERFORMANCE),
            templateHtml = $('.template-page-performance').html();

        //perfPage.html(templateHtml);
        perfPage[0].innerHTML = (templateHtml);

        var html = '';
        $.each($hn.perf.data, function(index, item) {
            html += '<h4>' + index + '</h4>';
            if (typeof item == 'object') {
                $.each(item, function(i, subitem) {
                    html += '<div>' + i + ': ' + subitem + '</div>';
                });
            }
            else {
                html += '<div>' + item + '</div>';
            }
        });

        //$('.bd', perfPage).html(html);
        $('.bd', perfPage)[0].innerHTML = (html);

        $hn.showPage(CLASS_PAGE_PERFORMANCE);

    };

    PubSub.subscribe('show-performance', showPerfData);


    var onClick = function(link, event) {
        if (link.hasClass('back-home')) {
            PubSub.publish('show-home');
        }
    };

    $hn.onClick('.page-performance a', onClick, false);

}(window.$hn));

(function($hn) {

    'use strict';

    var onClick = function(link, event) {
        console.log('onClick()');
        var article = link.closest('LI'),
            CLASS_SHOW_SUBMENU = 'show-submenu';

        if (link.hasClass('story')){
            if (link.data('hn') == true) {
            //    alert('HN post, no article');
                $hn.loading.hide();
            }
            else {
                $hn.history.pushState({'publish': 'show-article', args: article.data('id'), url: link.attr('href')}, 'Article', link.attr('href'));
                PubSub.publish('show-article', article.data('id'));
                link.addClass('visited');
            }
        }
        else if (link.hasClass('comments')) {
            $hn.history.pushState({'publish': 'show-comments', args: article.data('id'), url: link.attr('href')}, 'Article', link.attr('href'));
            PubSub.publish('show-comments', article.data('id'));
            link.addClass('visited');
        }
        else if (link.hasClass('reload')) {
            PubSub.publish('reload-home');
        }
        else {
            if (link.hasClass('toggle-submenu')) {
                $hn.loading.hide();
            }
            else if (link.hasClass('filter-fp')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('load-home', link.text());
            }
            else if (link.hasClass('filter-ask-hn')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('filter-home', 'AskHn', link.text());
            }
            else if (link.hasClass('filter-show-hn')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('filter-home', 'ShowHn', link.text());
            }
            else if (link.hasClass('filter-today-top-10')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('filter-home', 'todayTop10', link.text());
            }
            else if (link.hasClass('filter-week-top-10')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('filter-home', 'weekTop10', link.text());
            }
            else if (link.hasClass('filter-yesterday-top-10')) {
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
                PubSub.publish('filter-home', 'yesterdayTop10', link.text());
            }
            else if (link.hasClass('show-performance')) {
                $hn.loading.hide();
                PubSub.publish('show-performance');
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
            }
            else if (link.hasClass('show-settings')) {
                $hn.loading.hide();
                PubSub.publish('show-settings');
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
            }
            else if (link.hasClass('show-about')) {
                $hn.loading.hide();
                PubSub.publish('show-about');
                $('.'+CLASS_SHOW_SUBMENU).removeClass(CLASS_SHOW_SUBMENU);
            }
        }
    };

    $hn.onClick('.page-home a', onClick, true);

}(window.$hn));


(function($hn) {

    'use strict';

    var CLASS_SHOW_SUBMENU = 'show-submenu';
    var onClick = function(link, event) {
        console.log(".header-onClick()");
        if (link.hasClass('back-home')){
            $hn.loading.hide();
            $hn.back();
        }
        else if (link.hasClass('show-comments')) {
            $hn.history.pushState({'publish': 'show-comments', args: link.data('id'), url: link.attr('href')}, 'Comments', link.attr('href'));
            PubSub.publish('show-comments', link.data('id'));
        }
        else if (link.hasClass('show-article')) {
            $hn.history.pushState({'publish': 'show-article', args: link.data('id'), url: link.attr('href')}, 'Article', link.attr('href'));
            PubSub.publish('show-article', link.data('id'));
        }
        else if (link.hasClass('toggle-submenu')) {
            $hn.loading.hide();
            link.closest('li').toggleClass(CLASS_SHOW_SUBMENU);
        }
        else {
            $hn.loading.hide();
        }
    };

    $hn.onClick('.header a', onClick, true);

}(window.$hn));

(function($hn) {
    'use strict';
    var onClick = function(event) {
        var link = $(event.target);
        console.log('------------',link, event);
        $hn.loading.hide();

        if (link.attr('target') || link.closest('.article-comments').length > 0 || link.closest('.article-content').length > 0) {
            if ($hn.nativeApp) {
                event.preventDefault();
                window.open(link.attr('href'), '_blank');
            }
            else {
                link.attr('target', '_blank');
            }
        }
    };

    //Using document.on instead of $hn.onclick, as setTimeout doesnt allow to fire preventDefault before navigating links.
    $(document).on('click', '.page-article-comments a', onClick);
    $(document).on('click', '.page-article-content a', onClick);
 //   $(document).on('click', '.article-meta a', onClick);

}(window.$hn));


(function($hn) {
    'use strict';
    var onClick = function(event) {
        var target = $(event.target),
            link = target.closest('A'),
            comment;

        console.log('------------',link, target);

        if (link.length > 0) {

        }
        else {
            comment = target.closest('li');
            console.log(comment);
            if (comment.length > 0) {
                comment = comment[0].querySelector('.comment');
                console.log(comment);
                if (comment) {
                    comment.classList.toggle('comment-visited');
                }
            }
        }
    };

    //Using document.on instead of $hn.onclick, as setTimeout doesnt allow to fire preventDefault before navigating links.
    $(document).on('click', '.page-article-comments', onClick);
 //   $(document).on('click', '.article-meta a', onClick);

}(window.$hn));


(function($hn) {

    'use strict';
    $.cookie('v', $hn.v.app, {expires: 365*5});
}(window.$hn));

