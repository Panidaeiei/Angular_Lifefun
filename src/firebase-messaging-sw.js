// /* global importScripts, firebase */
// importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// firebase.initializeApp({
//     apiKey: "AIzaSyAs29xYf3cVZxP3IlrdKSg7n_CT70Jn8V4",
//     authDomain: "storage-49f90.firebaseapp.com",
//     databaseURL: "https://storage-49f90-default-rtdb.firebaseio.com",
//     projectId: "storage-49f90",
//     storageBucket: "storage-49f90.appspot.com",
//     messagingSenderId: "923756175765",
//     appId: "1:923756175765:web:e0af6785a8382b99e0969c",
//     measurementId: "G-XE6C6C3DQM"
// });



// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//     console.log('[firebase-messaging-sw.js] Received background message ', payload);

//     const notificationTitle = payload.notification?.title || 'New Notification';
//     const notificationOptions = {
//         body: payload.notification?.body || '',
//         icon: '/assets/icons/icon-72x72.png' // เปลี่ยนเป็น icon ของคุณ
//     };

//     self.registration.showNotification(notificationTitle, notificationOptions);
// });
