(function($hn) {
    'use strict';

    $hn.cookieVersion = $.cookie('v');
    if (!$hn.hnid) {
        $hn.hnid = $.cookie('hnid') || window.store.get('hnid');
        if ($.removeCookie('hnid') && $hn.hnid) {
            window.store.set('hnid', $hn.hnid);
        }
        if (!$hn.hnid) {
            $hn.hnid = '_' + Math.random().toString(36).substr(2, 9);
            window.store.set('hnid', $hn.hnid);
        }
    }
})(window.$hn);

(function($hn) {
    var html = $('html');
    if (html.hasClass("ie")) {
        var className =  html.hasClass("ie-mobile") ? '.css-style-wp8' : '.css-style-w8';
        var no = document.querySelector(className);
        no && cssStyle(no.innerHTML);
    }
    else if ($.os.android && !html.hasClass("android-chrome")) {
        cssStyle(document.querySelector('.css-style-android').innerHTML);
    }

    $(document).on("ajaxError", function (event, xhr, settings, error) {
        console.log("[ajaxError]", xhr, settings, error);
        $hn.onError('[ajaxError] - ' + $hn.v.js + ' - ' + error, settings.url, 'unknown');
    });

})(window.$hn);

(function($hn) {
    'use strict';
    var prerender = function(tmpl) {

        return eval( "(function(data){ return '" +
            tmpl.replace(/[\t|\n]/g, '')
                .replace(/'/g, "\\'")
                .replace((RegExp("{\\s*([a-z0-9_][.a-z0-9_]*)\\s*}", "gi")), function (tag, k) {
                    return "' + ( data." + k + " || '' ) + '";
                })
                .replace( /\s\s+/g, ' ' )
            + "'; })" );
    };

    $hn.prerender = prerender;

    var template = function(tmpl, data, prefix) {
        prefix = prefix || '';
        for (var val in data) {
            if (typeof data[val] === 'object') {
                tmpl = template(tmpl, data[val], val + '.');
            }
            else {
                tmpl = tmpl.split("{" + prefix + val + "}").join(data[val]);
            }
        }
        return tmpl;
    };

    $hn.t = template;

})(window.$hn);

(function($hn) {


    var debug = function() {

        var domUpdatedCount = 0,
            domInsert = function(count) {
                domUpdatedCount = count;
            },
            showLog = function() {
                $('.debug-log').html(
                    ['<div>Dom Update Count: ' +  domUpdatedCount + '</div>',

                        ''
                    ].join('')

                );
            };

        return {
            domInsert : domInsert,
            showLog: showLog
        }
    }();
//    $hn.debug = debug;

    $hn.ajax = $.ajax;

    //if ($.os.ios)
    {
        $hn.fastClick = FastClick.attach(document.body);
    }

}(window.$hn));


(function($hn){

    var loading = function() {
        var node = document.getElementById("loading"),
            CLASS_SHOW_LOADING = 'show-loading';

        return {
            hide : function() {
                node.className = "";
            },
            show: function(x, y) {
                node.setAttribute("style", "top: " + y + "px; left: " + x + "px;");
                node.className = CLASS_SHOW_LOADING;
            },
            isVisible : function() {
                return node.className === CLASS_SHOW_LOADING;
            }
        };
    }();

    $hn.loading = loading;


    var onLinkClick = function(link, event) {
        console.log("onLinkClick", link, event, event.clientX, event.clientY);
        loading.show(event.clientX, event.clientY);
    };

    // subscribe("link clicked", onLinkClick);
}(window.$hn));


(function(){
    var onClicks = function(xpath, callback) {
        $(document).on("click", xpath, function(event){
            var target = $(event.target),
                link = target.closest("A");

//            console.log(target, link);

            if (link.length == 0 || (link.length > 0 && link.attr("href").indexOf("#") !== 0)) {
                return;
            }

            event.preventDefault();

            //Only for iOS, when scrolling, click node may not be same as event.target.
            var initialNode = document.elementFromPoint(event.clientX, event.clientY),
                loading = $hn.loading;

            window.setTimeout(function(){
                if (initialNode == document.elementFromPoint(event.clientX, event.clientY) && !loading.isVisible()) {
                    //link.addClass("active");
                    loading.show(event.clientX, event.clientY);
                    callback(link, event);
                }
            }, 11);
        });
    };

    var onTaps = function(xPath, callback, showSpinner) {
        showSpinner = typeof (showSpinner) == 'undefined' ? true : showSpinner;
        $(document).hammer().on('tap', xPath, function(event) {
            console.log('tap');
            var target = $(event.target),
                link = target.closest("A"),
                button;

//            console.log(target, link);

            if (link.length === 0 ) {
                link = target.closest('button');
            }

            var center = event.gesture.center;
            console.log(event.gesture.center.pageX, event.gesture.center.pageY, p=event);

            if (showSpinner) {
                $hn.loading.show(center.pageX, center.pageY);
            }

            event.preventDefault();
            callback(link, event);
        });


        $(document).on('click', xPath, function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('click');
        });
    };
    $hn.onClick = onClicks;
}());

(function(window) {
    var $hn = window.$hn,
        win = $(window);

    var routes = {
        'comments' : 'show-comments',
        'article' : 'show-article'
    };

    var initialUrl = location.hash,
        hash = initialUrl;

    if (hash.length > 0) {
        hash = hash.split('#')[1].split('/');
        if (routes[hash[1]]) {
            //This should be callback after js init.
            window.setTimeout(function() {
                PubSub.publish(routes[hash[1]], hash[2]);
                console.log(routes[hash[1]], hash[2]);
            }, 100);
        }
    } else {
        history.replaceState({publish:'show-home', url: location.href}, 'Home', location.href);
    }

    win.on('popstate', function(event) {
        console.log('event: popstate', event.state, event);

        // Guard against unwanted popstate in webkit
        if (event.state) {
            console.log(initialUrl, event.state.url);

            // Ignore popstate event fired as a result of back/forth navigation fron another site
            if (initialUrl == event.state.url) {
                console.log("history: ignore popstate (Back/forth navigation to other site");
                return;
            }

            if (event.state.publish) {
                if (event.state.args) {
                    PubSub.publish(event.state.publish, event.state.args);
                }
                else {
                    PubSub.publish(event.state.publish);
                }
            }
        }
    });

    $hn.back = function() {
        if (initialUrl == location.hash) {

        }
        else {
            history.back();
        }
    };

    window.addEventListener("hashchange", function(event) {
        console.log('hashChange()', event, event.newURL);
        PubSub.publish('hash-change', event.newURL);
    }, false);

    $hn.history = function() {
        var pushState = function(state, title, url) {
            window.history.pushState(state, title, url);
            PubSub.publish('url-change', window.location.href);
        };

        return {
            pushState: pushState
        }
    }();

    win.on('load', function(event) {
        console.log(event, history.state);
    });

    var onBackKeyDown = function(event) {
        PubSub.publish('hardware/back');
    };

    var onMenuButtonDown = function(event) {
        PubSub.publish('hardware/menu');
    };

    //need cordova library to be loaded
    //document.addEventListener("menubutton", onMenuButtonDown, false);

    //document.addEventListener("backbutton", onBackKeyDown, false);
}(window));


(function($hn) {
    //fuzzy date:
    var timeAgo = function(time, local){

        (!local) && (local = Date.now());

        if (typeof time !== 'number' || typeof local !== 'number') {
            return;
        }

        var
            offset = Math.abs((local - time)/1000),
            date = new Date(),
            span   = [],
            MINUTE = 60,
            HOUR   = 3600,
            DAY    = 86400,
            WEEK   = 604800,
            MONTH  = 2629744,
            YEAR   = 31556926,
            DECADE = 315569260,
            months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");

        date.setTime(time);

        if (offset <= MINUTE) {
            return 'Just now!';
        }
        else if (offset < (MINUTE * 60)) {
            return Math.round(Math.abs(offset / MINUTE)) + ' minute' + ( Math.round(Math.abs(offset / MINUTE)) != 1 ? 's' : '' ) + ' ago';
        }
        else if (offset < (HOUR * 24)) {
            return Math.round(Math.abs(offset / HOUR)) + ' hour' + (Math.round(Math.abs(offset / HOUR)) != 1 ? 's' : '' ) + ' ago';
        }
        else {
            return months[date.getMonth()] + ' ' + date.getDate() + " " + date.getFullYear();
        }
    };

    $hn.timeAgo = timeAgo;
}(window.$hn));
