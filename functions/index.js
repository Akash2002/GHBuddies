const functions = require('firebase-functions');
const admin = require('firebase-admin');

const accountSid = 'AC704a64a71d8f0ec21abfd00870d49be8';
const authToken = '521346e9f3732692fc345653942f09e8';
const client = require('twilio')(accountSid, authToken);

admin.initializeApp();

exports.sendRequest = functions.https.onCall((data, context) => {

  var fname = data.fname;
  var lname = data.lname;
  var pnumber = data.pnumber;
  var startingLocation = data.startingLocation;
  var endingLocation = data.endingLocation;

  var db = admin.firestore();

  if (fname.length <= 0 || lname.length <= 0) {
    return {
      text: "Please enter a valid name."
    };
  }

  if (!(isValidNumber(pnumber))) {
    return {
      text: "Please enter a valid number."
    };
  }

  if (startingLocation === "Choose...") {
    return {
      text: "Please enter a valid location."
    };
  }

  if (endingLocation === "Choose...") {
    return {
      text: "Please enter a valid location."
    };
  }

  if (startingLocation === endingLocation) {
    return {
      text: "Please enter different starting and ending locations."
    };
  }

  var selfRef = db.collection("Users").doc(fname + " " + lname).set({
      fname: fname,
      lname: lname,
      pnumber: pnumber,
      startingLocation: startingLocation,
      endingLocation: endingLocation,
      time: Date.now()
    })
    .then(docRef => {
      console.log("LOGINFO : Added " + fname + ", " + lname + ", " + pnumber + ", " + startingLocation + ", " + endingLocation + ", " + Date.now());
      return console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });

  var usersRef = db.collection("Users");
  var query = usersRef.where("startingLocation", "==", startingLocation).where("endingLocation", "==", endingLocation);

  query.get().then(function(querySnapshot) {
    return querySnapshot.forEach(function(doc) {
      var targetFname = doc.data().fname;
      var targetLname = doc.data().lname;
      var targetPnumber = doc.data().pnumber;

      console.log("LOGINFO : " + fname + " " + lname + " has been matched with " + targetFname + " " + targetLname + " to head to " + endingLocation + " from " + startingLocation);

      client.messages
        .create({
          body: "You have been matched with " + targetFname + " " + targetLname + "! Please meet them in the " + startingLocation + " lobby in the next 5 minutes to head to " + endingLocation,
          from: '+14702857147',
          to: '+1' + pnumber
        })
        .then(message => console.log(message.sid))
        .catch(err => console.log(err));
      client.messages
        .create({
          body: "You have been matched with " + fname + " " + lname + "! Please meet them in the " + startingLocation + " lobby in the next 5 minutes to head to " + endingLocation,
          from: '+14702857147',
          to: '+1' + targetPnumber
        })
        .then(message => console.log(message.sid))
        .catch(err => console.log(err));

      // console.log(doc.id, ' => ', doc.data());

      return Promise.all([
        usersRef.doc(doc.id).delete(),
        usersRef.doc(fname + " " + lname).delete()
      ]);

    });
  }).catch(function(error) {
    console.error("Error adding document: ", error);
  });

  return {
    text: "Success"
  };

});

exports.scheduledCheck = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
  var time = Date.now();

  var db = admin.firestore();
  var usersRef = db.collection("Users");

  usersRef.get().then(function(querySnapshot) {
    return querySnapshot.forEach(function(doc) {
      var targetName = doc.data().fname + " " + doc.data().lname;
      var targetTime = doc.data().time;
      var targetPnumber = doc.data().pnumber;

      if (time - targetTime >= (1000 * 60 * 10)) {

        client.messages
          .create({
            body: "It has been 10 minutes since your request and no one has responded. Cancelling request. :(",
            from: '+14702857147',
            to: '+1' + targetPnumber
          })
          .then(message => console.log(message.sid))
          .catch(err => console.log(err));

        return usersRef.doc(targetName).delete();
      }
    });
  }).catch(function(error) {
    console.error("Error adding document: ", error);
  });

  return null;
});

function isValidNumber(phoneNumber) {
  var newPhoneNumber = phoneNumber.replace(/\D/g, "");

  if (newPhoneNumber.length === 10) {
    return (true);
  } else
    return (false);
}
