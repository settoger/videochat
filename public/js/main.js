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
    log: false,
    warn: true,
    error: true,
});

/**
 * Create or join a room
 */
 let seconds = 00; 
 let tens = 00; 
 const appendTens = document.getElementById("tens")
 const appendSeconds = document.getElementById("seconds")
 let Interval ;
 const clock = document.getElementById("clock");
 clearInterval(Interval);

 const roomInput = document.querySelector('#roomId');
const joinBtn = document.querySelector('#joinBtn');
joinBtn.addEventListener('click', () => {
    const room = roomInput.value;
    if (!room) {
        notify('Room ID not provided');
        mainDiv.classList.remove("active");
        loginDiv.classList.add("active");
        return;
    } else {
        Interval = setInterval(startTimer, 1000);
        mainDiv.classList.add("active");
        loginDiv.classList.remove("active");
    }
    webrtc.joinRoom(room);
});

const setTitle = (status, e) => {
    const room = e.detail.roomId;

    console.log(`Room ${room} was ${status}`);

    notify(`Room ${room} was ${status}`);
    mainDiv.classList.add("active");
    loginDiv.classList.remove("active");
    webrtc.gotStream();
};
webrtc.addEventListener('createdRoom', setTitle.bind(this, 'created'));
webrtc.addEventListener('joinedRoom', setTitle.bind(this, 'joined'));

function startTimer () {
    tens++; 
    
    if(tens <= 9){
      appendTens.innerHTML = "0" + tens;
    }
    
    if (tens > 9){
      appendTens.innerHTML = tens;
      
    } 
    
    if (tens > 60) {
      seconds++;
      appendSeconds.innerHTML = "0" + seconds;
      tens = 0;
      appendTens.innerHTML = "0" + 0;
    }
    
    if (seconds > 9){
      appendSeconds.innerHTML = seconds;
    }

    if (seconds > 19){
      let element =  document.getElementById('body-overlay');
      if (typeof(element) != 'undefined' && element != null)
      {
        document.getElementById("body-overlay").classList.add("show");
      }
    }
    if (seconds > 18 && tens > 30){
      $('.header__back').css("color", "red");
    }
  
  };

  $("#send").click(function () {
    var clientmsg = $("#chat_message").val();
    $.post("post.php", { text: clientmsg });
    $("#chat_message").val("");
    return false;
});

document.getElementById("chat_message").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("send").click();
    }
});

function loadLog() {
    var oldscrollHeight = $("#main__chat_window")[0].scrollHeight - 20; //Scroll height before the request

    $.ajax({
        url: "log.html",
        cache: false,
        success: function (html) {
            $("#chatbox").html(html); //Insert chat log into the #chatbox div

            //Auto-scroll           
            var newscrollHeight = $("#main__chat_window")[0].scrollHeight - 20; //Scroll height after the request
            if(newscrollHeight > oldscrollHeight){
                $("#main__chat_window").animate({ scrollTop: newscrollHeight }, 'normal'); //Autoscroll to bottom of div
            }   
        }
    });
}

setInterval (loadLog, 1000);


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

/**
 * Handle notifications
 */
webrtc.addEventListener('notification', (e) => {
    const notif = e.detail.notification;
    console.log(notif);

    notify(notif);
});

window.scrollTo(0, document.body.scrollHeight);
