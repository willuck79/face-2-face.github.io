const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');

let localStream;
let peerConnection;
let socket;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Initialize WebSocket connection
socket = new WebSocket('ws://localhost:3000');

// Handle incoming signaling messages
socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.offer) {
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ answer }));
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(data.answer);
    } else if (data.iceCandidate) {
        try {
            await peerConnection.addIceCandidate(data.iceCandidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
};

// Start video call
startCallButton.addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to the peer connection
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Send ICE candidates to the signaling server
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({ iceCandidate: event.candidate }));
        }
    };

    // Create an offer and send it to the server
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ offer }));
});