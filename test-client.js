var client = 'client';


// COMPONENTS:
//
const register   = document.getElementById('register');
const login      = document.getElementById('login');
const thing      = document.getElementById('thing');
const allThings  = document.getElementById('listThings');
const loadThings = allThings.querySelector('#loadThings');
const results    = document.getElementById('results');

// create mask component
const componentMask = document.createElement('DIV');
componentMask.classList.add('masked');
componentMask.innerHTML = '<h3>Authentication Required</h3>';


// EVENT LISTENERS:
//
register.addEventListener('submit', onRegister);
login.addEventListener('submit', onLogin);
thing.addEventListener('submit', onThing);
loadThings.addEventListener('click', getThings);


// FUNCTIONS:
//
function initialize() {
    console.log('initialize');
    // getThings();
    // onThing();
}

// check for token
//
function isAuthenticated() {
    console.log('getThings()');

    var token  = localStorage.getItem('authentication-token');
    var header = localStorage.getItem('authentication-header');

    if (!token && !header) {
        return false;
    } else {
        return { token, header };
    }
}

// mask component requiring authentication
//
function requiresAuthentication(component, callback) {
    console.log(`requiresAuthentication(${component.id} callback)`);

    var isAuth = isAuthenticated();

    if (isAuth) {
        mask(component, false);
    } else {
        mask(component, true);
    }

    if (typeof callback == 'function') {
        callback(isAuth);
    } else {
        return isAuth;
    }
}

// mask/unmask component
//
function mask(component, active) {
    console.log(`mask(${component.id}, ${active})`);

    if (active) {
        component.appendChild(componentMask.cloneNode(true));
    } else {
        var mask = component.querySelector('div.masked');
        if (mask) {
            component.removeChild(mask);
        }
    }
}

// finds all input fields and returns an object containing value key pairs
//
function getValues(form, callback) {

    var fields = form.querySelectorAll('input');
    var payload = {};

    fields.forEach((field, index) => {
        if (field.type === 'submit') return;
        console.log(`${field.name} : ${field.value}`);

        if (field.required && !field.value) {
            field.parentNode.style = 'box-shadow: 0 0 0 2px red; background-color: pink;';
        } else {
            field.parentNode.style = '';
        }
        payload[field.name] = field.value;
    });

    if (typeof callback == 'function') {
        callback([fields, payload]);
    } else {
        return [fields, payload];
    }
}

// create a new user
//
function onRegister(e) {
    console.log('onRegister()');
    if (e) e.preventDefault();

    request({
        method: 'POST',
        url: 'http://localhost:8080/register',
        payload: {
            username: register.querySelector('input[name="username"]').value,
            email:    register.querySelector('input[name="email"]').value,
            password: register.querySelector('input[name="password"]').value,
            first:    register.querySelector('input[name="first"]').value,
            last:     register.querySelector('input[name="last"]').value
        }
    }, (res) => {
        console.log('res:', res.response);
        var response = JSON.parse(res.response) || '';
        results.innerHTML += response.message;
    });
}

// login with credentials
//
function onLogin(e) {
    console.log('onLogin()');
    if (e) e.preventDefault();

    request({
        method: 'POST',
        url: 'http://localhost:8080/login',
        payload: {
            email: login.querySelector('input[name="email"]').value,
            password: login.querySelector('input[name="password"]').value
        }
    }, (res) => {
        console.log('res:', res.response);
        var response = JSON.parse(res.response) || '';
        results.innerHTML += response.message;

        if (response.token) {
            console.log(response.token);
            console.log('Authorization Token Updated/Saved');
            localStorage.setItem('authentication-header', 'Authorization');
            localStorage.setItem('authentication-token', 'JWT ' + response.token);
        }
    });
}

// create things
//
function onThing(e) {
    console.log('onThing()');
    if (e) e.preventDefault();

    var isAuthenticated = requiresAuthentication(thing);
    if (!isAuthenticated) return;

    var options = {
        method: 'POST',
        url: 'http://localhost:8080/things',
        payload: {
            title       : thing.querySelector('input[name="title"]').value,
            description : thing.querySelector('input[name="description"]').value
        }
    };

    console.log(options);

    request(options, (res) => {
        console.log('res', res.response);
        var response = JSON.parse(res.response) || '';
        results.innerHTML += response.message;
    });
}

// load things
//
function getThings(e) {
    console.log('getThings()');
    if (e) e.preventDefault();

    var results = listThings.querySelector('.list');
    var isAuthenticated = requiresAuthentication(allThings);
    if (!isAuthenticated) return;

    request({
        method: 'GET',
        url: 'http://localhost:8080/things'
    }, function (res) {

        // TODO: fix response for unauthorized so I won't need this.
        //
        if (res.response == 'Unauthorized') {
            var response = {
                success: false,
                message: res.response,
                payload: []
            };
        } else {
            var response = JSON.parse(res.response);
        }

        console.log(response);

        var list = `<tr><th>Complete</th><th>Title</th><th>Description</th></tr>`;

        if (response.payload.length <= 0 || !response.success) {
            list = `
                <div class="no-data">
                    <h3>${response.message}</h3>
                </div>
            `;
        } else {

            for (var i = 0; i < response.payload.length; i++) {
                // console.log(response.payload[i]);
                list += `
                    <tr>
                        <td><input type="checkbox" name="complete" value="${response.payload[i].complet}"/></td>
                        <td><input type="text" name="title" value="${response.payload[i].title}"/></td>
                        <td><input type="text" name="description" value="${response.payload[i].description}"/></td>
                    </tr>
                `;
            }
        }

        results.innerHTML += `<table>${list}</table>`;
    });
}

// basic reusable ajax function
// 
//      request({
//          method: 'POST', // or 'POST' or 'PUT' or 'DELETE'
//          header: 'application/x-www-form-urlencoded',
//          payload: { username: 'someuser', password: 'pa$$w0rd' },
//      }, function (req, res, success) {
//          console.log('response from server', response);
//      });
// 
function request(options, callback) {

    var payload = JSON.stringify(options.payload, null, 4) || [];
    var xhttp = new XMLHttpRequest();
    
    xhttp.onerror = function (e) {
        console.log('request.onerror:', this, e, false);
        callback(this, e, false);
    };
    xhttp.onreadystatechange = function (e) {
        if (this.readyState == 4) {
            callback(this, e, true);
        }
    };
    xhttp.open(options.method, options.url, true);
    
    xhttp.setRequestHeader("Content-Type", options.header || "application/json");

    if (isAuthenticated()) {
        xhttp.setRequestHeader( 
            localStorage.getItem('authentication-header'), 
            localStorage.getItem('authentication-token') 
        );
    }

    console.log('request.payload:', payload);
    xhttp.send(payload);
}

// start here on launch
initialize();


