console.log("inside index.js");
console.log("node_env=", process.env.NODE_ENV);

const path = require("path");
const util = require(path.join(__dirname, "../js/util.js"));

// fixing electron issue
window.$ = window.jQuery = require('../js/jquery-3.2.1.min.js');
window.Hammer = require('../js/hammer.min.js');

const k_view = Object.freeze({
    init: "initView",
    word: "wordView",
    load: "loadView",
    error: "errorView"
});

let app = null; // global reference to the vue app,
                // so we can access it from devTool

// Load different scripts
// !! Order is important: jquery goes before materialize
let k_paths = {
    prod: {
        vue: "../js/vue.min.js",
        // jquery: "../js/jquery-3.2.1.min.js",
        // materialize: "../js/materialize.min.js"
    },
    dev: {
        vue: "../js/vue.dev.js",
        // jquery: "../js/jquery-3.2.1.js",
        // materialize: "../js/materialize.js"
    }
};
k_paths = process.env.NODE_ENV === "development" ? k_paths.dev : k_paths.prod;

/*
 * Get a promise for loading the script file.
 * @param {String} path The path to the script file.
 * @return {Promise} The promise object.
 */
function getLoadingP(path) {
    let el = document.createElement("script");
    el.src = path;
    document.body.appendChild(el);
    return new Promise(function(res, rej) {
        el.onload = res;
    });
}

const loadVueP = getLoadingP(k_paths.vue);
// This part somehow doesnt' work.
// const loadJqueryP = getLoadingP(k_paths.jquery);
// const loadMaterializeP = loadJqueryP.then(function() {
//     return getLoadingP(k_paths.materialize);
// });

Promise.all([loadVueP])
.then(function() {
    let scrollHeight = parseFloat($("#app").css("height")) -
                       parseFloat($("#search-bar").css("height")) -
                       parseFloat($("#index-banner").css("height"));
    scrollHeight = Math.ceil(scrollHeight);
    $("#scroll-view").css("height", scrollHeight + "px");

    app = new Vue({
        el: "#app",
        data: {
            searchWord: null,
            view: k_view.init,
            word: {
                content: null,
                pronunciations: {
                    uk: null,
                    us: null,
                },
                explanations: {
                    /*
                     * @param {Object} cn The definition object for Chinese explanation.
                     * @param {String} cn.pos The PoS for Chinese explanation.
                     * @param {String} cn.defn The explanation string.
                     */
                    cn: null,

                    /*
                     * @param {Object} en An object of English definition
                     * @param {String} en.key Part of Speech
                     * @param {String[]} en.val An array of explanations for this PoS
                     */
                    en: null,
                }
            },
            error: null
        },
        methods: {
            onFocus: function() {
                $("#search-word").removeClass("valid")
                                 .removeClass("invalid");
            },
            /*
             * The search button is clicked.
             * Initiate the search.
             */
            onSearch: function() {
                console.log("Search button clicked.");
                $("#search-word").blur();
                
                let that = this;
                Promise.resolve()
                .then(function() {
                    that.view = k_view.load;
                    return util.searchWordP(that.searchWord);
                })
                .then(function(data) {
                    console.log("onSearch got data=", data);
                    that.word = data;

                    // tweaking
                    if (data.pronunciations.uk && data.pronunciations.uk !== "") {
                        that.word.pronunciations.uk = "🇬🇧 /" + data.pronunciations.uk + "/";
                    }
                    if (data.pronunciations.us && data.pronunciations.us !== "") {
                        that.word.pronunciations.us = "🇺🇸 /" + data.pronunciations.us + "/";
                    }

                    $("#search-word").addClass("valid");
                    that.view = k_view.word;
                })
                .catch(function(error) {
                    console.log("onSearch caught error=", error);
                    that.error = error;
                    $("#search-word").addClass("invalid");
                    that.view = k_view.error;
                });
            },
            /*
             * 
             */
            onEnter: function() {
                document.getElementById("search-btn").click();
            }
        }
    });
});