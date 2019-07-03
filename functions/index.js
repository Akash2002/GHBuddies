const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendRequest = functions.https.onCall((data, context) => {

  var result = "Success!";
  var tocontinue = true;

  var count = 0;

  var sentMessage = false;


  const fname = data.fname;
  const lname = data.lname;
  const pnumber = data.pnumber;
  const startingLocation = data.startingLocation;
  const endingLocation = data.endingLocation;

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
    reference.on('value', function(snapshot) {
      snapshot.forEach(function(children) {
        var key = children.key;
        if (fname + " " + lname !== key) {
          reference.child(key).on('value', function(snapshot) {
            snapshot.forEach(function(children) {
              var tempK = children.key;
              reference.child(key).child("request").on('value', function(val) {
                if (val.val() === "null") {
                  reference.child(key).child("startingLocation").on('value', function(val) {
                    if (val.val() === startingLocation) {
                      reference.child(key).child("endingLocation").on('value', function(val) {
                        if (val.val() === endingLocation) {

                          if (!entered) {
                            reference.child(fname + " " + lname).child("request").set(key);
                            reference.child(key).child("request").set(fname + " " + lname);
                            entered = true;
                          }

                          var student2;
                          var num1;
                          var num2;

                          reference.child(fname + " " + lname).child("pnumber").on('value', function(val) {
                            console.log(snapshot.val());
                            num1 = val.val();
                          });

                          reference.child(key).child("pnumber").on('value', function(val) {
                            console.log(snapshot.val());
                            num2 = val.val();
                          });

                          sendMessage(num1, "You have been matched with " + key + "! Please meet them in the lobby in the next 5 minutes.");
                          sendMessage(num2, "You have been matched with " + fname + ' ' + lname + "! Please meet them in the lobby in the next 5 minutes.");
                          return;
                        }
                      });
                    }
                  });
                }
              });
            });
          });
        }
      });
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
