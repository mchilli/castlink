//############################################################################### variables
const DOCTITLE = 'Castlink';
const APPID = [
    'CC1AD845', // default media receiver
];
const cjs = new Castjs({
    receiver: APPID[0],
});
cjs.connect = () => {
    return cast.framework.CastContext.getInstance().requestSession();
};
cjs.stop = () => {
    cjs._controller.stop();
};

const cardSession = document.getElementById('card-session');
const cardPlayer = document.getElementById('card-player');
const cardMedia = document.getElementById('card-media');
const cardPlaylist = document.getElementById('card-playlist');

const infoCastStatus = document.getElementById('device-status');
const infoCastStatusInfo = document.getElementById('device-status-info');
const infoPlayerStatus = document.getElementById('player-status');
const infoPlayerStatusInfo = document.getElementById('player-status-info');
const infoPlayerStatusIcon = document.getElementById('player-status-icon');
const infoPlayerNextStatus = document.getElementById('player-status-next');
const infoPlayerNextStatusIcon = document.getElementById('player-status-next-icon');
const infoPlayerTime = document.getElementById('player-time');
const infoPlayerDuration = document.getElementById('player-duration');
const infoPlayerProgress = document.getElementById('player-progess');
const infoPlaylistLoadStatus = document.getElementById('playlist-load-status');
const infoPlaylistLoadIcon = document.getElementById('playlist-load-icon');

const btnContPlayerControl = document.getElementById('player-control');
const btnContPlayerProgress = document.getElementById('player-progress');

const btnCastConnect = document.getElementById('cast-connect');
const btnPlayerPlay = document.getElementById('player-play');
const btnPlayerNext = document.getElementById('player-next');
const btnPlayer30Backward = document.getElementById('player-30-backward');
const btnPlayer30Forward = document.getElementById('player-30-forward');
const btnVolumeUp = document.getElementById('volume-up');
const btnVolumeDown = document.getElementById('volume-down');
const btnVolumeMute = document.getElementById('volume-mute');
const btnMediaAdd = document.getElementById('media-add');
const btnMediaClear = document.getElementById('media-clear');
const btnMediaExample = document.getElementById('media-example');
const btnPlaylistLoad = document.getElementById('playlist-load');
const btnPlaylistClear = document.getElementById('playlist-clear');

const inputPlayerProgressBar = document.getElementById('player-progress-bar');
const inputMediaTitle = document.getElementById('media-title');
const inputMediaUrl = document.getElementById('media-url');

const listPlaylist = document.getElementById('playlist');

let playlist = [];
let playlistIndex = sessionStorage.getItem('index') ? parseInt(sessionStorage.getItem('index')) : 0;
let autoplayNext = true; // to prevent trigger autoplay next playlist item, when manual choose from playlist
let progressBarSeeking = false;

//############################################################################### functions
function createElement({
    type = 'div',
    content = undefined,
    escapeHTML = false,
    attributes = {},
    events = {},
    children = [],
} = {}) {
    let element = document.createElement(type);
    if (content) {
        if (escapeHTML) {
            element.innerText = content;
        } else {
            element.innerHTML = content;
        }
    }
    for (const attribute in attributes) {
        element.setAttribute(
            attribute,
            (() => {
                if (attributes[attribute] instanceof Array) {
                    return attributes[attribute].join(
                        (() => {
                            switch (attribute) {
                                case 'class':
                                    return ' ';
                                case 'style':
                                    return ';';
                            }
                        })()
                    );
                }
                return attributes[attribute];
            })()
        );
    }
    for (const event in events) {
        element.addEventListener(event, events[event]);
    }
    for (const child of children) {
        element.append(child);
    }
    return element;
}

function setDocTitle(title) {
    document.title = title;
}

function getParamsFromUrl() {
    let url = location.search;
    let query = url.substring(1);
    let result = {};
    query.split('&').forEach((part) => {
        let item = part.split('=');
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

function getPlaylistFromJson(json) {
    let result = {};
    json.split(';').forEach((part) => {
        let item = part.split('|');
        result[item[0]] = item[1].replaceAll(' ', '%20');
    });
    return result;
}

function getDuration(s) {
    // convert seconds in readable format
    if (s <= '0') {
        return '00:00:00';
    }
    let sec = Math.floor(s);
    let min = Math.floor(sec / 60);
    let hr = Math.floor(min / 60);
    sec = sec % 60 < 10 ? '0' + (sec % 60) : sec % 60;
    min = min % 60 < 10 ? '0' + (min % 60) : min % 60;
    hr = hr % 60 < 10 ? '0' + (hr % 60) : hr % 60;
    return `${hr}:${min}:${sec}`;
}

function playerTogglePause() {
    if (cjs.connected) {
        if (cjs.paused) {
            cjs.play();
        } else {
            cjs.pause();
        }
    }
}

function playerCheckNextAvailable() {
    playlistIndex >= playlist.length - 1
        ? playerSetNextBtnAvailable(false)
        : playerSetNextBtnAvailable(true);
}

function playerSetNextBtnAvailable(available) {
    if (available) {
        btnPlayerNext.classList.remove('btn-alert');
        infoPlayerNextStatus.innerHTML = 'Next';
        infoPlayerNextStatusIcon.classList.remove('fa-stop');
    } else {
        btnPlayerNext.classList.add('btn-alert');
        infoPlayerNextStatus.innerHTML = 'Stop';
        infoPlayerNextStatusIcon.classList.add('fa-stop');
    }
}

function playerPlayNext() {
    if (playlist.length > 1 && playlistIndex < playlist.length - 1) {
        playlistIndex++;
        sessionStorage.setItem('index', playlistIndex);

        cjs.cast(playlist[playlistIndex].url, {
            title: playlist[playlistIndex].title,
        });
    } else {
        btnContPlayerControl.classList.add('hidden');
        btnContPlayerProgress.classList.add('hidden');

        infoPlayerStatusInfo.innerHTML =
            '<b>No media loaded.</b> Configure media below, and load it into the player.';
        infoPlayerStatusInfo.classList.remove('success');
    }
}

function playerPlayIndex(index) {
    autoplayNext = false; // to prevent trigger autoplay next playlist item, when manual choose from playlist

    infoPlaylistLoadIcon.classList.add('fa-sync-alt', 'fa-spin');
    infoPlaylistLoadStatus.innerHTML = 'Loading...';

    cjs.cast(playlist[index].url, {
        title: playlist[index].title,
    });
    playlistIndex = index;
    sessionStorage.setItem('index', index);
}

function playerSeekBackward(duration = 30) {
    if (cjs.connected) {
        let time = cjs.time - duration;
        if (time < 1) {
            time = 0;
        }
        cjs.seek(time);
    }
}

function playerSeekForward(duration = 30) {
    if (cjs.connected) {
        let time = cjs.time + duration;
        if (time >= cjs.duration) {
            time = cjs.duration;
        }
        cjs.seek(time);
    }
}

function playerToggleMute() {
    if (cjs.connected) {
        if (cjs.muted) {
            cjs.unmute();
        } else {
            cjs.mute();
        }
    }
}

function playlistAdd(title = '', url = '') {
    playlist.push({ title: title, url: url });
    let item = createElement({
        attributes: {
            class: 'playlist-item',
        },
        children: [
            createElement({
                content: title,
                escapeHTML: true,
                attributes: {
                    title: title,
                },
            }),
            createElement({
                content: url,
                escapeHTML: true,
                attributes: {
                    title: url,
                },
            }),
            createElement({
                attributes: {
                    class: 'btn-container',
                },
                children: [
                    createElement({
                        attributes: {
                            class: `playlist-play btn btn-primary ${
                                cjs.connected ? '' : 'btn-disabled'
                            }`,
                        },
                        children: [
                            createElement({
                                type: 'i',
                                attributes: {
                                    class: 'fas fa-play',
                                },
                            }),
                        ],
                        events: {
                            click: () => {
                                playlistPlayItem(item);
                            },
                        },
                    }),
                    createElement({
                        attributes: {
                            class: 'btn btn-alert',
                        },
                        children: [
                            createElement({
                                type: 'i',
                                attributes: {
                                    class: 'fas fa-trash',
                                },
                            }),
                        ],
                        events: {
                            click: () => {
                                playlistDeleteItem(item);
                            },
                        },
                    }),
                    createElement({
                        attributes: {
                            class: 'btn btn-secondary',
                        },
                        children: [
                            createElement({
                                type: 'i',
                                attributes: {
                                    class: 'fas fa-copy',
                                },
                            }),
                        ],
                        events: {
                            click: () => {
                                inputMediaTitle.value = title;
                                inputMediaUrl.value = url;
                                inputMediaUrl.dispatchEvent(new Event('input'));
                                cardMedia.open = true;
                            },
                        },
                    }),
                ],
            }),
        ],
    });
    listPlaylist.appendChild(item);

    if (cjs.connected) {
        btnPlaylistLoad.classList.remove('btn-disabled');
    }
    btnPlaylistClear.classList.remove('btn-disabled');

    playerCheckNextAvailable();
}

function playlistEnablePlayBtns(enable = false) {
    if (playlist.length === 0) return;

    for (let index = 0; index < listPlaylist.children.length; index++) {
        const item = listPlaylist.children[index];
        const btnClassList = item.querySelector('.playlist-play').classList;
        enable ? btnClassList.remove('btn-disabled') : btnClassList.add('btn-disabled');
    }
}

function playlistCurrentPauseBtn() {
    if (playlist.length === 0) return;

    const item = listPlaylist.children[playlistIndex];

    const playBtn = item.querySelector('.playlist-play');
    playBtn.classList.add('btn-info');

    const playBtnIcon = playBtn.querySelector('i');
    playBtnIcon.classList.remove('fa-play');
    playBtnIcon.classList.add('fa-pause');
}

function playlistResetPauseBtns() {
    if (playlist.length === 0) return;

    for (let index = 0; index < listPlaylist.children.length; index++) {
        const item = listPlaylist.children[index];
        const playBtn = item.querySelector('.playlist-play');
        playBtn.classList.remove('btn-info');

        const playBtnIcon = playBtn.querySelector('i');
        playBtnIcon.classList.remove('fa-pause');
        playBtnIcon.classList.add('fa-play');
    }
}

function playlistPlayItem(target) {
    if (cjs.connected) {
        for (let index = 0; index < listPlaylist.children.length; index++) {
            console.log(index, playlistIndex, cjs.state);
            const item = listPlaylist.children[index];
            if (item === target) {
                if (index !== playlistIndex || !['playing', 'paused'].includes(cjs.state)) {
                    playerPlayIndex(index);
                } else {
                    playerTogglePause();
                }
            }
        }
    }
}

function playlistDeleteItem(target) {
    for (let index = 0; index < listPlaylist.children.length; index++) {
        const item = listPlaylist.children[index];
        if (item === target) {
            playlist.splice(index, 1);
            listPlaylist.removeChild(item);
        }
    }

    playerCheckNextAvailable();

    if (playlist <= 0) {
        btnPlaylistClear.classList.add('btn-disabled');
    }
}

//############################################################################### eventlistener
// Cast Connect
btnCastConnect.addEventListener('click', () => {
    if (!cjs.available) return;
    if (cjs.connected) {
        cjs.disconnect();
    } else {
        cjs.connect();
    }
});

// Player Play Pause
btnPlayerPlay.addEventListener('click', () => {
    playerTogglePause();
});

// Player Next Stop
btnPlayerNext.addEventListener('click', () => {
    if (cjs.connected) {
        cjs.stop();
    }
});

// Player 30s backward
btnPlayer30Backward.addEventListener('click', () => {
    playerSeekBackward(30);
});

// Player 30s forward
btnPlayer30Forward.addEventListener('click', () => {
    playerSeekForward(30);
});

// Volume Up
btnVolumeUp.addEventListener('click', () => {
    if (cjs.connected) {
        let volume = cjs.volumeLevel;
        if (volume < 1) {
            volume += 0.1;
        }
        cjs.volume(volume);
    }
});

// Volume Down
btnVolumeDown.addEventListener('click', () => {
    if (cjs.connected) {
        let volume = cjs.volumeLevel;
        if (volume > 0) {
            volume -= 0.1;
        }
        cjs.volume(volume);
    }
});

// Volume Mute
btnVolumeMute.addEventListener('click', () => {
    playerToggleMute();
});

// Media Add
btnMediaAdd.addEventListener('click', () => {
    if (inputMediaUrl.value != '') {
        let url = inputMediaUrl.value;
        let title = inputMediaTitle.value != '' ? inputMediaTitle.value : 'Untitled';
        playlistAdd(title, url);

        inputMediaTitle.value = '';
        inputMediaUrl.value = '';
        inputMediaUrl.dispatchEvent(new Event('input'));
    }
});

// Media Clear
btnMediaClear.addEventListener('click', () => {
    if (inputMediaUrl.value != '') {
        inputMediaTitle.value = '';
        inputMediaUrl.value = '';
        inputMediaUrl.dispatchEvent(new Event('input'));
    }
});

// Media Example
btnMediaExample.addEventListener('click', () => {
    inputMediaTitle.value = 'Big Buck Bunny';
    inputMediaUrl.value =
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    inputMediaUrl.dispatchEvent(new Event('input'));
});

// Playlist Load
btnPlaylistLoad.addEventListener('click', () => {
    if (cjs.connected && playlist.length > 0) {
        playerPlayIndex(0);
    }
});

// Playlist Clear
btnPlaylistClear.addEventListener('click', () => {
    if (playlist.length > 0) {
        listPlaylist.innerHTML = '';
        playlist = [];
        playlistIndex = 0;
        sessionStorage.removeItem('index');

        btnPlaylistLoad.classList.add('btn-disabled');
        btnPlaylistClear.classList.add('btn-disabled');

        playerCheckNextAvailable();
    }
});

// Progress Input seeking
inputPlayerProgressBar.addEventListener('input', (e) => {
    progressBarSeeking = true;
    let time = (e.target.value * cjs.duration) / 100;
    infoPlayerTime.innerHTML = getDuration(time);
});

// Progress Input changed
inputPlayerProgressBar.addEventListener('change', (e) => {
    progressBarSeeking = false;
    if (cjs.connected) {
        cjs.seek(e.target.value, true);
    } else {
        e.target.value = 0;
    }
});

// URL Input changed
inputMediaUrl.addEventListener('input', (e) => {
    if (e.target.value != '') {
        btnMediaAdd.classList.remove('btn-disabled');
        btnMediaClear.classList.remove('btn-disabled');
    } else {
        btnMediaAdd.classList.add('btn-disabled');
        btnMediaClear.classList.add('btn-disabled');
    }
});

// User Keyboard input
window.addEventListener('keydown', (e) => {
    if ([inputMediaTitle, inputMediaUrl].includes(e.target)) return; // to prevent playback control when insert title or url

    switch (e.code) {
        case 'Space':
            e.preventDefault();
        case 'KeyK':
            playerTogglePause();
            break;
        case 'KeyM':
            playerToggleMute();
            break;
        case 'ArrowRight':
            playerSeekForward(30);
            break;
        case 'ArrowLeft':
            playerSeekBackward(30);
            break;
        default:
            break;
    }
});

//############################################################################### cast events
// Casting is available
cjs.on('available', () => {
    btnCastConnect.classList.remove('btn-disabled');

    cjs._controller.addEventListener('displayStatusChanged', (e) => {
        cjs.trigger('displaychange', e.value);
    });
});

// Connected with device
cjs.on('connect', () => {
    setDocTitle(`Connected: ${cjs.device}`);

    infoCastStatus.innerHTML = 'Disconnect';
    infoCastStatusInfo.innerHTML = `Connected to <b>${cjs.device}</b>`;
    infoCastStatusInfo.classList.add('success');
    if (playlist.length > 0) {
        btnPlaylistLoad.classList.remove('btn-disabled');
    }

    playlistEnablePlayBtns(true);
});

// Disconnected with device
cjs.on('disconnect', () => {
    setDocTitle(DOCTITLE);

    infoCastStatus.innerHTML = 'Connect';
    infoCastStatusInfo.innerHTML = 'Not connected to a device';
    infoCastStatusInfo.classList.remove('success');

    infoPlayerStatusInfo.innerHTML =
        '<b>No media loaded.</b> Configure media below, and load it into the player.';
    infoPlayerStatusInfo.classList.remove('success');

    btnContPlayerControl.classList.add('hidden');
    btnContPlayerProgress.classList.add('hidden');

    btnPlaylistLoad.classList.add('btn-disabled');

    playlistEnablePlayBtns(false);
});

// Device state
cjs.on('statechange', () => {});

// Display changed
cjs.on('displaychange', (e) => {
    if (e === '') {
        infoPlaylistLoadIcon.classList.remove('fa-sync-alt', 'fa-spin');
        infoPlaylistLoadStatus.innerHTML = 'Start Playlist';
    }
});

// Current time changed
cjs.on('timeupdate', () => {
    if (!progressBarSeeking) {
        infoPlayerTime.innerHTML = cjs.timePretty;
        inputPlayerProgressBar.value = cjs.progress;
    }
});

// Volume changed
cjs.on('volumechange', () => {});

// Muted state changed
cjs.on('mute', () => {});

// Muted state changed
cjs.on('unmute', () => {});

// Media is playing
cjs.on('playing', () => {
    setDocTitle(`Playing: ${cjs.title}`);

    autoplayNext = true; // to prevent trigger autoplay next playlist item, when manual choose from playlist

    btnContPlayerControl.classList.remove('hidden');
    btnContPlayerProgress.classList.remove('hidden');

    btnPlayerPlay.classList.add('btn-info');

    infoPlayerStatusInfo.innerHTML = `Current playing: <b>${cjs.title}</b>`;
    infoPlayerStatusInfo.classList.add('success');
    infoPlayerStatus.innerHTML = 'Pause';
    infoPlayerStatusIcon.classList.remove('fa-play');
    infoPlayerStatusIcon.classList.add('fa-pause');

    infoPlayerDuration.innerHTML = cjs.durationPretty;

    infoPlaylistLoadIcon.classList.remove('fa-sync-alt', 'fa-spin');
    infoPlaylistLoadStatus.innerHTML = 'Start Playlist';

    playerCheckNextAvailable();

    playlistCurrentPauseBtn();
});

// Media is paused
cjs.on('pause', () => {
    setDocTitle(`Playing: ${cjs.title}`);

    btnContPlayerControl.classList.remove('hidden');
    btnContPlayerProgress.classList.remove('hidden');

    btnPlayerPlay.classList.remove('btn-info');

    infoPlayerStatusInfo.innerHTML = `Current playing: <b>${cjs.title}</b>`;
    infoPlayerStatusInfo.classList.add('success');
    infoPlayerStatus.innerHTML = 'Play';
    infoPlayerStatusIcon.classList.remove('fa-pause');
    infoPlayerStatusIcon.classList.add('fa-play');

    infoPlayerDuration.innerHTML = cjs.durationPretty;

    playerCheckNextAvailable();

    playlistResetPauseBtns();
});

// Media ended
cjs.on('end', () => {
    if (cjs.connected) {
        setDocTitle(`Connected: ${cjs.device}`);
    }

    btnPlayerPlay.classList.remove('btn-info');
    infoPlayerStatus.innerHTML = 'Play';
    infoPlayerStatusIcon.classList.remove('fa-pause');
    infoPlayerStatusIcon.classList.add('fa-play');

    playlistResetPauseBtns();

    if (autoplayNext) playerPlayNext(); // to prevent trigger autoplay next playlist item, when manual choose from playlist
});

// Media is buffering / seeking
cjs.on('buffering', () => {});

// Catch all events except 'error'
cjs.on('event', (e) => {
    // console.log(e);
});

// Catch any errors
cjs.on('error', (e) => {
    console.error(e);
});

//################################################################## main
const urlParams = getParamsFromUrl();
if (urlParams.hasOwnProperty('list')) {
    let playlist = getPlaylistFromJson(urlParams.list);
    for (const title in playlist) {
        if (Object.hasOwnProperty.call(playlist, title)) {
            const url = playlist[title];
            playlistAdd(title, url);
        }
    }
}
