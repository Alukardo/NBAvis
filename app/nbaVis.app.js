let app = angular.module('nbaVisApp', [
    'ngRoute',
    'ui.router',
    'ngAnimate',
    'ngResource',
    'ngStorage',
    'ngMaterial',
    'ngMdIcons',
    'ngProgress'
]);
app.config(['$routeProvider','$locationProvider','$stateProvider','$urlRouterProvider', function ($routeProvider, $locationProvider, $stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/");
        $stateProvider
            .state('schedule', {
                url: '/',
                templateUrl: 'views/schedule/gameSchedules.html',
                controller: 'scheduleCtrl'
            })
            .state('scheduleDate', {
                url: '/:date',
                templateUrl: 'views/schedule/gameSchedules.html',
                controller: 'scheduleCtrl'
            })
            .state('content', {
                url: '/game/:gameId',
                templateUrl: 'views/content/gameContent.html',
                controller: 'contentCtrl'
            });
    }]);
app.controller('globalCtrl', ['$rootScope', '$state', '$mdBottomSheet', function ($rootScope, $state, $mdBottomSheet) {
    $rootScope.factor = {'x': '', 'y': ''};
    $rootScope.aggregate = {'unit': '', 'value': '', 'threshold': ''};
    $rootScope.data = {'selectedIndex': 0};
    $rootScope.scoreLevel = {'degree': 0};
    $rootScope.matrix = [1, 0, 0, 1, 0, 0];
    $rootScope.previousState = '';
    $rootScope.currentState = '';
    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from) {
        $rootScope.previousState = from['name'];
        $rootScope.currentState = to['name'];
    });
    $rootScope.toolbarMenuClick = function (state) {
        if (state === 'menu') return
        if ($rootScope.previousState === '') {
            $state.go('schedule');
        } else {
            $state.go($rootScope.previousState);
        }

    };
    $rootScope.showToolMenu = function () {
        $mdBottomSheet.show({
            templateUrl: 'views/nav/toolMenu.html',
            controller: 'toolMenuCtrl'
        });
    };
    $rootScope.hexToRGB = function (tempTeamColor, teamScore) {
        let tempR = (parseInt((tempTeamColor).substring(1, 3), 16) - (teamScore / 10.0)) < 0 ? 0 : (parseInt((tempTeamColor).substring(1, 3), 16) + (teamScore * 10));
        let tempG = (parseInt((tempTeamColor).substring(3, 5), 16) - (teamScore / 10.0)) < 0 ? 0 : (parseInt((tempTeamColor).substring(3, 5), 16) + (teamScore * 10));
        let tempB = (parseInt((tempTeamColor).substring(5, 7), 16) - (teamScore / 10.0)) < 0 ? 0 : (parseInt((tempTeamColor).substring(5, 7), 16) + (teamScore * 10));
        return 'rgb(' + tempR + ',' + tempG + ',' + tempB + ')';
    };
}]);
app.controller('toolMenuCtrl', ['$rootScope', '$scope', '$window', function ($rootScope, $scope, $window) {
    $scope.resetMatrix = function () {
        $rootScope.scoreLevel = {'degree': 0};
        $rootScope.factor.x = $window.innerWidth / 180;
        $rootScope.matrix = [1, 0, 0, 1, 0, 0];
        angular.element('scoreboard').children('g').attr('transform', "matrix(" + $rootScope.matrix.join(' ') + ")");
    };
    $scope.resetSelected = function () {
        $rootScope.quarterSelected = false;
        $rootScope.minuteSelected = false;
        $rootScope.quarterDrawData = $rootScope.quarterOriginDrawData;
        $rootScope.minuteDrawData = $rootScope.minuteOriginDrawData;
        $rootScope.playDrawData = $rootScope.playOriginDrawData;
        for (let quarterIndex = 0; quarterIndex < $rootScope.quarterDrawData.length; quarterIndex++) {
            $rootScope.quarterDrawData[quarterIndex].away.isSelected = false;
            $rootScope.quarterDrawData[quarterIndex].home.isSelected = false;
        }
        for (let minuteIndex = 0; minuteIndex < $rootScope.minuteDrawData.length; minuteIndex++) {
            $rootScope.minuteDrawData[minuteIndex].away.isSelected = false;
            $rootScope.minuteDrawData[minuteIndex].home.isSelected = false;
            angular.forEach($rootScope.playDrawData, function (minuteInfo) {
                minuteInfo.away.isSelected = false;
                minuteInfo.home.isSelected = false;
            });
        }
    };
    $scope.compare = function (dataLevel) {
        $rootScope.quarterSelected = false;
        $rootScope.minuteSelected = false;
        $scope.processData = [];
        $scope.processPlayData = [];
        switch (dataLevel) {
            case 0:
                for (let quarterIndex = 0; quarterIndex < $rootScope.quarterDrawData.length; quarterIndex++) {
                    if ($rootScope.quarterDrawData[quarterIndex].away.isSelected) {
                        $scope.processData.push($rootScope['quarterData'][quarterIndex]);
                    }
                }
                if ($scope.processData.length > 0) {
                    return $scope.generateDrawData('q');
                }
                break;
            case 1:
                for (let minuteIndex = 0; minuteIndex < $rootScope.minuteDrawData.length; minuteIndex++) {
                    if ($rootScope.minuteDrawData[minuteIndex].away.isSelected) {
                        $scope.processData.push($rootScope['minuteData'][minuteIndex]);
                    }
                }
                if ($scope.processData.length > 0) {
                    return $scope.generateDrawData('m');
                }
                break;
            case 2:
                for (let minuteIndex = 0; minuteIndex < $rootScope.minuteDrawData.length; minuteIndex++) {
                    if ($rootScope.minuteDrawData[minuteIndex].away.isSelected) {
                        $scope.processData.push($rootScope['minuteData'][minuteIndex]);
                        $scope.processPlayData.push($rootScope.playData[minuteIndex]);
                    }
                }
                if ($scope.processData.length > 0) {
                    $scope.generateDrawData('m');
                    $scope.generateDrawData('p');
                }
                break;
            case 3:
                break;
            default:
                break;
        }
    }
}]);
app.factory('globalService', ['$sessionStorage', function ($sessionStorage) {
    let globalService = {};

    globalService.setGame = function (game) {
        $sessionStorage.game = game;
    };
    globalService.getTeamColor = function (game) {
        let color = {};
        color.home = teamColor[game['homeName']].home;
        color.away = teamColor[game['awayName']].away;
        color.none = "#888888";
        return color;
    };
    globalService.clear = function () {
        $sessionStorage.$reset();
    };
    globalService.Point = function (x, y) {
        this.x = x;
        this.y = y;
    };
    globalService.Line = function (start, end, width, color) {
        this.start = start;
        this.end = end;
        this.width = width;
        this.color = color;
    };
    globalService.Quad = function (upLeft, upRight, bottomRight, bottomLeft, background) {
        this.upLeft = upLeft;
        this.upRight = upRight;
        this.bottomRight = bottomRight;
        this.bottomLeft = bottomLeft;
        this.background = background;
    };
    globalService.Circle = function (center, radius, background) {
        this.center = center;
        this.radius = radius;
        this.background = background;
    };
    return globalService;
}]);
