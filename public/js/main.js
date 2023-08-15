'use strinct';

const socket = io.connect();

const localVideo = document.querySelector('#localVideo-container video');
const videoGrid = document.querySelector('#videoGrid');
const notification = document.querySelector('#notification');
const mainDiv = document.getElementById("main")
const loginDiv = document.getElementById("loginForm")
const notify = (message) => {
    notification.innerHTML = message;
};

const pcConfig = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ],
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com',
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com',
        },
        {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
        },
    ],
};

/**
 * Initialize webrtc
 */
const webrtc = new Webrtc(socket, pcConfig, {
    log: true,
    warn: false,
    error: false,
});

/**
 * Create or join a room
 */

const roomInput = document.querySelector('#roomId');
let userName = document.querySelector('#userID');
const joinBtn = document.querySelector('#joinBtn');
joinBtn.addEventListener('click', () => {
    const room = roomInput.value;
    userName = userName.value;
    if (!room) {
        notify('Room ID not provided');
        mainDiv.classList.remove("active");
        loginDiv.classList.add("active");
        return;
    } else {
        notify('Username: '+ userName);
        mainDiv.classList.add("active");
        loginDiv.classList.remove("active");
    }
    webrtc.joinRoom(room);
});

document.getElementById("userID").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("joinBtn").click();
    }
});

const setTitle = (status, e) => {
    const room = e.detail.roomId;

    console.log(`Room ${room} was ${status}`);
    notify(`Username ${userName} has joined`);
    notify(`Room ${room} was ${status}`);
    mainDiv.classList.add("active");
    loginDiv.classList.remove("active");
    webrtc.gotStream();
};
webrtc.addEventListener('createdRoom', setTitle.bind(this, 'created'));
webrtc.addEventListener('joinedRoom', setTitle.bind(this, 'joined'));

  $("#send").on("click", function () {
    let socketID = webrtc.socket.id;
    socketID = socketID.substring(0, 6)
    let clientmsg = $("#chat_message").val();
    document.getElementById("chat_message").focus();
    //webrtc.socket.send(clientmsg, null, null, 1)
    $("#chat_message").val("");
    if(clientmsg == ":stop") {
        const div = document.createElement('div')
        div.className = 'message message--system';
        div.innerHTML =`<span><strong>System: </strong>Dein Stream ist pausiert. Niemand kann dich sehen!</span>`;
        document.getElementById('chatbox').appendChild(div);
        document.getElementById('localVideo-container').classList.remove("hide")
        webrtc.chat("Stream deaktiviert")

    } else if(clientmsg == ":start") {
        const div = document.createElement('div')
        div.className = 'message message--system';
        div.innerHTML =`<span><strong>System: </strong>Dein Stream ist aktiv.</span>`;
        document.getElementById('chatbox').appendChild(div);
        document.getElementById('localVideo-container').classList.add("hide")
        webrtc.chat("Stream aktiviert")
    } else if(clientmsg == ":new") {
        const div = document.createElement('div')
        div.className = 'message message--system';
        div.innerHTML =`<span><strong>System: </strong>Willst du wirklich einen neuen Partner suchen? Bestätige mit :yes</span>`;
        document.getElementById('chatbox').appendChild(div);
        webrtc.chat("Sucht einen neuen Partner")

    } else if(clientmsg == ":yes") {
        const div = document.createElement('div')
        div.className = 'message message--system';
        div.innerHTML =`<span><strong>System: </strong>Neuer Partner wird gesucht ... </span>`;
        document.getElementById('chatbox').appendChild(div);

        webrtc.chat("Suche neuen Partner")
    } else if(clientmsg.startsWith(":")) {
        const div = document.createElement('div')
        div.className = 'message message--system';
        div.innerHTML =`<span><strong>System: </strong>Befehl nicht erkannt</span>`;
        document.getElementById('chatbox').appendChild(div);
    } else {
        const div = document.createElement('div')
        div.className = 'message';
        div.innerHTML =`<span><strong>${userName}: </strong> ${clientmsg} </span>`;
        document.getElementById('chatbox').appendChild(div);
        webrtc.chat(userName + ": " + clientmsg)
    }

    scrollContent()
});

document.getElementById("chat_message").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("send").click();
    }
});

/**
 * Leave the room

const leaveBtn = document.querySelector('#leaveBtn');
leaveBtn.addEventListener('click', () => {
    webrtc.leaveRoom();
});
 */
webrtc.addEventListener('leftRoom', (e) => {
    const room = e.detail.roomId;
    document.querySelector('h1').textContent = '';
    notify(`Left the room ${room}`);
});

webrtc.addEventListener('chat', (e) => {
    let socketID = e.detail.sockeId;
    socketID = socketID.substring(0, 6)

    const div = document.createElement('div')
    div.className = 'message';
    div.innerHTML =`<span>${e.detail.text} </span>`;
    document.getElementById('chatbox').appendChild(div);
    scrollContent()
});

function scrollContent() {
    let oldscrollHeight = $("#main__chat_window")[0].scrollHeight - 20;
    $("#main__chat_window").animate({ scrollTop: oldscrollHeight }, 'normal');
}

/**
 * Get local media
 */
webrtc
    .getLocalStream(true, { width: 640, height: 480 })
    .then((stream) => (localVideo.srcObject = stream));

webrtc.addEventListener('kicked', () => {
    document.querySelector('h1').textContent = 'You were kicked out';
    videoGrid.innerHTML = '';
});

webrtc.addEventListener('userLeave', (e) => {
    console.log(`user ${e.detail.socketId} left room`);
});

/**
 * Handle new user connection
 */
webrtc.addEventListener('newUser', (e) => {
    const socketId = e.detail.socketId;
    const stream = e.detail.stream;

    const videoContainer = document.createElement('div');
    videoContainer.setAttribute('class', 'grid-item');
    videoContainer.setAttribute('id', socketId);

    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('muted', false); // set to false
    video.muted = true;
    video.setAttribute('playsinline', true);
    video.srcObject = stream;

    const p = document.createElement('p');
    p.innerHTML = "Partner Video";

    videoContainer.append(p);
    videoContainer.append(video);

    // If user is admin add kick buttons
    if (webrtc.isAdmin) {
        const kickBtn = document.createElement('button');
        kickBtn.setAttribute('class', 'kick_btn');
        kickBtn.textContent = 'Kick';

        kickBtn.addEventListener('click', () => {
            webrtc.kickUser(socketId);
        });

        videoContainer.append(kickBtn);
    }
    videoGrid.append(videoContainer);
});

/**
 * Handle user got removed
 */
webrtc.addEventListener('removeUser', (e) => {
    const socketId = e.detail.socketId;
    if (!socketId) {
        // remove all remote stream elements
        videoGrid.innerHTML = ''; 
        return;
    }
    document.getElementById(socketId).remove();
});

/**
 * Handle errors
 */
webrtc.addEventListener('error', (e) => {
    const error = e.detail.error;
    console.error(error);

    notify(error);
});

webrtc.addEventListener('message', (e) => {
    console.error(e);
});

/**
 * Handle notifications
 */
webrtc.addEventListener('notification', (e) => {
    const notif = e.detail.notification;
    console.log(notif);

    notify(notif);
});

window.scrollTo(0, document.body.scrollHeight);
