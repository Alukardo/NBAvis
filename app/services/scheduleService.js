app.constant('WEB_SCHEDULE_SERVICE', 'http://127.0.0.1:8000/gamesch/');
app.factory('scheduleService', function ($http, WEB_SCHEDULE_SERVICE) {
    let service = {};
    service.getGameByDate = function (date, successCallback, errorCallback) {
        $http.get(WEB_SCHEDULE_SERVICE, {params: {"gameDate": date}})
            .success(function (response) {
                console.log('scheduleService Success.');
                successCallback(response);
            })
            .error(function (reason) {
                console.log('scheduleService Fail.');
                errorCallback(reason);
            });
    };
    return service;
});
