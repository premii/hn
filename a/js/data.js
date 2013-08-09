
(function($hn) {

    var perfData = {
            insertedNodeCount : 0
        },
        update = function(id, type, time) {
            if (!perfData[id]) {
                perfData[id] = {}
            }
            if (arguments.length == 2) {
                perfData[id] = arguments[1];
            }
            else {
                perfData[id][type] = (perfData[id][type] ? perfData[id][type] + ',' : '') + time;
            }
        };

    $hn.perf = {
        update: update,
        data: perfData
    };

    //document.body.addEventListener('DOMNodeInserted', updateNodeCount, false);
}(window.$hn));


(function($hn) {
    var primaryServer = $hn.url.stories,
        backupServer = $hn.url.storiesBackup;

    var server = primaryServer;

    var URL = {
        'list' : '/news',
        'item' : '/item/{id}',
        'viewText' : 'http://viewtext.org/api/text?url={url}&format={format}',
        'AskHn': 'https://api.thriftdb.com/api.hnsearch.com/items/_search?limit=30&sortby=create_ts+desc&weights[username]=0.1&weights[text]=1&weights[type]=0&weights[domain]=2&weights[title]=1.2&weights[url]=1&boosts[fields][points]=0.07&boosts[functions][pow(2,div(div(ms(create_ts,NOW),3600000),72))]=200&q="Ask+hn"&filter[fields][type]=submission&facet[queries][]=username:Ask&facet[queries][]=username:hn',
        'ShowHn': 'https://api.thriftdb.com/api.hnsearch.com/items/_search?limit=30&sortby=create_ts+desc&weights[username]=0.1&weights[text]=1&weights[type]=0&weights[domain]=2&weights[title]=1.2&weights[url]=1&boosts[fields][points]=0.07&boosts[functions][pow(2,div(div(ms(create_ts,NOW),3600000),72))]=200&q="show+hn"&filter[fields][type]=submission&facet[queries][]=username:show&facet[queries][]=username:hn',
        'top10ByDate': 'https://api.thriftdb.com/api.hnsearch.com/items/_search?filter[fields][type][]=submission&sortby=points+desc&filter[fields][create_ts][]=[{startDate}+TO+{endDate}]&limit=10'
    };

    URL.viewText = $hn.url.readability;


    var getUrl = function(type) {

        if (type=='list' || type=='item') {
            return server + URL[type]
        }
        else if (type == 'AskHn' || type == 'ShowHn') {
            return URL[type]
        }
        else if (type == 'todayTop10' || type == 'yesterdayTop10' || type == 'weekTop10') {
            var startDate = new Date(),
                endDate;

            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);

            endDate = new Date(startDate);
            if (type == 'todayTop10') {
                endDate.setHours(24);
            }
            else if (type == 'yesterdayTop10') {
                startDate.setHours(-24);
            }
            else if (type == 'weekTop10') {
                startDate.setDate(startDate.getDate()-7);
            }


            return $hn.t(URL.top10ByDate, {
                'startDate' : startDate.toISOString(),
                'endDate' : endDate.toISOString()
            })
        }
    };


    var lastServerChangeTime;
    var changeServer = function(url) {
        console.log('change server', lastServerChangeTime, server)
        if (!lastServerChangeTime || lastServerChangeTime + (1000*60*20) < +new Date()) {
            lastServerChangeTime = +new Date();
            server = (server == primaryServer ? backupServer : primaryServer);
            console.log(lastServerChangeTime, server)
            return true;
        }
        return false;
    };


    var localData;

    var resetCache = function() {
        localData = {
            articles : {}
        };
    };

    resetCache();

    var updateLocalData = function() {
        $.each(localData.list, function(index, item) {

            item.visitedComments = '';
            item.visitedArticle = '';
            if (visitedData[item.id]) {
                if (visitedData[item.id].a) {
                    item.visitedArticle = 'visited';
                }
                if (visitedData[item.id].c) {
                    item.visitedComments = 'visited';
                }
            }
            if (item.type=='job') {
                item.points = 'JOB';
            }
            if (!item.user) {
                item.user = '';
            }
            item.title = item.title.replace('<', '&lt;');
            localData.articles[item.id] = item;
        });
    };


    var visitedData = {
//        id : {
//            'c' : +new Date(),
//            'a' : +new Date(),
//        },
//        version: 2
    };

    var readLocalData = function() {
        console.log('readLocalData()');
        var t0ls = +new Date(),
            localVisitedData = window.store.get('visited'),
            localStorageList = window.store.get('list');

        $hn.perf.update('localstorage', 'read', +new Date() - t0ls);

        if (localVisitedData) {
            $.extend(true, visitedData, localVisitedData);

            if (!visitedData.version) {
                $.each(visitedData, function(i, item) {
                    if (item.a) {
                        item.a = item.d
                    }
                    if (item.c) {
                        item.c = item.d
                    }
                    delete item.d;
                });
            }
            visitedData.version = 2;

            $.each(visitedData, function(index, item) {
                if (index != 'version') {
                    if (item.a < +new Date() - (1000 * 60 * 60 * 24 * 7)) {
                        delete item.a;
                    }
                    if (item.c < +new Date() - (1000 * 60 * 60 * 24 * 7)) {
                        delete item.c;
                    }
                    if (!item.a && !item.c) {
                        delete visitedData[index];
                    }
                }
            });

            saveVisitedData();
        }
        if (localStorageList) {
            if (+new Date() - localStorageList.timestamp < 1000*60*5) {
                localData.list = localStorageList.data;
                updateLocalData();
            }
        }
    };

    var saveVisitedId = null;
    var saveVisitedDelayed = function() {
        console.log('saveVisitedDelayed()');
        saveVisitedId = null;
        window.store.set('visited', visitedData);
    };
    var saveVisitedData = function() {
        console.log('saveVisitedData()');
        if (saveVisitedId) {
            window.clearTimeout(saveVisitedId);
            saveVisitedId = null;
        }

        saveVisitedId = window.setTimeout(saveVisitedDelayed, 1000);
    };

    var addVisited = function(id, type) {
        if (!visitedData[id]) {
            visitedData[id] = {};
        }
        visitedData[id][type] = +new Date();

        saveVisitedData();
    };
//    window.setTimeout(readLocalData, 1);
    readLocalData();

    var getLocalData = function() {
        return localData;
    };

    var updateList = function(callback) {
        callback = callback || function(){};
        var onSuccess = function(data) {
                resetCache();
                $hn.perf.update('list', 'fetch', +new Date() - t0Ajax);
                localData.list = data;
                updateLocalData();
                callback.apply(callback, [localData.list]);

                window.store.set('list', {data: localData.list, timestamp: +new Date()});

            },
            t0Ajax = +new Date();

        $hn.ajax({
            url: getUrl('list') + '?t=' + +new Date(),
            success: onSuccess,
            error: function(xhr, status) {
                console.log( typeof status, status, xhr);
                if ("ajaxError|abort".indexOf(status) > -1 && changeServer()) {
                        updateList(callback);
                }
            }
        });
    };
    var callbackLoop = 0;
    var updateArticleContent = function(id, callback) {
        callback = callback || function(){};

        if (!localData.articles[id] && callbackLoop++ < 3) {
//            alert('updateArticleContent(): Something went wrong! Reload??? ' + id);
            window.setTimeout(function(){
                updateArticleContent(id, callback);
            }, 400);
        }

        var fallbackContent = function() {
                return $hn.t('<p>Oops... Something went terribly wrong... </p><p>Follow this link <a href="{url}">{url}</a> to view the article</p><br><br>', {url: localData.articles[id].url});
            },
            onSuccess = function(data) {
                $hn.perf.update(id, 'article-fetch', +new Date() - t0Ajax);

                var a = $('<div></div>').html(data.content ||  fallbackContent());
                $('*', a).each(function(index, node) {
                    if (node.className) {
                        node.className = '';
                    }
                });
                localData.articles[id].article = a.html();
                callback.apply(callback, [localData.articles[id]]);
            },
            onError = function(data) {
                localData.articles[id].articlecontent = fallbackContent();
                callback.apply(callback, [localData.articles[id]]);
            },
            t0Ajax = +new Date();

        $hn.ajax({
            url: $hn.t(URL.viewText, {url: encodeURIComponent(localData.articles[id].url), format:'jsonp'}),
            dataType: 'jsonp',
            success: onSuccess,
            error: onError
        });
    };

    var updateArticleComments = function(id, callback) {

        callback = callback || function(){};

        var getLastCommentId = function(comments) {
            var lastCommentId;
            $.each(comments, function(index, item) {
                var tempId;
                if (!lastCommentId || item.id > lastCommentId) {
                    lastCommentId = item.id;
                }

                if (item.comments && (tempId = getLastCommentId(item.comments)) && tempId > lastCommentId) {
                    lastCommentId = tempId;
                }
            });
            return lastCommentId;
        };

        var onSuccess = function(data) {
            $hn.perf.update(id, 'comments-fetch', +new Date() - t0Ajax);
            var article = localData.articles[id];
            //if (!article) {
                article = localData.articles[id] = data;
            //}
            //else {
            //    article.comments = data.comments;
            //}

            if (article.url.indexOf('item')==0) {
                delete article.url;
            }

            if (visitedData[id] && visitedData[id].lastReadComment) {
                article.lastReadComment = visitedData[id].lastReadComment;
            }

            article.commentsFetchTime = +new Date();
            callback.apply(callback, [article]);

            window.setTimeout(function() {
                visitedData[id].lastReadComment = getLastCommentId(article.comments);
                saveVisitedData();
            }, 300);
        },
        t0Ajax = +new Date();


        $hn.ajax({
            url: $hn.t(getUrl('item'), {id: id}),
            dataType: 'jsonp',
            success: onSuccess,
            error: function(xhr, status) {
                console.log('ajax primary server failed, try backup server: ', status, xhr);
                if ('error|abort'.indexOf(status) > -1 && changeServer()) {
                    updateArticleComments(id, callback);
                }
            }
        });
    };

    var getArticles = function(callback, reload) {
        reload = reload || false;
        callback = callback || function(){};

        if (!reload && localData.list) {
            return callback.apply(callback, [localData.list]);
        }

        updateList(callback);
    };

    var getArticleMeta = function(id, callback) {
        callback = callback || function(){};

        var article = localData.articles[id];
        if (article) {
            return callback.apply(callback, [article]);
        }

        var onSuccess = function(data) {
                $hn.perf.update(id, 'comments-fetch', +new Date() - t0Ajax);
                data.commentsFetchTime = +new Date();
                if (data.url.indexOf('item')==0) {
                    delete data.url;
                }
                localData.articles[id] = data;
                callback.apply(callback, [data]);
            },
            t0Ajax = +new Date();

        $hn.ajax({
            url: $hn.t(getUrl('item'), {id: id}),
            dataType: 'jsonp',
            success: onSuccess,
            error: function(xhr, status) {
                console.log('ajax primary server failed, try backup server: ', status, xhr);
                if ('error|abort'.indexOf(status) > -1 && changeServer()) {
                    getArticleMeta(id, callback);
                }
            }
        });
    };

    var getArticleContent = function(id, callback, reload) {
        reload = reload || false;
        callback = callback || function(){};

        addVisited(id, 'a');
        var article = localData.articles[id];
        if (!reload && article && article.content) {
            return callback.apply(callback, [article]);
        }

        updateArticleContent(id, callback);
    };

    var getArticleComments = function(id, callback, reload) {
        reload = reload || false;
        callback = callback || function(){};

        addVisited(id, 'c');
        var article = localData.articles[id];
        if (!reload && article && article.comments && article.commentsFetchTime < (+new Date() + (1000 * 60 * 5))) {
            return callback.apply(callback, [article]);
        }

        updateArticleComments(id, callback);
    };

    var reformatData = function(data) {
        var t0Reformat = +new Date(),
            tempData = [];

        $.each(data.results, function(index, item) {
            item = item.item;
            var tempItem = {
                id: item.id,
                comments_count: item.num_comments,
                domain: item.domain,
                points: item.points,
                time_ago: $hn.timeAgo(+new Date(item.create_ts)),
                title: item.title,
                content: item.text || '',
                type: item.type,
                url: item.url,
                user: item.username,
                visitedArticle : '',
                visitedComments : ''
            };
            if (visitedData[item.id]) {
                if (visitedData[item.id].c) {
                    tempItem.visitedComments = 'visited';
                }
                if (visitedData[item.id].a) {
                    tempItem.visitedArticle = 'visited';
                }
            }
            localData.articles[item.id] = tempItem;
            tempData.push(tempItem);
        });

        $hn.perf.update('listAskHn', 'reformat', +new Date() - t0Reformat);
        return tempData;
    };

    var updateArticlesByType = function(type, callback) {
        console.log(type);
        callback = callback || function(){};
        var onSuccess = function(data) {
                $hn.perf.update('list' + type, 'fetch', +new Date() - t0Ajax);
                localData['list' + type] = reformatData(data);
                callback.apply(callback, [localData['list' + type]]);
            },
            t0Ajax = +new Date();

        $hn.ajax({
            url: getUrl(type),
            dataType: 'jsonp',
            success: onSuccess
        });
    };

    var getArticlesByType = function(type, callback, reload) {
        reload = reload || false;
        callback = callback || function(){};

        if (!reload && localData['list' + type]) {
            return callback.apply(callback, [localData['list' + type]]);
        }

        updateArticlesByType(type, callback);
    };

    $hn.data = {
        getArticles: getArticles,
        getArticleMeta: getArticleMeta,
        getArticleContent: getArticleContent,
        getArticleComments: getArticleComments,
        getArticlesByType: getArticlesByType,
        cache: getLocalData
    };

}(window.$hn));

