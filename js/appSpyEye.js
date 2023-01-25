//var selectStatementEmergency = "Select * from app_Emergency";
var selectStatementSpyEye = "Select * from app_SpyEye";
var db = openDatabase("SecureDb", "1.0", "App I Secure", 200000);  // Open SQLite Database
var dataset;
var DataType;

//db.transaction(function (tx) {
//    tx.executeSql(selectStatementEmergency, [], function (tx, result) {
//        datasetEmergency = result.rows;
//    });
//});

//document.addEventListener("deviceready", init, false);
init();
function init() {
    var interval = setInterval(checkSpyEye, 2000);

    function checkSpyEye() {
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                db.transaction(function (tx) {
                    tx.executeSql(selectStatementSpyEye, [], function (tx, result) {
                        dataset = result.rows;
                        if (dataset.length == 0) {
                            return false;
                        }
                        else {

                            for (var j = 0; j < dataset.length; j++) {

                                var source = new google.maps.LatLng(pos.lat, pos.lng);
                                var desitination = new google.maps.LatLng(parseFloat(dataset.item(j).latitude), parseFloat(dataset.item(j).longitude));

                                // check for reached
                                if (dataset.item(j).isReached == "0") {
                                    var distance = google.maps.geometry.spherical.computeDistanceBetween(source, desitination);

                                    if (distance <= 10) {
                                        //alert('reached');
                                        var number = dataset.item(j).EmergencyNumber;
                                        var message = 'Reached to the Ristricted place [' + dataset.item(j).Location + '].';
                                        //simple validation for now
                                        if (number === '' || message === '') return;

                                        sms.send(number, message, {}, function (message) {
                                            console.log("success: " + message);
                                        },
                                        function (error) {
                                            console.log("error: " + error.code + " " + error.message);
                                            navigator.notification.alert(
                                                'Sorry, message not sent: ' + error.message,
                                                null,
                                                'Error',
                                                'Done'
                                            );
                                        });
                                       // alert(message);
                                        tx.executeSql('Update app_SpyEye set isReached = ? where id = ?', ['1', dataset.item(j).id], null, onError);
                                    }
                                }
                                else {
                                    var distance = google.maps.geometry.spherical.computeDistanceBetween(source, desitination);

                                    if (distance >= 100) {
                                        tx.executeSql('Update app_SpyEye set isReached = ? where id = ?', ['0', dataset.item(j).id], null, onError);
                                    }
                                }
                            }
                            
                        }
                    });
                });
            }, function () {
                alert('error');
            });
        }
    }
}

function onError(tx, error) // Function for Hendeling Error...
{
    alert("dbError: " + error.message);
}
function onSuccess(tx, error) // Function for Hendeling Success...
{
    ShowMessage('Message has been sent to your emgergency numbers.');
}

///// Message function
function ShowMessage(message) {
    $.mobile.loading('show',
        {
            theme: "a", text: (message),
            textonly: true, textVisible: true
        });
    setTimeout(function () {
        $.mobile.loading('hide');
    }, 2000);
}