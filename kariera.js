// ==UserScript==
// @name         Kariera Plus
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/slidinGuy/kariera-plus-minecraft/master/kariera.js
// @downloadURL  https://raw.githubusercontent.com/slidinGuy/kariera-plus-minecraft/master/kariera.js
// ==/UserScript==

var GAME_URL = 'https://studio.code.org/s/mc/stage/1/puzzle/12';
var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeCoPbZzwHxCieCOCaFILNQnLJkJPn4apAEgS5xyJ6ugy5zmw/viewform';
var FORM_PREFIX = 'https://docs.google.com/forms';
var ALLOWED_URLS = [
    'https://www.pracujprosiliconvalley.cz/wp-content/uploads/zasady-ochrany-osobnich-udaju.pdf',
    'https://docs.google.com/document'
];
var RESET_URL = 'https://profiq.com';
var TIME_LIMIT = 10;

var styles = {
    timer: {
        fontSize: '32px',
        fontWeight: 'bold',
        fontFamily: 'Courier New',
        textAlign: 'center',
        marginTop: '32px',
        color: 'red'
    },
    cover: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: '0',
        zIndex: 1000,
        textAlign: 'center',
        paddingTop: '40vh',
        backgroundColor: '#002c62'
    },
    heading: {
        fontSize: '32px',
        color: 'white'
    },
    text: {
        fontSize: '24px',
        color: 'white'
    }
}

var timer = createElement('div', 'kariera_timer', styles.timer);
var end_wrapper = createElement('div', 'end_wrapper', styles.timer);
var end_button = createElement('button', 'end_button', {});
end_button.innerText = 'Give Up';
end_wrapper.appendChild(end_button);

var start_cover = createElement('div', 'start_cover', styles.cover);
var start_heading = createElement('h1', 'start_heading', styles.heading);
start_heading.innerText = 'Ready to win a new console?';
start_cover.appendChild(start_heading);
var start_paragraph = createElement('p', 'start_paragraph', styles.text);
start_paragraph.innerText = 'After you press start, you have ' + TIME_LIMIT + ' minutes to finish the challenge!';
start_cover.appendChild(start_paragraph);
var start_button = createElement('button', 'start_button', {});
start_button.innerText = 'START';
start_cover.appendChild(start_button);

var loading_cover = createElement('div', 'loose_cover', styles.cover);
var loading_heading = createElement('h1', 'loose_heading', styles.heading);
loading_heading.innerText = 'Loading...';
loading_cover.appendChild(loading_heading);

function createElement(type, id, style) {
    let el = document.createElement(type);
    el.id = id;
    Object.assign(el.style, style);
    return el;
}

function twoDigits(n) {
    return n.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
}

function checkAllowedUrl(href) {
    return (href.startsWith(FORM_PREFIX) || ALLOWED_URLS.some((url) => href.startsWith(url)));
}

class Game {
    constructor() {
        this.state = {}
        this.timerInterval = 0;
        this.setState(GM_getValue('state', {name: 'INITIALIZED'}));
    }

    setState(newState) {
        switch(newState.name) {
            case 'INITIALIZED':
                this.initialize(newState);
                break;
            case 'STARTED':
                this.start(newState);
                break;
            case 'FINISHED':
                this.finish(newState);
                break;
            default:
                newState = {name: 'INITIALIZED'};
        }
        this.state = newState;
        GM_setValue('state', newState);
    }

    endGame() {
        this.setState({ ...this.state, name: 'FINISHED' });
    }

    gameLoop() {
        var elapsedTime = new Date(Date.now() - this.state.startTime);

        if(!document.getElementById('kariera_timer') && document.getElementById('visualizationColumn')) {
           document.getElementById('visualizationColumn').appendChild(timer);
           document.getElementById('visualizationColumn').appendChild(end_wrapper);
           document.getElementById('end_button').onclick = this.endGame.bind(this);
        }

        var timerText = twoDigits(elapsedTime.getMinutes()) + ':' + twoDigits(elapsedTime.getSeconds()) + ':' + twoDigits(Math.floor(elapsedTime.getMilliseconds() / 10));

        timer.innerText = timerText;

        if(elapsedTime.getMinutes() >= TIME_LIMIT) {
            clearInterval(this.timerInterval);
            this.setState({ ...this.state, name: 'FINISHED' });
        }

        if(document.getElementsByClassName('win-feedback').length) {
            var generatedCode = document.getElementsByClassName('generatedCode')[0].innerText;
            var continueButton = document.getElementById('continue-button');
            if (generatedCode !== this.state.generatedCode) {
                let newState = {
                    ...this.state,
                    generatedCode,
                    timerText,
                    workingCode: true
                };
                continueButton.onclick = () => this.setState({ ...newState, name: 'FINISHED' });
                this.setState(newState);
            } else {
                continueButton.onclick = () => this.setState({ ...this.state, name: 'FINISHED' });
            }
        }
    }

    initialize() {
        if(window.location.href !== GAME_URL) {
            setTimeout(() => { window.location.href = GAME_URL }, 0);
            return;
        }
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(start_cover);

        document.getElementById('start_button').onclick = () => this.setState({
            name: 'STARTED',
            startTime: Date.now()
        });
    }

    start() {
        if(window.location.href !== GAME_URL) {
            setTimeout(() => { window.location.href = GAME_URL }, 0);
            return;
        }
        if(document.getElementById('start_cover')) {
            document.getElementById('start_cover').style.display = 'none';
        }
        this.timerInterval = setInterval(this.gameLoop.bind(this), 100);
    }

    finish(newState) {
        if(window.location.href === GAME_URL) {
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(loading_cover);
            sessionStorage.clear();
            window.location.href = FORM_URL;
        } else if (checkAllowedUrl(window.location.href)) {
            if (document.getElementsByClassName('exportTextarea').length) {
                var resultCode = btoa(JSON.stringify(newState));
                var textarea = document.getElementsByClassName('exportTextarea')[0];
                if(textarea){
                    textarea.value = resultCode;
                    textarea.dataset.initialValue = resultCode;
                }
            }
            if (document.getElementsByClassName('freebirdFormviewerViewResponseConfirmationMessage').length) {
                setTimeout(() => this.setState({name: 'INITIALIZED'}), 5000);
            }
        } else if (window.location.href.startsWith(RESET_URL)) {
            setTimeout(() => this.setState({name: 'INITIALIZED'}), 0);
        } else {
            setTimeout(() => { window.location.href = FORM_URL }, 0);
        }
    }
}

(function() {
    'use strict';
    const game = new Game();
})();
