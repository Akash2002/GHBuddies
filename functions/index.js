const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendRequest = functions.https.onCall((data, context) => {

  var result = "Success!";
  var tocontinue = true;

  var fname = data.fname;
  var lname = data.lname;
  var pnumber = data.pnumber;
  var startingLocation = data.startingLocation;
  var endingLocation = data.endingLocation;

  var reference = admin.database().ref();

  if (fname.length > 0 && lname.length > 0) {
    if (pnumber.length > 0) {
      if (startingLocation.length > 0) {
        if (endingLocation.length > 0) {
          reference.child(fname + " " + lname).set({
            pnumber: pnumber,
            startingLocation: startingLocation,
            endingLocation: endingLocation,
            request: "null",
            time: Date.now()
          });
        }
      } else {
        result = 'Invalid location.';
        tocontinue = false;
      }
    } else {
      result = 'Invalid phone number.';
      tocontinue = false;
    }
  } else {
    result = 'Invalid name.';
    tocontinue = false;
  }

  if (tocontinue) {
    reference.once('value', function(snapshot) {
      for (var key in snapshot.val()) {
        if (fname + " " + lname !== key) {
          reference.child(key).child("request").on("value", function(request) {
            reference.child(key).child("startingLocation").on("value", function(tempstartingLocation) {
              reference.child(key).child("endingLocation").on("value", function(tempendingLocation) {
                if (request.val() === "null" && startingLocation === tempstartingLocation.val() && endingLocation === tempendingLocation.val()) {

                  console.log(key);
                  console.log(request.val());
                  console.log(tempstartingLocation.val());
                  console.log(tempendingLocation.val());

                  reference.child(fname + " " + lname).child("request").set(key);
                  reference.child(key).child("request").set(fname + " " + lname);

                  reference.child(fname + " " + lname).child("pnumber").on("value", function(num1) {
                    reference.child(key).child("pnumber").on("value", function(num2) {

                      console.log(num1.val());
                      console.log(num2.val());

                      sendMessage(num1.val(), "You have been matched with " + key + "! Please meet them in the lobby in the next 5 minutes.");
                      sendMessage(num2.val(), "You have been matched with " + fname + ' ' + lname + "! Please meet them in the lobby in the next 5 minutes.");

                    });
                  });

                }
              });
            });
          });
        }
      }
    });
  }

  // returning result.
  return {
    text: result
  };
});

// exports.scheduledCheck = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
//   var d = new Date();
//   var n = d.getTime();
//   sendMessage("lean and dab it's " + n);
// });

function sendMessage(number, text) {
  const accountSid = 'AC704a64a71d8f0ec21abfd00870d49be8';
  const authToken = '521346e9f3732692fc345653942f09e8';
  const client = require('twilio')(accountSid, authToken);

  client.messages
    .create({
      body: text,
      from: '+14702857147',
      to: '+1' + number
    })
    .then(message => console.log(message.sid))
    .catch(err => console.log(err));
}
