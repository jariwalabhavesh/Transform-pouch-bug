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

exampleApp.service('offlinedataService', function($state, $rootScope) {

    var service = this;
    this.localDB;
    this.remoteDB;
    this.localChanges;
    this.rep;


    this.storeOffLineData = function(databaseName) {


        try {
            service.localDB = new PouchDB(databaseName, {auto_compaction: true});
        } catch (err) {
        }
        var remoteDBStr = "http://172.24.105.60:5984/" + databaseName;
        try {
            service.remoteDB = new PouchDB(remoteDBStr);

        } catch (err) {
        }


        service.rep = PouchDB.replicate(service.localDB, remoteDBStr, {
            conflicts: true,
            include_docs: true,
            live: true
        }).on('error', function(err) {
            console.log("Replication error" + JSON.stringify(err));
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


exampleApp.controller("empController", function($scope, offlinedataService) {
    $scope.offlinedataService = offlinedataService;
    $scope.empName;
    $scope.empDes;

    $scope.offlinedataService.storeOffLineData("employee");

    $scope.addEmployeeData = function() {
        var jsonData = {};
        jsonData["empName"] = $scope.empName;
        jsonData["empDes"] = $scope.empDes;
        $scope.empName = "";
        $scope.empDes = "";
        $scope.offlinedataService.getDataFromLocalDb("empData", function(error, doc) {

            if (error) {
                if (error.status === 404) {
                    console.log("Document not found");
                    var empList = [];
                    empList.push(jsonData);
                    $scope.offlinedataService.addDoc({_id: "empData", dataList: empList});

                }
            } else {
                if (doc) {
                    var data = doc;
                    data.dataList.push(jsonData);
                    $scope.offlinedataService.updateDoc({_id: data._id, _rev: data._rev, dataList: data.dataList});
                }
            }


        });
    };



});
