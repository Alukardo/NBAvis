app.controller('scheduleCtrl', ['$rootScope', '$scope', '$filter', '$location', '$state', '$stateParams', 'ngProgress', '$mdDialog', 'scheduleService', 'globalService',
    function ($rootScope, $scope, $filter, $location, $state, $stateParams, ngProgress, $mdDialog, scheduleService, globalService) {
        $scope.init = function () {
            console.log('# ScheduleController initial.');
            ngProgress.height('10px');
            globalService.clear();
            $rootScope.menuIcon = 'menu';
            let date = new Date();
            date.setDate(date.getDate());
            if ($stateParams.date !== undefined) {
                $scope.paramDate = $stateParams.date;
            } else {
                if ($rootScope.gameDate !== undefined) {
                    $scope.paramDate = $rootScope.gameDate;
                } else {
                    $scope.paramDate = $filter('date')(date, 'yyyy-MM-dd');
                }
            }
            $scope.loadSchedulesData();
        };
        $scope.selectDate = function (date) {
            $scope.paramDate = date;
            return $scope.loadSchedulesData();
        };
        $scope.navigateToContent = function (game) {
            globalService.setGame(game);
            $rootScope.gameDate = game.gameDate;
            $state.go('content', {'gameId': game.gameId});
        };
        $scope.loadSchedulesData = function () {
            ngProgress.start();
            console.log('select Game Date : ' + $scope.paramDate);
            scheduleService.getGameByDate(
                $scope.paramDate,
                function (response) {
                    console.log('scheduleCtrl Success.');
                    $scope.dailyGamesList = [];
                    angular.forEach(response, function (item) {
                        $scope.dailyGamesList.push(item);
                    });
                    ngProgress.complete();
                    return $scope.generateGrid();
                },
                function () {
                    console.log('scheduleCtrl Fail.');
                    ngProgress.complete();
                });
        };
        $scope.generateGrid = function () {
            angular.forEach($scope.dailyGamesList, function (game) {
                if (game['homeScore'] < game['awayScore']) {
                    game.background = globalService.getTeamColor(game).away;
                } else if (game['awayScore'] < game['homeScore']) {
                    game.background = globalService.getTeamColor(game).home;
                } else {
                    game.background = '#888888';
                }
                game.rowspan = 1;
                game.colspan = 2;
            });
        };
        return $scope.init();
    }]);
