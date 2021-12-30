app.constant('WEB_CONTENT_SERVICE', 'http://127.0.0.1:8000/pdp/');
app.constant('BOX_WEB_CONTENT_SERVICE', 'http://127.0.0.1:8000/playerd/');
app.factory('contentService', ['$http', 'WEB_CONTENT_SERVICE', 'BOX_WEB_CONTENT_SERVICE', function ($http, WEB_CONTENT_SERVICE, BOX_WEB_CONTENT_SERVICE) {
        let service = {};
        service.getGameBoxDataByID = function (data, successCallback, errorCallback) {
            $http.get(BOX_WEB_CONTENT_SERVICE, {params: {"gameId": data.gameId}})
                .success(function (response) {
                    console.log('contentService_box Success.');
                    successCallback(response);
                })
                .error(function (reason) {
                    console.log('contentService_box Fail.');
                    errorCallback(reason);
                });
        };
        service.getGameDataByID = function (data, successCallback, errorCallback) {
            $http.get(WEB_CONTENT_SERVICE, {params: {"gameId": data.gameId}})
                .success(function (response) {
                    console.log('contentService_pdp Success.');
                    successCallback(response);
                })
                .error(function (reason) {
                    console.log('contentService_pdp Fail.');
                    errorCallback(reason);
                });
        };
        return service;
    }]);
