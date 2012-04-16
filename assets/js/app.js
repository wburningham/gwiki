var GWiki = Em.Application.create({
    user: '',
    repo: '',
    ready: function () {
        console.log("Init GWiki");
        // get username and repo
        var pathArray = window.location.pathname.split('/');
        var hostArray = window.location.host.split('.');
        this.set('user', hostArray[0].toLowerCase());
        this.set('repo', pathArray[1].toLowerCase());
        this.set('user', 'wburningham');
        this.set('repo', 'gwiki');
        GWiki.Database.set('user', this.get('user'));
        GWiki.Database.set('repo', this.get('repo'));
        GWiki.Database.getPages();
    }
});
GWiki.Record = Em.Object.extend({
    word: null,
    pages: Em.Object.extend({
        path: null,
        tag: null,
        count: 0
    })
});
GWiki.Database = Em.ArrayController.create({
    user: null,
    repo: null,
    hash: null,
    records: [],
    recordsCount: null,
    searched: false,
    recentSearches: [],
    recentSearchesLimit: 5,
    hasRecentSearches: function () {
        var self = this;
        var results = self.get('recentSearches');
        return results.length > 0;
    },
    recentPages: [],
    hasRecentPages: function () {
        var self = this;
        var results = self.get('recentPages');
        return results.length > 0;
    },
    searchResults: [],
    searchResultsCount: null,
    pages: [],
    pagesCount: null,
    pagesProcessed: null,
    searchable: function () {
        var self = this;
        return self.get('pagesCount') === self.get('pagesProcessed') && self.get('pagesCount') > 0;
    }.property('pagesCount', 'pagesProcessed'),
    getPages: function () {
        // This should take 5% of the progress
        var self = this;
        var url = 'https://api.github.com/repos/';
        url += self.get('user') + '/' + self.get('repo') + '/branches' + '?callback=?';
        // JSONP request
        $.getJSON(url, function (data) {
            // console.log('branches', data);
            $.each(data.data, function (i, branch) {
                if (branch.name === 'gh-pages') {
                    self.set('hash', branch.commit.sha);
                    self.getTree();
                }
            });
        });
    },
    getTree: function () {
        // This should take 5% of the progress
        var self = this;
        var url = 'https://api.github.com/repos/';
        url += self.get('user') + '/' + self.get('repo') + '/git/trees/' + self.get('hash') + '?recursive=1&callback=?';
        // JSONP request
        $.getJSON(url, function (data) {
            var files = [],
                count = 0;
            console.log('treedata', data);
            // This should take 90% of the progress
            $.each(data.data.tree, function (i, file) {
                if (file.type === 'blob' && file.path.match(/\.md$/) !== null) {
                    files.push(file.path);
                    count++;
                    // self.processResource(file.path);
                }
            });
            self.set('pages', files);
            self.set('pagesCount', count);
            self.processFiles(files);
            console.log('se', self);
            var records = self.getPath('records');
            console.log(['records', records]);
        });
    },
    processFiles: function (pages) {
        var self = this;
        var pages = self.get('pages');
        var pagesCount = self.get('pagesCount');
        var pagesProcessed = 0
        if (pagesCount > 0) {
            $.each(pages, function (i, file) {
                self.processResource(file);
                pagesProcessed++;
                var percent = (pagesProcessed / pagesCount);
                console.log('percent processed: ' + percent.toFixed(2));
            });
            var records = self.get('records');
            console.log('Sorting');
            records.sort(function (a, b) {
                var val = a.word < b.word;
                return val === false ? 1 : -1;
            });
            console.log('Database done indexing');
            self.set('pagesProcessed', pagesProcessed);
        }
    },
    processResource: function (path) {
        var self = this;
        var url = path;
        $.ajax({
            type: "GET",
            url: url,
            async: false,
            // Required
            contentType: "application/octet-stream; charest=utf-8",
            dataType: "text",
            success: function (data) {
                self.parseResource(path, data);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.error(['GET resource: ', textStatus, errorThrown]);
            }
        });
    },
    parseResource: function (path, data) {
        var self = this;
        var matches = data.match(/((?!the|and|this|that|was|you|its|it's|for|are|his|her)[a-zA-Z]+[-']*[a-zA-Z]*){3,}/g);
        $.each(matches, function (i, match) {
            self.addRecord(path, match);
        });
    },
    addRecord: function (p, w) {
        var self = this;
        var records = self.getPath('records');
        // console.log('w',words);
        w = w.toLowerCase();
        var wordFound = false;
        $.each(records, function (i, record) {
            if (record.word === w) {
                wordFound = true;
                if (record.pages[p]) {
                    // Page exists, increment count
                    record.pages[p] = record.pages[p] + 1;
                } else {
                    // Page does not yet exists
                    record.pages[p] = 1;
                }
                return false; //Break loop
            }
        });
        if (wordFound === false) {
            // New word
            var ps = {};
            ps[p] = 1;
            records.pushObject({
                word: w,
                pages: ps
            });
            var recordsCount = self.get('recordsCount');
            recordsCount++;
            self.set('recordsCount', recordsCount);
        }
    },
    recursiveSearch: function (first, last, target) {
        var self = this;
        var records = self.get('records');
        // Not found
        if (last < first) {
            return -1;
        }
        // Find mid point
        var mid = (first + last) / 2;
        mid = mid.toFixed(0);
        // Get midpoint value in array
        var testWord = records[mid].word;
        // Readjust mid based on string comparison
        if (testWord == target) {
            return mid;
        } else if (testWord < target) {
            first = ((mid * 1) + 1);
        } else {
            last = ((mid * 1) - 1);
        }
        // Recursive portion
        return self.recursiveSearch(first, last, target);
    },
    search: function (s) {
        var self = this;
        if (self.get('searchable')) {
            self.set('searched', true);
            self.set('searchResults', []); // Clear previous search results
            self.set('searchResultsCount', null); // Clear previous search results count
            console.log("searching for: " + s);
            // Add search to recent search list, limit them
            var recentSearches = self.get('recentSearches');
            console.log('recentSearches', recentSearches);
            var recentSearchesLimit = self.get('recentSearchesLimit');
            var index = -1;
            $.each(recentSearches, function (i, rec) {
                if (rec.search === s) {
                    index = i;
                    return false;
                }
            });
            if (index !== -1) {
                recentSearches.splice(index, 1);
            }
            recentSearches.pushObject({
                search: s
            });
            // Set max in array
            recentSearches.splice(recentSearchesLimit);
            var words = s.split(' ');
            var results = {};
            var records = self.get('records');
            $.each(words, function (i, word) {
                var count = self.get('recordsCount');
                var index = self.recursiveSearch(0, count - 1, word);
                if (index !== -1) {
                    // Match
                    var pages = records[index].pages;
                    // Get pages count for weighting
                    var pagesCount = 0;
                    for (p in pages) {
                        pagesCount++;
                    }
                    // TODO add more weight if the word is in the filename
                    for (var page in pages) {
                        var calculatedPage = {
                            page: page,
                            score: (pages[page] * (1 / ((words.length) * (pagesCount))))
                        };
                        if (results[page]) {
                            results[page] += (pages[page] * (1 / ((words.length) * (pagesCount))));
                        } else {
                            results[page] = (pages[page] * (1 / ((words.length) * (pagesCount))));
                        }
                    }
                }
            });
            var resultsArray = [];
            for (p in results) {
                resultsArray.push({
                    page: p,
                    score: results[p]
                });
            }
            resultsArray.sort(function (a, b) {
                // Decending
                return b.score - a.score;
            });
            self.set('searchResultsCount', resultsArray.length);
            var searchResults = self.getPath('searchResults');
            $.each(resultsArray, function (i, rec) {
                searchResults.pushObject({
                    page: rec.page,
                    // page: rec.page.replace(/\.md$/,''),
                    score: rec.score
                });
            });
            console.log('search results', self.get('searchResults'));
        } else {
            console.error('datbase not searchable');
        }
    }
});
GWiki.SearchResults = Em.View.extend({
    searchedBinding: 'GWiki.Database.searched',
    searchResultsCountBinding: 'GWiki.Database.searchResultsCount',
    searchResultsBinding: 'GWiki.Database.searchResults'
});
GWiki.Result = Em.View.extend({
    // searchResultsBinding: 'GWiki.Database.searchResults',
    test: 'yes',
    click: function (v) {
        alert('this', v);
    },
});
GWiki.RecentSearches = Em.View.extend({
    recentSearchesBinding: 'GWiki.Database.recentSearches',
    hasRecentSearchesBinding: 'GWiki.Database.hasRecentSearches'
});
GWiki.RecentSearch = Em.View.extend({
    click: function () {
        var self = this;
        var value = this.get('value');
        if (value) {
            GWiki.Database.search(value);
            self.set('value', '');
        }
    }
});
GWiki.RecentPages = Em.View.extend({
    recentPagesBinding: 'GWiki.Database.RecentPages',
    hasRecentPagesBinding: 'GWiki.Database.hasRecentPages'
});
GWiki.SearchBox = Em.TextField.extend({
    searchableBinding: 'GWiki.Database.searchable',
    insertNewline: function () {
        var self = this;
        var value = this.get('value');
        if (value) {
            GWiki.Database.search(value);
            self.set('value', '');
        }
    }
});
GWiki.Brand = Em.View.extend({
    repoBinding: 'GWiki.Database.repo',
    searchedBinding: 'GWiki.Database.searched',
    click: function () {
        var self = this;
        self.set('searched', false);
    }
});