var templates = {};
templates['status'] = `
        <h2>Server Status</h2>
        <table class="table table-striped">
          <tr>
            <td><b>Uptime:</b></td>
            <td>{{uptime}}</td>
          </tr>
          <tr>
            <td><b>Free heap:</b></td>
            <td>{{free_heap}}</td>
          </tr>
          <tr>
            <td><b>LED state:</b></td>
            <td>
              <div class="onoffswitch">
                <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="led-switch" onclick="toggleLED()" {{#led}}checked{{/led}}>
                <label class="onoffswitch-label" for="led-switch">
                  <span class="onoffswitch-inner"></span>
                  <span class="onoffswitch-switch"></span>
                </label>
              </div>
            </td>
          </tr>
        </table>
`;
templates['config'] = `
        <h2>Configuration</h2>
        <h3>Clickboards</h3>
        <form id="config_form" action="config.json" method="get" onsubmit="configSubmit()">
        <table class="table table-striped">
          <tr>
            <th>Clickboard</td>
            <th>Port 1</td>
            <th>Port 2</td>
          </tr>
          <tr>
              <td>None</td>
              <td><input type="radio" name="port1" value="none" checked="checked" onchange="configSubmit(this)"></td>
              <td><input type="radio" name="port2" value="none" checked="checked" onchange="configSubmit(this)"></td>
          {{#clickboards}}
          <tr>
            <td>{{name_format}}</td>
            <td><input type="radio" name="port1" value="{{name}}" {{#port1_active}}checked="checked"{{/port1_active}} {{^port1_available}}disabled="disabled"{{/port1_available}} onchange="configSubmit(this)"></td>
            <td><input type="radio" name="port2" value="{{name}}" {{#port2_active}}checked="checked"{{/port2_active}} {{^port2_available}}disabled="disabled"{{/port2_available}} onchange="configSubmit(this)"></td>
          </tr>
          {{/clickboards}}
        </table>
        </form>
`;
templates['color2'] = `
        <h2>Color2Click</h2>
        <h3>Sensor</h3>
        <table class="table table-striped">
          <tr>
            <th>Color</th>
            <th>Raw</th>
            <th>Normalized</th>
          </tr>
          <tr>
            <td>Red</td>
            <td>{{r}}</td>
            <td>{{r_norm}}</td>
          </tr>
          <tr>
            <td>Green</td>
            <td>{{g}}</td>
            <td>{{g_norm}}</td>
          </tr>
          <tr>
            <td>Blue</td>
            <td>{{b}}</td>
            <td>{{b_norm}}</td>
          </tr>
        </table>

        <h3>Color</h3>
        <table class="table table-striped">
            <tr>
            	<td><b>Hex:</b></td>
            	<td>#{{r_hex}}{{g_hex}}{{b_hex}}</td>
        	</tr>
        </table>
        <div style="width:200px; height:100px;margin:auto; background:rgb({{r_dec}},{{g_dec}},{{b_dec}});"></div>
`;
// Temolate for thermo3 shows two lists one with the actial values red from the eval Board Memory one one from stored values
templates['thermo3'] = `
        <h2>Thermo3Click</h2>
        <h3>Temperature</h3>
        <table class="table table-striped">
            <tr>
                <td>Current temperature</td>
                <td>{{cur}}&deg;C</td>
            </tr>
            <tr>
                <td>Highest temperature</td>
                <td>{{high}}&deg;C</td>
            </tr>
            <tr>
                <td>Lowest temperature</td>
                <td>{{low}}&deg;C</td>
            </tr>
        </table>
        <h3>History</h3>
        <table class="table table-striped">
            {{#history}}
            <tr>
            	<td>{{date}}</td>
            	<td>{{val}}&deg;C</td>
            </tr>
            {{/history}}
        </table>
`;
// Template for Expand 2 Click just shows the Value of the Register for now
templates['expand2'] = `
        <h2>Expand2Click</h2>
        <h3>Water Meter</h3>
        <table class="table table-striped">
            <tr>
                <td>Measured quantity of water since last reset</td>
                <td>{{quantity}} Liter</td>
            </tr>
        </table>
        <h3>Input Register</h3>
        <table class="table table-striped">
            <tr>
                <td>Value</td>
                <td>{{input}}</td>
            </tr>
            <tr>
                <td>Bits</td>
                <td>
                    {{#inputs}}
                    <input type="checkbox" disabled name="{{name}}" {{#val}}checked{{/val}}>
                    {{/inputs}}
                </td>
            </tr>
        </table>
        <h3>Output Register</h3>
        <table class="table table-striped">
            <tr>
                <td>Value</td>
                <td>{{output}}</td>
            </tr>
            <tr>
                <td>Bits</td>
                <td>
                    {{#outputs}}
                    <input type="checkbox" disabled name="{{name}}" {{#val}}checked{{/val}}>
                    {{/outputs}}
                </td>
            </tr>
        </table>
`;

function toggleLED() {
      xhr = $.getJSON('status.json?action=set&led=' + ($('#led-switch').is(":checked") ? 'on' : 'off'), function(json) {});
}


function configSubmit( e ) {
    /* A clickboard can be active on only one port at a time. */
    $('#config_form [value='+e.value+']:checked').not(e).each(function() {
          $('#config_form [name='+this.name+'][value=none]').prop('checked', true);
      });
    /* Send the form to the GreenPHY Module via GET request. */
    $.getJSON($('#config_form').attr('action'), $('#config_form').serialize(), function(json) {
            renderPage('config', json);
    });
}

function capitalize( string ) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// temp_history stores the past temperature values
var temp_history = [];
// timerTemp is needed to stop stop the switch Page function from repeating every 60 seconds
var timerTemp;

function processJSON(page, json) {
    switch(page) {
        case 'config':
            $('#nav .clickboard a').attr('href', '#').text('');
            $.each(json['clickboards'], function(i, clickboard) {
                clickboard['name_format'] = capitalize(clickboard['name']) + 'Click';
                clickboard['port1_available'] = clickboard['available'] & (1 << 0) ? true : false;
                clickboard['port2_available'] = clickboard['available'] & (1 << 1) ? true : false;
                clickboard['port1_active'] = clickboard['active'] & (1 << 0) ? true : false;
                clickboard['port2_active'] = clickboard['active'] & (1 << 1) ? true : false;

                /* If the clickboard is active, add an entry to the menu. */
                if(clickboard['port1_active']) {
                    $('#nav .clickboard a').eq(0).attr('href', '#'+clickboard['name']).text(clickboard['name_format']);
                }
                if(clickboard['port2_active']) {
                    $('#nav .clickboard a').eq(1).attr('href', '#'+clickboard['name']).text(clickboard['name_format']);
                }
            });
            break;
        case 'color2':
            var rNorm = 1.0;
            var gNorm = 2.12;
            var bNorm = 2.0;
            json['r_norm'] = Math.round(json['r'] / rNorm);
            json['g_norm'] = Math.round(json['g'] / gNorm);
            json['b_norm'] = Math.round(json['b'] / bNorm);
            var colorMax = Math.max(json['r_norm'], json['g_norm'], json['b_norm']);
            json['r_dec'] = Math.round(json['r_norm'] * 255 / colorMax);
            json['g_dec'] = Math.round(json['g_norm'] * 255 / colorMax);
            json['b_dec'] = Math.round(json['b_norm'] * 255 / colorMax);
            json['r_hex'] = json['r_dec'].toString(16);
            json['g_hex'] = json['g_dec'].toString(16);
            json['b_hex'] = json['b_dec'].toString(16);
            break;
        case 'thermo3':
            var date = new Date();
            // Reload page every 10 seconds
            timerTemp = setInterval( function() { switchPage(); } , 10000 );
            json['cur'] = json['temp_cur'] / 100;
            json['high'] = json['temp_high'] / 100;
            json['low'] = json['temp_low'] / 100;
            // Store temp value in the global history
            temp_history.push({ 'date' : date.toLocaleString('de-DE'), 'val' : json['cur'] });
            json['history'] = temp_history;
            break;
        case 'expand2':
            // Reload Page every second
            timerTemp = setInterval( function() { switchPage(); } , 1000 );
            json['inputs'] = [];
            json['outputs'] = [];
            for( i = 0; i < 8; i++ ) {
                json['inputs'].unshift({'name':'input'+i, 'val': (json['input'] & ( 1 << i )) });
                json['outputs'].unshift({'name':'output'+i, 'val': (json['output'] & ( 1 << i )) });
            }
            // Convert toggle count to water quantity
            json['quantity'] = json['count'] * 0.2;
        default:
            break;
    }
    return json;
}

/* Store the currently visible page for page switch animation. */
var currentPage;

function renderPage(page, json) {
          var html = Mustache.render(templates[page], processJSON(page, json));

          if( currentPage == page ) {
            $('#content').html(html);
          } else {
            $('#content').fadeOut(100, function() {
                $('#content').html(html).fadeIn(200);
            });
          }

          currentPage = page;
}

function switchPage() {
      var page = window.location.hash.substr(1);
      if( !(page in templates) ) {
        page = 'status';
      }

      $.getJSON(page + '.json?action=get', function(json) {
          renderPage(page, json);
      });
      //clear timer each time switch page is called, otherwise there will be chaos
      clearInterval(timerTemp);
}

function link(e) {
    e.preventDefault();
    window.location.hash = this.hash;
    switchPage();
}

function keydown(e) {
    if (e.ctrlKey && e.keyCode == 82) {
        // 82 = r

        switchPage();

        if (e.preventDefault) {
            e.preventDefault();
        }
        else {
            return false;
        }
    }
}

$("a[href^='#']").click(link);
$(document).keydown(keydown);

$.getJSON('config.json?action=get', function(json) {
    processJSON('config', json);
});
switchPage();