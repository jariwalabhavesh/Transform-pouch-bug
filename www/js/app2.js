// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var exampleApp = angular.module('starter', ['ionic'])

        .run(function($ionicPlatform) {
            $ionicPlatform.ready(function() {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
        });

exampleApp.service("CipherService", function() {

    this.encrypt = function(message, password) {
        var salt;
        var iv;
        if (localStorage["startUpdata"]) {
            var dt = JSON.parse(localStorage.getItem("startUpdata"));
            salt = forge.util.decode64(dt.salt);
            iv = forge.util.decode64(dt.iv);
        } else {
            salt = forge.random.getBytesSync(128);
            iv = forge.random.getBytesSync(16);
            var dt = {
                salt: forge.util.encode64(salt),
                iv: forge.util.encode64(iv)
            };
            localStorage.setItem("startUpdata", JSON.stringify(dt));
        }
        var key = forge.pkcs5.pbkdf2(password, salt, 4, 16);
        var cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({iv: iv});
        cipher.update(forge.util.createBuffer(message));
        cipher.finish();
        var cipherText = forge.util.encode64(cipher.output.getBytes());
        return cipherText;

    };


    this.decrypt = function(cipherText, password) {
        var salt;
        var iv;
        if (localStorage["startUpdata"]) {
            var dt = JSON.parse(localStorage.getItem("startUpdata"));
            salt = dt.salt;
            iv = dt.iv;
        } else {
            salt = forge.random.getBytesSync(128);
            iv = forge.random.getBytesSync(16);
            var dt = {
                salt: forge.util.encode64(salt),
                iv: forge.util.encode64(iv)
            };
            localStorage.setItem("startUpdata", JSON.stringify(dt));
        }
        var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 16);
        var decipher = forge.cipher.createDecipher('AES-CBC', key);
        decipher.start({iv: forge.util.decode64(iv)});
        decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
        decipher.finish();
        return decipher.output.toString();
    };
});

exampleApp.service('offlinedataService', function($state, $rootScope, CipherService) {

    var service = this;
    this.localDB;
    this.remoteDB;
    this.localChanges;
    this.rep;


    this.isJsonObject = function(jsonData) {
        try {
            JSON.stringify(jsonData);
        } catch (e) {
            return false;
        }
        return true;
    };

    this.isJsonString = function(jsonString) {
        try {
            JSON.parse(jsonString);
        } catch (e) {
            return false;
        }
        return true;
    };

    var transformFunctions = {
        incoming: function(doc) {
            Object.keys(doc).forEach(function(field) {
                if (field !== '_id' && field !== '_rev' && field !== '_revisions') {
                    if (service.isJsonObject(doc[field])) {
                        doc[field] = CipherService.encrypt(JSON.stringify(doc[field]), "1234");
                    } else {
                        doc[field] = CipherService.encrypt(doc[field], "1234");
                    }
                }
            });
            return doc;
        },
        outgoing: function(doc) {
            Object.keys(doc).forEach(function(field) {
                if (field !== '_id' && field !== '_rev' && field !== '_revisions') {
                    try {   //comment this line
                        var decData = CipherService.decrypt(doc[field], "1234");
                        if (service.isJsonString(decData)) {
                            doc[field] = JSON.parse(decData);
                        } else {
                            doc[field] = decData;
                        }
                    } catch (e) {                   //comment this line
                        console.log("e:= " + e);    //comment this line
                    }                               //comment this line
                }
            });
            return doc;
        }
    };



    this.intiData = function(databaseName) {


        try {
            service.localDB = new PouchDB(databaseName, {auto_compaction: true});
        } catch (err) {
        }
        var remoteDBStr = "http://172.24.105.60:5984/" + databaseName;
        try {
            service.remoteDB = new PouchDB(remoteDBStr);

        } catch (err) {
        }

        service.localDB.transform(transformFunctions);
        service.rep = PouchDB.replicate(remoteDBStr, service.localDB, {
            conflicts: true,
            include_docs: true,
            live: true
        }).on('error', function(err) {
            console.log("Replication error" + JSON.stringify(err));
        });
    };

    this.addChangeListiner = function() {
        localChanges = service.localDB.changes({
            since: 'now',
            live: 'true',
            include_docs: true
        }).on('change', function(change) {
            var docData = change.doc;
            $rootScope.$broadcast(docData._id, docData);
        }).on('paused', function(info) {
            // changes() was canceled
            console.log(JSON.stringify(info));
        }).on('error', function(err) {
            console.log(err);
//            alert("err from change" + JSON.stringify(err));
        });
    };

    this.getDataFromLocalDb = function(docId, callback) {
        service.localDB.get(docId, callback);
    };

    this.addDoc = function(data) {
        service.localDB.post(data);
    };

    this.updateDoc = function(data) {
        service.localDB.put(data);
    };


});



exampleApp.controller("readController", function($scope, offlinedataService, $timeout) {
    $scope.offlinedataService = offlinedataService;
    $scope.offlinedataService.intiData("employee");
    $scope.employeeData = [];




    $scope.loadEmployeeData = function() {
        $scope.offlinedataService.getDataFromLocalDb("empData", function(error, doc) {
            if (error) {
                if (error.status === 404) {
                    console.log("Document not found");
                }
            } else {
                if (doc) {
                    $scope.employeeData = doc.dataList;
                    $scope.$apply();
                }
            }
        });
    };

    $scope.$on("empData", function(event, data) {
        $scope.employeeData = data.dataList;
        $scope.$apply();

    });
    $scope.loadEmployeeData();
    $timeout(function() {
        $scope.offlinedataService.addChangeListiner();
    }, 2000);

});
