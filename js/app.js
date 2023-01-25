var selectStatementEmergency = "Select * from app_Emergency";
var selectStatementIReached = "Select * from app_ireached";
var dbIreached = openDatabase("SecureDb", "1.0", "App I Secure", 200000);  // Open SQLite Database
var datasetEmergency;
var datasetIreached;
var DataType;

dbIreached.transaction(function (tx) {
    tx.executeSql(selectStatementEmergency, [], function (tx, result) {
        datasetEmergency = result.rows;
    });
});

//document.addEventListener("deviceready", init, false);
init();
function init() {

    //document.querySelector("#sendMessage").addEventListener("touchend", function() {

    var interval = setInterval(checkIReached, 2000);

    function checkIReached() {
        var reached = false;
        var d = new Date();
        var time = (d.getHours().toString().length == 1 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes().toString().length == 1 ? "0" + d.getMinutes() : d.getMinutes()) + ":" + (d.getSeconds().toString().length == 1 ? "0" + d.getSeconds() : d.getSeconds());
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                dbIreached.transaction(function (tx) {
                    tx.executeSql(selectStatementIReached, [], function (tx, result) {
                        datasetIreached = result.rows;
                        if (datasetIreached.length == 0) {
                            return false;
                        }
                        else {
                            //alert(dataset.item(0).endlatitude + ' ' + pos.lat);
                            //alert(dataset.item(0).rtime);

                            if (datasetIreached.item(0).rtime != '') {
                                // check for reached
                                var desitination = new google.maps.LatLng(pos.lat, pos.lng);
                                var _kCord = new google.maps.LatLng(parseFloat(datasetIreached.item(0).endlatitude), parseFloat(datasetIreached.item(0).endlongitude));


                                var distance = google.maps.geometry.spherical.computeDistanceBetween(_kCord, desitination);

                                if (distance <= 10) {
                                    //alert('reached');
                                    for (var i = 0; i < datasetEmergency.length; i++) {
                                        var number = datasetEmergency.item(i).EmergencyNumber;
                                        var message = 'Successfully Reached to the particular place.';
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
                                    }
                                    tx.executeSql('delete from app_ireached', [], onSuccess, onError);
                                    reached = true;
                                }
                                // check for time
                                if (reached == false) {
                                    if (datasetIreached.item(0).rtime < time) {

                                        clearInterval(interval);

                                        $('#showDialog').trigger('click');

                                        //clearInterval(interval);
                                        //tx.executeSql('Update app_ireached set rtime = ?', [''], onSuccess, onError);
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
//init();

function onError(tx, error) // Function for Hendeling Error...
{
    alert("dbError: " + error.message);
}
//}, false);
function onSuccess(tx, error) // Function for Hendeling Success...
{
    ShowMessage('Message has been sent to your emgergency numbers.');
}

function onSuccessTime(tx, error) // Function for Hendeling Success...
{
    ShowMessage('Now Message will be send after 2 mintues.');
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
function SendSMS() {
    for (var i = 0; i < datasetEmergency.length; i++) {
        var number = datasetEmergency.item(i).EmergencyNumber;
        var message = 'Does not Reached to the particular place.';
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
    }
    dbIreached.transaction(function (tx) {
        tx.executeSql('Update app_ireached set rtime = ?', [''], onSuccess, onError);
    });
}

function NoSMSSend() {
    if ($('#txtReason').val() != "") {
        dbIreached.transaction(function (tx) {
            var dt = new Date(new Date().getTime() + parseInt(2) * 60000);
            var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            tx.executeSql('Update app_ireached set rtime = ?', [time], onSuccessTime, onError);
        });

        for (var i = 0; i < datasetEmergency.length; i++) {
            var number = datasetEmergency.item(i).EmergencyNumber;
            var message = $('#txtReason').val();
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
        }

        $('#dialogEmergency').popup('close');
        $('#txtReason').hide();
        init();
    }
    else {
        $('#txtReason').show();
        ShowMessage("Please enter the reason.");
    }
}