
// Unnecessary experiment creating 
// a supportless js importer.
//
var Loader = Loader || {};

Loader.import = [{
    path: 'test-client.js',
    name: 'TestClient'
}];

Loader.ready = [];


var App = {
    doc: document,
    add: function (component) {
        App.doc.body.appendChild(component);
    },
    remove: function (component) {
        App.doc.body.removeChild(component);
    },
    on: function (e, next) {

    }
};

App.import = function(path, namespace, next) {

    var el = App.doc.createElement('script');

    el.setAttribute('src',  path);
    el.setAttribute('type', 'text/javascript');
    el.addEventListener('load', function (e) {
        console.log(namespace + ' loaded');
        App[namespace] = namespace;
        if (typeof next == 'function') next(App.namespace);
    });
    App.add(el);
}

Loader.import.forEach((file, index) => {
    console.log(file);
    App.import(file.path, file.name, (name) => {
        console.log(name);
    });
});
