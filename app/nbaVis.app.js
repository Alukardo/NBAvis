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
app.config(['$routeProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider',
    function ($routeProvider, $locationProvider, $stateProvider, $urlRouterProvider) {
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
    }])
    .controller('globalCtrl', ['$rootScope', '$state', '$mdBottomSheet', '$http', function ($rootScope, $state, $mdBottomSheet) {
    $rootScope.factor = {'x': '', 'y': ''};
    $rootScope.aggregate = {'unit': '', 'value': '', 'threshold': ''};
    $rootScope.data = {'selectedIndex': 0};
    $rootScope.matrix = [1, 0, 0, 1, 0, 0];
    $rootScope.previousState = '';
    $rootScope.currentState = '';
    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from) {
        $rootScope.previousState = from['name'];
        $rootScope.currentState = to['name'];

    });
    $rootScope.toolbarMenuClick = function (state) {
        if (state === 'menu') {

        } else if (state === 'keyboard_backspace') {
            if ($rootScope.previousState === '') {
                $state.go('schedule');
            } else {
                $state.go($rootScope.previousState);
            }
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
}])
    .controller('toolMenuCtrl', ['$rootScope', '$scope', '$mdBottomSheet', '$sessionStorage', '$window', function ($rootScope, $scope, $mdBottomSheet, $sessionStorage, $window) {
    $scope.resetMatrix = function () {
        $rootScope.factor.x = $window.innerWidth / 180;
        $rootScope.matrix = [1, 0, 0, 1, 0, 0];
        angular.element('#gameSVG').children('g').attr('transform', "matrix(" + $rootScope.matrix.join(' ') + ")");
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

}])
    .factory('globalService', ['$sessionStorage', '$http', function ($sessionStorage, $http) {
    let globalService = {};
    let teamColor = {
        "ATL": {"away": "#000080", "home": "#FF0000"},
        "BOS": {"away": "#009E60", "home": "#009E60"},
        "BKN": {"away": "#000000", "home": "#000000"},
        "CHA": {"away": "#1D1160", "home": "#008CA8"},
        "CHI": {"away": "#D4001F", "home": "#D4001F"},
        "CLE": {"away": "#860038", "home": "#FDBB30"},
        "DAL": {"away": "#0B60AD", "home": "#072156"},
        "DEN": {"away": "#4B90CD", "home": "#FDB827"},
        "DET": {"away": "#00519A", "home": "#EB003C"},
        "GSW": {"away": "#04529C", "home": "#FFCC33"},
        "HOU": {"away": "#CE1138", "home": "#CE1138"},
        "IND": {"away": "#092C57", "home": "#FFC322"},
        "LAC": {"away": "#EE2944", "home": "#146AA2"},
        "LAL": {"away": "#4A2583", "home": "#F5AF1B"},
        "MEM": {"away": "#001F70", "home": "#7399C6"},
        "MIA": {"away": "#B62630", "home": "#FF9F00"},
        "MIL": {"away": "#003614", "home": "#E32636"},
        "MIN": {"away": "#0F4D92", "home": "#50C878"},
        "NOP": {"away": "#002B5C", "home": "#B4975A"},
        "NYK": {"away": "#0953A0", "home": "#FF7518"},
        "OKC": {"away": "#007DC3", "home": "#F05133"},
        "ORL": {"away": "#708090", "home": "#0047AB"},
        "PHI": {"away": "#0046AD", "home": "#D0103A"},
        "PHX": {"away": "#1C105E", "home": "#E65F20"},
        "POR": {"away": "#F0163A", "home": "#F0163A"},
        "SAC": {"away": "#753BBD", "home": "#753BBD"},
        "SAS": {"away": "#BEC8C9", "home": "#BEC8C9"},
        "TOR": {"away": "#708090", "home": "#B31B1B"},
        "UTA": {"away": "#00275D", "home": "#0D4006"},
        "WAS": {"away": "#002244", "home": "#C60C30"}
    };
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
