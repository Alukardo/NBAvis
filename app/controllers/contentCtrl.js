addScript('app/utils/contentUtils.js');
app.controller('contentCtrl', ['$rootScope', '$scope', '$mdBottomSheet', '$stateParams', '$sessionStorage', '$window', 'ngProgress', 'contentService', 'globalService',
    function ($rootScope, $scope, $mdBottomSheet, $stateParams, $sessionStorage, $window, ngProgress, contentService, globalService) {

        let Point = globalService.Point;
        let Line = globalService.Line;
        let Quad = globalService.Quad;
        let Circle = globalService.Circle;

        $scope.compareColor = function (home, away) {
            let tempCompareColor = '#CCCCCC';
            if (away > home) {
                tempCompareColor = $scope.teamColor.away;
            }
            if (away < home) {
                tempCompareColor = $scope.teamColor.home;
            }
            return tempCompareColor;
        };
        $scope.predictSide = function (teamId) {
            let predict = {teamM: '', color: '', group: 0};
            if (teamId === $scope.game['homeId']) {
                predict.teamM = 'home';
                predict.color = $scope.teamColor.home;
                predict.group = 0;
            }
            if (teamId === $scope.game['awayId']) {
                predict.teamM = 'away';
                predict.color = $scope.teamColor.away;
                predict.group = 1;
            }
            return predict;
        };

        $scope.init = function () {

            console.log('contentCtrl.init Run.');
            ngProgress.height('10px');

            $rootScope.menuIcon = 'arrow_back';
            $rootScope.quarterSelected = false;
            $rootScope.minuteSelected = false;
            $rootScope.data.selectedIndex = undefined;

            $rootScope.aggregate.unit = 0;
            $rootScope.aggregate.value = 0;
            $rootScope.aggregate.threshold = 0;

            $rootScope.quarterScore = [];
            $rootScope.quarterOriginDrawData = [];
            $rootScope.quarterDrawData = [];

            $rootScope.quarterEmpty = [];
            $rootScope.quarterGap = 100;

            $rootScope.minuteScore = [];
            $rootScope.minuteOriginDrawData = [];
            $rootScope.minuteDrawData = [];

            $rootScope.playData = [];
            $rootScope.playOriginDrawData = [];
            $rootScope.playDrawData = [];

            $rootScope.storyLineData = [];
            $rootScope.storyLineDrawData = [];
            $rootScope.storyLineOriginDrawData = [];

            $rootScope.eventData = [];
            $rootScope.playerInfo = [];
            $rootScope.playerInfoL = [];
            $rootScope.storyLine2 = {'characters': [], 'scenes': [], 'charactersMap': {}};

            $rootScope.storyLineInteractionCount = [];
            $rootScope.sortedY = [];
            $rootScope.sortedList = [];

            $scope.rawData = undefined;
            $scope.loadFlag = false;

            $scope.game = $sessionStorage.game;
            $scope.teamColor = globalService.getTeamColor($scope.game);
            $scope.playerCount = 0;

            $scope.initializeWindowSize();
            return $scope.loadContentData();
        };
        $scope.initializeWindowSize = function () {
            $scope.windowWidth = $window.innerWidth;
            $scope.windowHeight = $window.innerHeight;
            $scope.halfHeightY = $scope.windowHeight / 2.5;
            $rootScope.factor.x = $scope.windowWidth / 180;
            $rootScope.factor.y = $scope.windowHeight / 80;

        };
        $scope.loadContentData = function () {
            if ($sessionStorage.rawData === undefined) {
                ngProgress.start();
                contentService.getGameBoxDataByID(
                    $sessionStorage.game,
                    function (response) {
                        console.log('contentCtrl.loadContentData.getGameBoxData Success');
                        $sessionStorage.playerData = response;
                        $sessionStorage.playerData.forEach(function (player) {
                            let playerName = player['firstName'] + ' ' + player['lastName'];
                            $rootScope.playerInfo[playerName] = player;
                        });
                        contentService.getGameDataByID(
                            $sessionStorage.game,
                            function (response) {
                                console.log('contentCtrl.loadContentData.getGameDataByID Success');
                                $sessionStorage.rawData = response;
                                $scope.rawData = response;
                                ngProgress.complete();
                                $scope.loadFlag = true;
                                return $scope.generateData();
                            },
                            function () {
                                console.log('contentCtrl.loadContentData.getGameDataByID Failed');
                                ngProgress.complete();
                            });
                    },
                    function () {
                        console.log('contentCtrl.loadContentData.getGameBoxData Failed');
                        ngProgress.complete();
                    });
                console.log('# loadContentData  ');
            } else {
                ngProgress.start();
                $scope.rawData = $sessionStorage.rawData;
                $scope.rawPlayerData = $sessionStorage.playerData;
                $sessionStorage.playerData.forEach(function (player) {
                    let playerName = player['firstName'] + ' ' + player['lastName'];
                    $rootScope.playerInfo[playerName] = player;
                });
                ngProgress.complete();
                $scope.loadFlag = true;
                return $scope.generateData();
            }
        };
        $scope.generateData = function () {

            if ($scope.loadFlag === false) return;
            console.log('# Generate Game Data');

            angular.forEach($scope.rawData, function (quarter) {
                let score = {home: 0, away: 0};
                angular.forEach(quarter, function (minute) {
                    angular.forEach(minute, function (event) {
                        score.home += event['home_point'];
                        score.away += event['away_point'];
                    });
                });
                $rootScope.quarterScore.push(score);
            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    let score = {quarter: 0, minute: 0, home: 0, away: 0};
                    angular.forEach(minute, function (event) {
                        score.quarter = event['quarterId'];
                        score.minute = event['minute'];
                        score.home += event['home_point'];
                        score.away += event['away_point'];
                    });
                    $rootScope.minuteScore.push(score);
                });
            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    let tempMinutePlayHomeArray = [];
                    let tempMinutePlayAwayArray = [];
                    angular.forEach(minute, function (event) {
                        $rootScope.eventData.push(event);
                        let tempPlayInfo = {eventId: event['eventId'], type: event['event_type'], point: 0};
                        if (event['home_description'] != null) {
                            tempPlayInfo.point = event['home_point'];
                            tempMinutePlayHomeArray.push(tempPlayInfo);
                        }
                        if (event['away_description'] != null) {
                            tempPlayInfo.point = event['away_point'];
                            tempMinutePlayAwayArray.push(tempPlayInfo);
                        }
                    });
                    let tempPlayData = {home: tempMinutePlayHomeArray, away: tempMinutePlayAwayArray};
                    $rootScope.playData.push(tempPlayData);
                });
            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    angular.forEach(minute, function (event) {
                        angular.forEach(event['players'], function (player) {
                            if (player.name !== null && $rootScope.storyLineData[player.name] === undefined) {
                                $rootScope.storyLineData[player.name] = [];
                            }
                            if (player.name !== null) {
                                $rootScope.storyLineData[player.name].push(event['eventId']);
                            }
                        });
                    });
                });
            });

            // Story Lines
            let preOffsetX = -1;
            let pIndex = {'home': 0, 'away': 0};
            let Index = {'home': 0, 'away': 0};

            $rootScope.storyLine = {'pre': {}, 'data': [], 'ps': [], 'draw': {}};
            angular.forEach($sessionStorage.playerData, function (player) {
                let playerName = player['firstName'] + ' ' + player['lastName'];
                let playerId = player['id'];
                if (player['team'] === $scope.game['homeId']) {
                    $rootScope.storyLine.pre[playerId] = {
                        name: playerName,
                        startX: 150,
                        startY: Math.floor($scope.halfHeightY - $rootScope.factor.y * (5 + pIndex.home * 3)),
                        color: $scope.teamColor.home
                    };
                    pIndex.home++;
                }
                if (player['team'] === $scope.game['awayId']) {
                    $rootScope.storyLine.pre[playerId] = {
                        name: playerName,
                        startX: 150,
                        startY: Math.floor($scope.halfHeightY + $rootScope.factor.y * (5 + pIndex.away * 3)),
                        color: $scope.teamColor.away
                    };
                    pIndex.away++;
                }
                $rootScope.storyLine.ps.push(playerId);
                $rootScope.storyLine.draw[playerId] = [];

            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    angular.forEach(minute, function (event) {
                        let offsetX = event['timeOffset'];
                        let actType = event['event_type'];
                        if (offsetX <= preOffsetX) offsetX = preOffsetX + 1;
                        let temp = [];
                        angular.forEach($sessionStorage.playerData, function (player) {
                            let playerName = player['firstName'] + ' ' + player['lastName'];
                            let playerId = player['id'];
                            let position = 0;
                            if (event['players'][0].id === playerId) position = 1;
                            if (event['players'][1].id === playerId) position = 2;
                            if (event['players'][2].id === playerId) position = 3;
                            let offsetY = eventWeight(actType, position);
                            if (player['team'] === $scope.game['homeId']) {
                                temp.push({
                                    id: playerId,
                                    name: playerName,
                                    team: player['team'],
                                    position: Index.home,
                                    offsetX: offsetX,
                                    offsetY: 0 - offsetY,
                                    available: player['starter']
                                });
                                Index.home++;
                            }
                            if (player['team'] === $scope.game['awayId']) {
                                temp.push({
                                    id: playerId,
                                    name: playerName,
                                    team: player['team'],
                                    position: Index.away,
                                    offsetX: offsetX,
                                    offsetY: 0 - offsetY,
                                    available: player['starter']
                                });
                                Index.away++;
                            }
                        });

                        $rootScope.storyLine.data.push(temp);
                        preOffsetX = offsetX;
                    });
                });
            });
            angular.forEach($rootScope.storyLine.data, function (record) {
                angular.forEach(record, function (p) {
                    let x = $rootScope.storyLine.pre[p.id].startX + p.offsetX;
                    let y = $rootScope.storyLine.pre[p.id].startY + p.offsetY * 10 - 5;
                    let y0 = y;
                    let y1 = $rootScope.storyLine.pre[p.id].startY + 10;
                    $rootScope.storyLine.draw[p.id].push({'x': x, 'y': y, 'y0': y0, 'y1': y1});
                });
            });

            // Story Lines 2

            let playerStatus = {};
            let tempScoreSum = {'home': 0, 'away': 0};
            $rootScope.eventGapsce = {
                'home': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}],
                'away': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}]
            };
            $rootScope.eventEffect = {
                'home': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}],
                'away': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}]
            };
            $rootScope.eventTurnin = {
                'home': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}],
                'away': [{'x': 0, 'y0': 0, 'y1': 0, 'quarter': 0}]
            };
            angular.forEach($sessionStorage.playerData, function (player) {
                let temp = {id: '', name: '', width: 0, affiliation: '', color: '', initialGroup: undefined};
                temp.id = player['id'];
                temp.name = player['firstName'] + ' ' + player['lastName'];
                temp.width = temp.name.length * 10;
                temp.affiliation = $scope.predictSide(player['team']).teamM;
                temp.color = $scope.predictSide(player['team']).color;
                temp.initialGroup = $scope.predictSide(player['team']).group;
                // temp.initialGroup = 0;
                playerStatus[temp.id] = player['starter'];
                $rootScope.storyLine2.charactersMap[temp.id] = temp;
                $rootScope.storyLine2.characters.push($rootScope.storyLine2.charactersMap[temp.id]);

            });
            let playerStat = {}
            angular.forEach($sessionStorage.playerData, function (player) {
                playerStat[player.id] = player['starter'];
            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    angular.forEach(minute, function (event) {
                        event.description = [];
                        if (event['home_description'] !== "") {
                            let temp = description(event['home_description'], event['event_type'], $rootScope.playerInfo, $sessionStorage.playerData);
                            temp.forEach(function (item) {
                                event.description.push(item);
                            });
                        }
                        if (event['away_description'] !== "") {
                            let temp = description(event['away_description'], event['event_type'], $rootScope.playerInfo, $sessionStorage.playerData);
                            temp.forEach(function (item) {
                                event.description.push(item);
                            });
                        }
                    });
                })
            });
            angular.forEach($scope.rawData, function (quarter) {
                angular.forEach(quarter, function (minute) {
                    angular.forEach(minute, function (event) {
                        //console.log(event['eventId'] + " # " + event['event_type'] + " : " + event['timeDuring']);
                        let scene = {
                            id: 0,
                            quarter: 0,
                            timeOffset: 0,
                            characters: [],
                            start: 0,
                            duration: 0,
                            type: 0,
                            status: {},
                            weight: 0,
                            description: []
                        };
                        let players = event['players'].filter(function (player) {
                            return player.id !== null && player.name !== null && player.team !== null;
                        });
                        if (event['event_type'] === 10) {
                            players.shift();
                            players.shift();
                        }
                        if (event['event_type'] === 13) {
                            let i = 0;
                            angular.forEach($sessionStorage.playerData, function (player) {
                                let scene = {
                                    id: 0,
                                    quarter: 0,
                                    timeOffset: 0,
                                    characters: [],
                                    start: 0,
                                    duration: 0,
                                    type: 0,
                                    status: {},
                                    weight: 0,
                                    description: []
                                };
                                scene.id = event.eventId + '-' + (i++).toString();
                                scene.type = event['event_type'];
                                scene.quarter = event['quarterId'] - 1;
                                scene.timeOffset = event['timeOffset'];
                                scene.characters.push($rootScope.storyLine2.charactersMap[player.id]);
                                scene.status = deepCopy(playerStatus);
                                scene.start = event['timeOffset'] + (scene.quarter + 1) * $rootScope.quarterGap;
                                scene.duration = 1;
                                $rootScope.storyLine2.scenes.push(scene);
                            });
                            scene.start = event['timeOffset'] + (scene.quarter + 1 + 1) * $rootScope.quarterGap;
                            scene.duration = 1;
                            let x = scene.start + scene.duration;
                            $rootScope.eventEffect.away.push({'x': x, 'y0': 0, 'y1': 0, 'quarter': scene.quarter});
                            $rootScope.eventEffect.home.push({'x': x, 'y0': 0, 'y1': 0, 'quarter': scene.quarter});
                        }
                        if (event['event_type'] === 12) {
                            scene.start = event['timeOffset'] + (scene.quarter + 1) * $rootScope.quarterGap;
                            scene.duration = 1;
                            let x = scene.start + scene.duration;
                            $rootScope.eventEffect.away.push({'x': x, 'y0': 0, 'y1': 0});
                            $rootScope.eventEffect.home.push({'x': x, 'y0': 0, 'y1': 0});
                        }
                        if (players.length > 0) {
                            scene.id = event.eventId;
                            scene.type = event['event_type'];
                            scene.quarter = event['quarterId'] - 1;
                            scene.timeOffset = event['timeOffset'];
                            players.forEach(function (player, i) {
                                scene.characters.push($rootScope.storyLine2.charactersMap[player.id]);
                                scene.status = deepCopy(playerStatus);
                                scene.weight += eventWeight(scene.type, i + 1);
                            });
                            if (event['event_type'] === 8) {
                                playerStatus[players[0].id] = false;
                                playerStatus[players[1].id] = true;
                            }
                            scene.start = event['timeOffset'] + (scene.quarter + 1) * $rootScope.quarterGap;
                            scene.duration = 1;
                            scene.description = event.description;
                            $rootScope.storyLine2.scenes.push(scene);


                            let sceneTeam = $scope.predictSide(players[0].team);
                            let score_gap = 2 * (event['home_score'] - event['away_score']);
                            let score_gap_h = score_gap > 0 ? score_gap : 0;
                            let score_gap_a = score_gap < 0 ? -score_gap : 0;


                            let effect = eventEffect(event['event_type'], event['timeDuring'], sceneTeam.teamM);
                            let minEffect = Math.min(effect.away, effect.home);
                            let x = event['timeOffset'] + (scene.quarter) * $rootScope.quarterGap;
                            let factor = 2.0;
                            $rootScope.eventEffect.away.push({
                                'x': x,
                                'y0': (-effect.away + minEffect) * factor,
                                'y1': 0,
                                'quarter': scene.quarter
                            });
                            $rootScope.eventEffect.home.push({
                                'x': x,
                                'y0': 0,
                                'y1': (effect.home - minEffect) * factor,
                                'quarter': scene.quarter
                            });

                            $rootScope.eventGapsce.away.push({
                                'x': x,
                                'y0': -score_gap_a,
                                'y1': 0,
                                'quarter': scene.quarter
                            });
                            $rootScope.eventGapsce.home.push({
                                'x': x,
                                'y0': 0,
                                'y1': score_gap_h,
                                'quarter': scene.quarter
                            });

                            //Turning Point
                            if (event['home_point'] !== event['away_point']) {
                                if (event['home_point'] !== 0) {
                                    tempScoreSum.home += event['home_point'];
                                    tempScoreSum.away = 0;
                                }
                                if (event['away_point'] !== 0) {
                                    tempScoreSum.away += event['away_point'];
                                    tempScoreSum.home = 0;
                                }
                            }
                            $rootScope.eventTurnin.away.push({
                                'x': x,
                                'y0': -3 * tempScoreSum.away,
                                'y1': 0,
                                'quarter': scene.quarter
                            });
                            $rootScope.eventTurnin.home.push({
                                'x': x,
                                'y0': 0,
                                'y1': 3 * tempScoreSum.home,
                                'quarter': scene.quarter
                            });
                        }
                    });
                });
            });
            return $scope.generateDrawData();
        };
        $scope.generateDrawData = function () {

            $rootScope.quarterDrawData = [];
            $rootScope.minuteDrawData = [];
            $rootScope.playDrawData = [];
            $rootScope.storyLineDrawData = [];

            let lineWidth = 0.5;
            let MinuteGap = 1.0;
            let QuarterGap = $rootScope.factor.x;
            let mOffset = 5.0;

            let homeOrg = {'x': 80, 'y': $scope.halfHeightY + $rootScope.factor.y * 2};
            let awayOrg = {'x': 80, 'y': $scope.halfHeightY - $rootScope.factor.y * 2};

            $scope.Icon = {'home': null, 'away': null};
            $scope.Icon.home = {'x': 0, 'y': homeOrg.y};
            $scope.Icon.away = {'x': 0, 'y': awayOrg.y - $rootScope.factor.y * 10};

            if ($scope.loadFlag === false) return;
            console.log('# Generate Draw Data');

            angular.forEach($rootScope.quarterScore, function (quarterScore, quarterIndex) {

                let QuarterObj = {home: null, away: null, compareLine: {startLine: null, endLine: null}};

                let minuteCount = quarterIndex < 4 ? 12 : 5;

                let QuarterOffset_X = {
                    home: (quarterScore.home + minuteCount) * $rootScope.factor.x + MinuteGap * (minuteCount + 1),
                    away: (quarterScore.away + minuteCount) * $rootScope.factor.x + MinuteGap * (minuteCount + 1)
                };
                let QuarterOffset_Y = {
                    home: $rootScope.factor.y * 10,
                    away: 0 - $rootScope.factor.y * 10
                };
                QuarterObj.home = new Quad(
                    new Point(homeOrg.x, homeOrg.y),
                    new Point(homeOrg.x, homeOrg.y + QuarterOffset_Y.home),
                    new Point(homeOrg.x + QuarterOffset_X.home, homeOrg.y + QuarterOffset_Y.home),
                    new Point(homeOrg.x + QuarterOffset_X.home, homeOrg.y)
                );
                QuarterObj.away = new Quad(
                    new Point(awayOrg.x, awayOrg.y),
                    new Point(awayOrg.x, awayOrg.y + QuarterOffset_Y.away),
                    new Point(awayOrg.x + QuarterOffset_X.away, awayOrg.y + QuarterOffset_Y.away),
                    new Point(awayOrg.x + QuarterOffset_X.away, awayOrg.y),
                );
                QuarterObj.compareLine.startLine = new Line(new Point(homeOrg.x, homeOrg.y), new Point(awayOrg.x, awayOrg.y), lineWidth, $scope.compareColor(homeOrg.x, awayOrg.x));
                QuarterObj.compareLine.endLine = new Line(new Point(homeOrg.x + QuarterOffset_X.home, homeOrg.y), new Point(awayOrg.x + QuarterOffset_X.away, awayOrg.y), lineWidth, $scope.compareColor(homeOrg.x + QuarterOffset_X.home, awayOrg.x + QuarterOffset_X.away));

                homeOrg.x += QuarterOffset_X.home + QuarterGap;
                awayOrg.x += QuarterOffset_X.away + QuarterGap;


                QuarterObj.home.isSelected = false;
                QuarterObj.away.isSelected = false;

                $rootScope.quarterDrawData.push(QuarterObj);
            });
            let xRefendOb = $rootScope.quarterDrawData[$rootScope.quarterDrawData.length - 1].compareLine.endLine;
            $scope.contextWidth = xRefendOb.start.x >= xRefendOb.end.x ? xRefendOb.start.x + mOffset : xRefendOb.end.x + mOffset;
            homeOrg.x = 80 + MinuteGap;
            homeOrg.y = $scope.halfHeightY + $rootScope.factor.y * 2;
            awayOrg.x = 80 + MinuteGap;
            awayOrg.y = $scope.halfHeightY - $rootScope.factor.y * 2;

            let tempQuarter = 1;
            angular.forEach($rootScope.minuteScore, function (minuteInfo) {
                let MinuteObj = {home: null, away: null, compareLine: {startLine: null, endLine: null}};

                let Background = {home: '', away: ''};
                Background.home = minuteInfo.home === 0 ? '#666666' : $rootScope.hexToRGB($scope.teamColor.home, minuteInfo.home);
                Background.away = minuteInfo.away === 0 ? '#666666' : $rootScope.hexToRGB($scope.teamColor.away, minuteInfo.away);

                let MinuteOffset_X = {
                    home: (minuteInfo.home + 1.0) * $rootScope.factor.x,
                    away: (minuteInfo.away + 1.0) * $rootScope.factor.x
                };
                let MinuteOffset_Y = {
                    home: $rootScope.factor.y * 10,
                    away: 0 - $rootScope.factor.y * 10
                };
                if (tempQuarter !== minuteInfo.quarter) {
                    homeOrg.x += QuarterGap + MinuteGap;
                    awayOrg.x += QuarterGap + MinuteGap;
                    tempQuarter = minuteInfo.quarter;
                }
                MinuteObj.home = new Quad(
                    new Point(homeOrg.x, homeOrg.y + MinuteOffset_Y.home - mOffset),
                    new Point(homeOrg.x + MinuteOffset_X.home, homeOrg.y + MinuteOffset_Y.home - mOffset),
                    new Point(homeOrg.x + MinuteOffset_X.home, homeOrg.y + mOffset),
                    new Point(homeOrg.x, homeOrg.y + mOffset),
                    Background.home);

                MinuteObj.away = new Quad(
                    new Point(awayOrg.x, awayOrg.y + MinuteOffset_Y.away + mOffset),
                    new Point(awayOrg.x + MinuteOffset_X.away, awayOrg.y + MinuteOffset_Y.away + mOffset),
                    new Point(awayOrg.x + MinuteOffset_X.away, awayOrg.y - mOffset),
                    new Point(awayOrg.x, awayOrg.y - mOffset),
                    Background.away);

                MinuteObj.compareLine.startLine = new Line(new Point(awayOrg.x, awayOrg.y), new Point(homeOrg.x, homeOrg.y), lineWidth, $scope.compareColor(homeOrg.x, awayOrg.x));
                MinuteObj.compareLine.endLine = new Line(new Point(awayOrg.x + MinuteOffset_X.away, awayOrg.y), new Point(homeOrg.x + MinuteOffset_X.home, homeOrg.y), lineWidth, $scope.compareColor(homeOrg.x + MinuteOffset_X.home, awayOrg.x + MinuteOffset_X.away));

                homeOrg.x += MinuteOffset_X.home + MinuteGap;
                awayOrg.x += MinuteOffset_X.away + MinuteGap;

                MinuteObj.home.isSelected = false;
                MinuteObj.away.isSelected = false;

                $rootScope.minuteDrawData.push(MinuteObj);
            });

            let tempPlayDrawData = [];
            let tempMinutePlayHomeDrawArray = [], tempMinutePlayAwayDrawArray = [];
            let tempPlayHomeDrawInfo = {}, tempPlayAwayDrawInfo = {};
            let background = '', radius = 1, lastRadius = 1;

            let homePlay = {'x': 80, 'y': $scope.halfHeightY + $rootScope.factor.y * 2};
            let awayPlay = {'x': 80, 'y': $scope.halfHeightY - $rootScope.factor.y * 2};
            let lastHomeScorePlayRadius = 0;
            let lastAwayScorePlayRadius = 0;
            let tempPlayHomeIndex = 0, tempPlayAwayIndex = 0;

            angular.forEach($rootScope.playData, function (minuteInfo, minuteIndex) {
                tempPlayDrawData = [];
                tempMinutePlayAwayDrawArray = [];
                tempMinutePlayHomeDrawArray = [];

                awayPlay.x = $scope.minuteDrawData[minuteIndex].away.bottomLeft.x;
                awayPlay.y = awayOrg.y - mOffset;

                homePlay.x = $scope.minuteDrawData[minuteIndex].home.bottomLeft.x;
                homePlay.y = homeOrg.y + mOffset;

                lastHomeScorePlayRadius = 0;
                lastAwayScorePlayRadius = 0;
                tempPlayAwayIndex = minuteInfo.away.length;
                tempPlayHomeIndex = minuteInfo.home.length;

                angular.forEach(minuteInfo.away, function (playInfo, playIndex) {
                    tempPlayAwayDrawInfo = {};
                    background = '';
                    radius = 1;
                    if (playInfo.point === 0) {
                        background = '#000000';
                        radius = ((1 / 2) * $rootScope.factor.x) - MinuteGap;
                    } else {
                        background = $rootScope.hexToRGB($scope.teamColor.away, 10);
                        radius = (((playInfo.point + (1 / tempPlayAwayIndex)) / 2) * $rootScope.factor.x) - MinuteGap;
                    }
                    if (playIndex === 0) {
                        if ($rootScope.minuteScore[minuteIndex].away > 0 && tempPlayAwayIndex > 1) {
                            awayPlay.x += (0.25 * $rootScope.factor.x);
                        }
                        awayPlay.x += radius;
                        awayPlay.y -= radius;
                    } else {
                        if (playInfo.point > 0) {
                            if (lastRadius === (((1 / 2) * $rootScope.factor.x) - MinuteGap)) {
                                if (lastAwayScorePlayRadius === 0) {
                                    awayPlay.x = awayPlay.x + radius;
                                } else {
                                    awayPlay.x = lastAwayScorePlayRadius + radius;
                                }
                            } else {
                                awayPlay.x += lastRadius + radius;
                            }
                        }
                        awayPlay.y -= radius + lastRadius;
                    }
                    tempPlayAwayDrawInfo = new Circle(new Point(awayPlay.x, awayPlay.y), radius, background);
                    tempPlayAwayDrawInfo.eventId = playInfo.eventId;
                    tempMinutePlayAwayDrawArray.isSelected = false;
                    tempMinutePlayAwayDrawArray.push(tempPlayAwayDrawInfo);
                    lastRadius = radius;
                    if (playInfo.point > 0) {
                        lastAwayScorePlayRadius = awayPlay.x + radius;
                    }
                });
                angular.forEach(minuteInfo.home, function (playInfo, playIndex) {
                    tempPlayHomeDrawInfo = {};
                    background = '';
                    radius = 1;
                    if (playInfo.point === 0) {
                        background = '#000000';
                        radius = ((1 / 2) * $rootScope.factor.x) - MinuteGap;
                    } else {
                        background = $rootScope.hexToRGB($scope.teamColor.home, 10);
                        radius = (((playInfo.point + (1 / tempPlayHomeIndex)) / 2) * $rootScope.factor.x) - MinuteGap;
                    }
                    if (playIndex === 0) {
                        if ($rootScope.minuteScore[minuteIndex].home > 0 && tempPlayHomeIndex > 1) {
                            homePlay.x += (0.25 * $rootScope.factor.x);
                        }
                        homePlay.x += radius;
                        homePlay.y += radius;
                    } else {
                        if (playInfo.point > 0) {
                            if (lastRadius === (((1 / 2) * $rootScope.factor.x) - MinuteGap)) {
                                if (lastHomeScorePlayRadius === 0) {
                                    homePlay.x = homePlay.x + radius;
                                } else {
                                    homePlay.x = lastHomeScorePlayRadius + radius;
                                }
                            } else {
                                homePlay.x += lastRadius + radius;
                            }
                        }
                        homePlay.y += radius + lastRadius;
                    }
                    tempPlayHomeDrawInfo = new Circle(new Point(homePlay.x, homePlay.y), radius, background);
                    tempPlayHomeDrawInfo.eventId = playInfo.eventId;
                    tempMinutePlayHomeDrawArray.isSelected = false;
                    tempMinutePlayHomeDrawArray.push(tempPlayHomeDrawInfo);
                    lastRadius = radius;
                    if (playInfo.point > 0) {
                        lastHomeScorePlayRadius = homePlay.x + radius;
                    }
                });

                tempPlayDrawData.home = tempMinutePlayHomeDrawArray;
                tempPlayDrawData.away = tempMinutePlayAwayDrawArray;
                $rootScope.playDrawData.push(tempPlayDrawData);
            });

            console.log('# storyLine start .');

            $scope.interactionCountCalculation();

            let tempOrg = {'x': 150, 'y': 0};
            let tempEnd = {'x': 0, 'y': 0};

            let interactionFactor = 1;
            let tempPathObj = {};
            let tempColor;

            for (let playerName in $rootScope.storyLineData) {
                if ($rootScope.playerInfo[playerName] === undefined) continue;
                tempOrg.x = 150;
                tempOrg.y = Math.floor($rootScope.sortedY[playerName]) - 5;
                let tempOrgP = 'M' + tempOrg.x + ' ' + tempOrg.y;
                tempColor = $rootScope.playerInfo[playerName]['team'] === $scope.game['homeId'] ? $scope.teamColor.home : $scope.teamColor.away;
                tempPathObj = $rootScope.storyLineDrawData[playerName] === undefined ?
                    {
                        path: tempOrgP,
                        points: [{x: tempOrg.x, y: tempOrg.y}],
                        color: tempColor,
                        width: 1
                    } : $rootScope.storyLineDrawData[playerName];
                angular.forEach($rootScope.storyLineData[playerName], function (eventId) {
                    tempEnd.x = $rootScope.eventData[eventId]['timeOffset'] * interactionFactor + 150;
                    tempEnd.y = tempOrg.y;
                    if (tempEnd.x > tempOrg.x) {
                        tempPathObj.path = tempPathObj.path + ' L' + tempEnd.x + ' ' + tempOrg.y;
                        tempPathObj.points.push({x: tempEnd.x, y: tempOrg.y});
                        tempOrg.x = tempEnd.x;
                    }
                    switch ($rootScope.eventData[eventId]['event_type']) {
                        case 1:
                        case 2:
                        case 3:
                            if ($rootScope.eventData[eventId]['players'][0]['name'] === playerName) {
                                if ($rootScope.eventData[eventId]['players'][1]['id'] != null) {
                                    let playerName1 = $rootScope.eventData[eventId]['players'][1]['name'];
                                    if ($rootScope.sortedY[playerName] < $rootScope.sortedY[playerName1]) {
                                        tempEnd.y = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) - 2;
                                    } else {
                                        tempEnd.y = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) + 2;
                                    }

                                    tempPathObj.path += ' L' + Math.floor(tempOrg.x + 1) + ' ' + tempEnd.y + ' L' + Math.floor(tempOrg.x + 2) + ' ' + tempOrg.y;
                                    tempPathObj.points.push({x: Math.floor(tempOrg.x + 1), y: tempEnd.y});
                                    tempPathObj.points.push({x: Math.floor(tempOrg.x + 2), y: tempOrg.y});
                                    tempOrg.x = Math.floor(tempEnd.x + 2);
                                }
                            }
                            if ($rootScope.eventData[eventId]['players'][1]['name'] === playerName) {
                                let playerName1 = $rootScope.eventData[eventId]['players'][0]['name'];
                                if ($rootScope.sortedY[playerName] < $rootScope.sortedY[playerName1]) {
                                    tempEnd.y = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) - 2;
                                } else {
                                    tempEnd.y = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) + 2;
                                }
                                tempPathObj.path += ' L' + Math.floor(tempOrg.x + 1) + ' ' + tempEnd.y + ' L' + Math.floor(tempOrg.x + 2) + ' ' + tempOrg.y;
                                tempPathObj.points.push({x: Math.floor(tempOrg.x + 1), y: tempEnd.y});
                                tempPathObj.points.push({x: Math.floor(tempOrg.x + 2), y: tempOrg.y});
                                tempOrg.x = Math.floor(tempEnd.x + 2);
                            }
                            break;
                        default:
                            break;
                    }
                });
                tempEnd.x = 150 + (720 * 4 + 5 * 60) * interactionFactor;
                tempPathObj.path = tempPathObj.path + ' L' + tempEnd.x + ' ' + tempOrg.y;
                tempPathObj.points.push({x: tempEnd.x, y: tempOrg.y});
                $rootScope.storyLineDrawData[playerName] = tempPathObj;
            }

            $rootScope.quarterOriginDrawData = $rootScope.quarterDrawData;
            $rootScope.minuteOriginDrawData = $rootScope.minuteDrawData;
            $rootScope.playOriginDrawData = $rootScope.playDrawData;
            $rootScope.storyLineOriginDrawData = $rootScope.storyLineDrawData;

            $rootScope.data.selectedIndex = 0;


        };
        $scope.interactionCountCalculation = function () {
            let tempInteractionCountArray = [];
            for (let playerName in $rootScope.playerInfo) {
                tempInteractionCountArray = [];
                for (let relatedPlayerName in $rootScope.playerInfo) {
                    if (relatedPlayerName !== playerName) {
                        tempInteractionCountArray[relatedPlayerName] = 0;
                    }
                }
                $rootScope.storyLineInteractionCount[playerName] = tempInteractionCountArray;
                $scope.playerCount++;
            }
            for (let playerName in $rootScope.playerInfo) {
                angular.forEach($rootScope.storyLineData[playerName], function (eventId) {
                    if ($rootScope.eventData[eventId]['event_type'] === 1 && $rootScope.eventData[eventId]['players'][1]['id'] != null) {
                        let playerName_fir = $rootScope.eventData[eventId]['players'][0]['name'];
                        let playerName_sec = $rootScope.eventData[eventId]['players'][1]['name'];

                        tempInteractionCountArray = [];
                        tempInteractionCountArray = $rootScope.storyLineInteractionCount[playerName_fir];
                        tempInteractionCountArray[playerName_sec]++;
                        $rootScope.storyLineInteractionCount[playerName_fir] = tempInteractionCountArray;

                        tempInteractionCountArray = [];
                        tempInteractionCountArray = $rootScope.storyLineInteractionCount[playerName_sec];
                        tempInteractionCountArray[playerName_fir]++;
                        $rootScope.storyLineInteractionCount[playerName_sec] = tempInteractionCountArray;
                    } else if ($rootScope.eventData[eventId]['event_type'] === 2 && $rootScope.eventData[eventId]['players'][2]['id'] != null) {
                        // tempInteractionCountArray = [];
                        // tempInteractionCountArray = $rootScope.storyLineInteractionCount[playerName];
                        // tempInteractionCountArray[$rootScope.eventData[eventId].blockPlayerName] ++;
                        // $rootScope.storyLineInteractionCount[playerName] = tempInteractionCountArray;

                        // tempInteractionCountArray = [];
                        // tempInteractionCountArray = $rootScope.storyLineInteractionCount[$rootScope.eventData[eventId].blockPlayerName];
                        // tempInteractionCountArray[playerName] ++;
                        // $rootScope.storyLineInteractionCount[$rootScope.eventData[eventId].blockPlayerName] = tempInteractionCountArray;
                    } else if ($rootScope.eventData[eventId].hasOwnProperty('stealPlayerName')) {
                        // tempInteractionCountArray = [];
                        // tempInteractionCountArray = $rootScope.storyLineInteractionCount[playerName];
                        // tempInteractionCountArray[$rootScope.eventData[eventId].stealPlayerName] ++;
                        // $rootScope.storyLineInteractionCount[playerName] = tempInteractionCountArray;

                        // tempInteractionCountArray = [];
                        // tempInteractionCountArray = $rootScope.storyLineInteractionCount[$rootScope.eventData[eventId].stealPlayerName];
                        // tempInteractionCountArray[playerName] ++;
                        // $rootScope.storyLineInteractionCount[$rootScope.eventData[eventId].stealPlayerName] = tempInteractionCountArray;
                    } else if ($rootScope.eventData[eventId].hasOwnProperty('fouledPlayerName')) {
                    } else if ($rootScope.eventData[eventId].hasOwnProperty('replacedPlayerName')) {
                    }
                });
            }


            let sumInteractionCount = [];
            let sumInteractionCountSorted;
            let tempPositionCrossCount = [];
            let tempPositionPlayerList = [];

            $rootScope.sortedList = [];

            for (let playerName in $rootScope.playerInfo) {
                tempInteractionCountArray = $rootScope.storyLineInteractionCount[playerName];
                sumInteractionCount[playerName] = 0;
                for (let relatedPlayerName in $rootScope.playerInfo) {
                    if (relatedPlayerName !== playerName) {
                        sumInteractionCount[playerName] += tempInteractionCountArray[relatedPlayerName];
                    }
                }

            }
            sumInteractionCountSorted = Object.keys(sumInteractionCount).sort(function (a, b) {
                return sumInteractionCount[b] - sumInteractionCount[a]
            });

            for (let playerName in sumInteractionCountSorted) {
                $rootScope.sortedList.push(sumInteractionCountSorted[playerName]);

                for (let tempPositionIndex = 0; tempPositionIndex < $rootScope.sortedList.length; tempPositionIndex++) {
                    tempPositionCrossCount[tempPositionIndex] = 0;
                }
                for (let position = 0; position < $rootScope.sortedList.length; position++) {
                    tempPositionPlayerList = $rootScope.sortedList.slice(0);
                    tempPositionPlayerList.splice(position, 0, sumInteractionCountSorted[playerName]);
                    tempPositionPlayerList.pop();
                    tempPositionCrossCount[position] = $scope.calculateCross(tempPositionPlayerList);
                }
                let bestCost, bestPosition;
                for (let tempPosition = 0; tempPosition < $rootScope.sortedList.length; tempPosition++) {
                    if (tempPosition === 0) {
                        bestCost = tempPositionCrossCount[tempPosition];
                        bestPosition = tempPosition;
                    } else {
                        if (tempPositionCrossCount[tempPosition] < bestCost) {
                            bestCost = tempPositionCrossCount[tempPosition];
                            bestPosition = tempPosition;
                        }
                    }
                }
                if (bestPosition != $rootScope.sortedList.length - 1) {
                    $rootScope.sortedList.splice(bestPosition, 0, $rootScope.sortedList[$rootScope.sortedList.length - 1]);
                    $rootScope.sortedList.pop();
                }
            }

            let tempAwaySortedY = $scope.halfHeightY - $rootScope.factor.y * 35,
                tempHomeSortedY = $scope.halfHeightY + $rootScope.factor.y * 5;
            $rootScope.sortedList.forEach(function (play) {
                if ($rootScope.playerInfo[play]['team'] === $scope.game['homeId']) {
                    $rootScope.sortedY[play] = tempHomeSortedY;
                    tempHomeSortedY += $rootScope.factor.y * 3;
                }
                if ($rootScope.playerInfo[play]['team'] === $scope.game['awayId']) {
                    $rootScope.sortedY[play] = tempAwaySortedY;
                    tempAwaySortedY += $rootScope.factor.y * 3;
                }
            });
        };
        $scope.calculateCross = function (tempPositionList) {
            let totalCross = 0;
            for (let playerIndex = 0; playerIndex < tempPositionList.length; playerIndex++) {
                let tempPlayerInteractionCountArray = $rootScope.storyLineInteractionCount[tempPositionList[playerIndex]];
                for (let relatedPlayerIndex = playerIndex; relatedPlayerIndex < tempPositionList.length; relatedPlayerIndex++) {
                    if (playerIndex !== relatedPlayerIndex && Math.abs(playerIndex - relatedPlayerIndex) > 1) {
                        totalCross += tempPlayerInteractionCountArray[tempPositionList[relatedPlayerIndex]] * (Math.abs(playerIndex - relatedPlayerIndex) - 1);
                    }
                }
            }
            return totalCross;
        };

        angular.element($window).bind('resize', function () {
            $scope.initializeWindowSize();
            $scope.generateDrawData();
            $scope.$apply();
        });

        $scope.$watch('factor.x', function () {
            $scope.generateDrawData();
        });
        $scope.$watch('aggregate.unit', function () {
        });
        $scope.$watch('aggregate.value', function () {
        });
        $scope.$watch('aggregate.threshold', function () {
        });

        return $scope.init();
    }]);
app.directive('scoreboard',  ['$rootScope',function ($rootScope) {
    return {
        restrict: 'E',
        link: function ($scope, $element) {
            console.log('index :' + $rootScope.data.selectedIndex);
            $scope.init();
            let seb = d3.select('scoreboard');
            let ctn = seb.append('div').attr('class', 'visual-graph-container');
            let svg = ctn.append('svg').attr('class', 'visual-graph');

            let gameLogo = svg.append('g').attr('class', 'gameLogo');
            let quarters = svg.append('g').attr('class', 'quarters');
            let minutes  = svg.append('g').attr('class', 'minutes');
            let plays    = svg.append('g').attr('class', 'plays');

            let tooltip  = d3.tip().attr('class', 'd3-tip');

            let lineFunction = d3.line().x(d => d.x).y(d => d.y);
            svg.call(tooltip);

            update($rootScope.data.selectedIndex + 3);

            function update(index) {
                initialization(seb);
                initialization(ctn);
                svg.style('width', $scope.contextWidth + 'px');
                svg.style('height', $scope.windowHeight + 'px');
                updateLogo($scope.Icon);
                updateQuarters($rootScope.quarterDrawData);
                updateMinutes($rootScope.minuteDrawData);
                updatePlays($rootScope.playDrawData);
                $rootScope.scoreLevel.degree = 0;
            }
            function initialization(tabpanel) {
                tabpanel.style('width', $scope.windowWidth + 'px');
                tabpanel.style('height', $scope.windowHeight + 'px');
            }
            function updateLogo(iconData) {
                let homeIcon = gameLogo.append('image').attr('class', 'homeIcon');
                let awayIcon = gameLogo.append('image').attr('class', 'awayIcon');
                homeIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['homeName'] + '.svg');
                homeIcon.attr('width', '75').attr('x', iconData.home.x).attr('y', iconData.home.y);
                awayIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['awayName'] + '.svg');
                awayIcon.attr('width', '75').attr('x', iconData.away.x).attr('y', iconData.away.y);
            }
            function updateQuarters(quarterData) {
                quarters.selectAll('g.quarter').data(quarterData)
                    .join('g').attr('class', 'quarter')
                    .each(function () {
                        let item = d3.select(this);
                        item.attr('id', function (d, i) {
                            return i;
                        });
                        item.attr('opacity', d => $rootScope.quarterSelected && !d.home.isSelected ? 0.1 : 1.0);
                        let quarterH = item.append('polygon').attr('class', 'quarterH');
                        let quarterA = item.append('polygon').attr('class', 'quarterA');
                        quarterH.attr('points', function (d) {
                            let points = [];
                            points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                            points.push([d.home.upLeft.x, d.home.upLeft.y]);
                            points.push([d.home.upRight.x, d.home.upRight.y]);
                            points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                            return polygonPoints(points);
                        });
                        quarterA.attr('points', function (d) {
                            let points = [];
                            points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                            points.push([d.away.upLeft.x, d.away.upLeft.y]);
                            points.push([d.away.upRight.x, d.away.upRight.y]);
                            points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                            return polygonPoints(points);
                        });
                        quarterH.attr('fill', $scope.teamColor.home);
                        quarterA.attr('fill', $scope.teamColor.away);
                        let CompareLineS = item.append('path').attr('class', 'CompareLineS');
                        CompareLineS.attr('d', d => lineFunction([d.compareLine.startLine.start, d.compareLine.startLine.end]));
                        CompareLineS.attr('stroke', d => d.compareLine.startLine.color);
                        CompareLineS.attr('stroke-width', d => d.compareLine.startLine.width);
                        let CompareLineE = item.append('path').attr('class', 'CompareLineE');
                        CompareLineE.attr('d', d => lineFunction([d.compareLine.endLine.start, d.compareLine.endLine.end]));
                        CompareLineE.attr('stroke', d => d.compareLine.endLine.color);
                        CompareLineE.attr('stroke-width', d => d.compareLine.endLine.width);
                        item.on('click', function () {
                            if($rootScope.scoreLevel.degree != 0) return;
                            if (!$rootScope.quarterSelected) {
                                quarters.selectAll('g.quarter').attr('opacity', 0.1);
                                $rootScope.quarterSelected = true;
                            }
                            item.attr('opacity', function (d) {
                                d.home.isSelected = !d.home.isSelected;
                                d.away.isSelected = !d.away.isSelected;
                                return $rootScope.quarterSelected && !d.home.isSelected ? 0.1 : 1.0;
                            });
                        });
                    });
            }
            function updateMinutes(minuteData) {
                minutes.selectAll('g.minute').data(minuteData)
                    .join('g').attr('class', 'minute').each(function () {
                    let item = d3.select(this);
                    item.attr('id', function (d, i) {
                        return i;
                    });
                    item.attr('opacity', d => $rootScope.minuteSelected && !d.home.isSelected ? 0.1 : 1.0);
                    let minuteH = item.append('polygon').attr('class', 'minuteH');
                    let minuteA = item.append('polygon').attr('class', 'minuteA');
                    minuteH.attr('points', function (d) {
                        let points = [];
                        points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                        points.push([d.home.upLeft.x, d.home.upLeft.y]);
                        points.push([d.home.upRight.x, d.home.upRight.y]);
                        points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                        return polygonPoints(points);
                    });
                    minuteA.attr('points', function (d) {
                        let points = [];
                        points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                        points.push([d.away.upLeft.x, d.away.upLeft.y]);
                        points.push([d.away.upRight.x, d.away.upRight.y]);
                        points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                        return polygonPoints(points);
                    });
                    minuteH.attr('fill', d => d.home.background);
                    minuteA.attr('fill', d => d.away.background);
                    let CompareLineS = item.append('path').attr('class', 'CompareLineS');
                    CompareLineS.attr('d', d => lineFunction([d.compareLine.startLine.start, d.compareLine.startLine.end]));
                    CompareLineS.attr('stroke', d => d.compareLine.startLine.color);
                    CompareLineS.attr('stroke-width', d => d.compareLine.startLine.width);
                    let CompareLineE = item.append('path').attr('class', 'CompareLineE');
                    CompareLineE.attr('d', d => lineFunction([d.compareLine.endLine.start, d.compareLine.endLine.end]));
                    CompareLineE.attr('stroke', d => d.compareLine.endLine.color);
                    CompareLineE.attr('stroke-width', d => d.compareLine.endLine.width);
                    item.on('click', function () {
                        if (!$rootScope.minuteSelected) {
                            quarters.selectAll('g.quarter').attr('opacity', 0.1);
                            minutes.selectAll('g.minute').attr('opacity', 0.1);
                            $rootScope.minuteSelected = true;
                        }
                        item.attr('opacity', function (d) {
                            d.home.isSelected = !d.home.isSelected;
                            d.away.isSelected = !d.away.isSelected;
                            return $rootScope.minuteSelected && !d.home.isSelected ? 0.1 : 1.0;
                        });
                    });
                });

            }
            function updatePlays(playData) {
                let eventsData = [];
                playData.forEach(function (d) {
                    d.home.forEach(function (p) {
                        eventsData.push(p);
                    });
                    d.away.forEach(function (p) {
                        eventsData.push(p);
                    })
                });
                plays.selectAll('.play').data(eventsData)
                    .join('circle').attr('class', 'play')
                    .attr('id', function (d, i) {
                        return i;
                    })
                    .attr('cx', d => d.center.x)
                    .attr('cy', d => d.center.y)
                    .attr('r', d => d.radius)
                    .attr('fill', d => d.background)
                    .on('mouseover', function (d) {
                        let tempEvent = $rootScope.eventData[d.eventId];
                        let background = $scope.predictSide(tempEvent['players'][0]['team']).color;
                        let eventPlayerImg = 'https://china.nba.com/media/img/players/head/260x190/' + tempEvent['players'][0].id;
                        let eventTime = tempEvent.time;
                        let eventPlayer = tempEvent['players'][0].name;
                        let eventType = tempEvent['event_type'];
                        let eventPoint = tempEvent['home_point'] > tempEvent['away_point'] ? tempEvent['home_point'] : tempEvent['away_point'];
                        tooltip.html("<table id = 'd3tooltip'><tr><td><img class ='playerPhoto'  " +
                            "style = 'background: " + background + "' " +
                            "src = '" + eventPlayerImg + ".png" + "'>" +
                            "</td></tr>" +
                            "<tr class = 'tipLable'><td>" + eventTime + "</td></tr>" +
                            "<tr class = 'tipLable'><td>" + eventPlayer + "</td></tr>" +
                            "</table>");
                        tooltip.show();
                    })
                    .on('mouseout', function () {
                        tooltip.hide();
                    });
            }
            function polygonPoints(points) {
                let result = "";
                points.forEach(function (d) {
                    result = result + d[0].toString() + "," + d[1].toString() + " ";
                })
                return result;
            }
            console.log($rootScope.data.selectedIndex);

            function resetView(svg){
                svg.selectAll('g.quarter').attr('opacity', 1.0);
                svg.selectAll('g.minute').attr('opacity', 1.0);
                $rootScope.quarterSelected = false;
                $rootScope.minuteSelected  = false;
                $rootScope.quarterDrawData.forEach(function (quarter){
                    quarter.home.isSelected = false;
                    quarter.away.isSelected = false;
                })
                $rootScope.minuteDrawData.forEach(function (minute){
                    minute.home.isSelected = false;
                    minute.away.isSelected = false;
                })
            }

            let zoomRate = 0.08;
            let theSvgElement;
            let currentX = 0, currentY = 0;

            $rootScope.matrix = [1, 0, 0, 1, 0, 0];
            theSvgElement = $element.find('#gameSVG');
            theSvgElement.children('g').attr('transform', 'matrix(' + $rootScope.matrix.join(' ') + ')');

            $scope.$watch('scoreLevel.degree', function (newVal, oldVal) {
                resetView(svg);
                switch (newVal) {
                    case  0 :
                        quarters.attr('visibility', 'visible');
                        minutes.attr('visibility', 'hidden');
                        plays.attr('visibility', 'hidden');
                        break;
                    case  1 :
                        quarters.attr('visibility', 'visible');
                        minutes.attr('visibility', 'visible');
                        plays.attr('visibility', 'hidden');
                        break;
                    case  2 :
                        quarters.attr('visibility', 'visible'),
                            minutes.attr('visibility', 'visible'),
                            plays.attr('visibility', 'visible');
                        break;
                }
            });
        }
    }
}]);
app.directive('streamgraph', ['$rootScope',function ($rootScope) {
    return {
        restrict: 'E',
        link: function ($scope) {
            let streamGraph = d3.select('streamgraph').append('div').attr('class', 'visual-graph-container');

            let svg1 = streamGraph.append('svg').attr('class', 'visual-graph');
            let svg2 = streamGraph.append('svg').attr('class', 'visual-graph');
            let svg3 = streamGraph.append('svg').attr('class', 'visual-graph');

            let SteamS = svg1.append('g').attr('class', 'steamS');
            let SteamP = svg2.append('g').attr('class', 'steamP');
            let SteamT = svg3.append('g').attr('class', 'steamT');

            initialization(streamGraph);
            configSvg(svg1, $scope.windowWidth * 5, 120);
            configSvg(svg2, $scope.windowWidth * 5, 120);
            configSvg(svg3, $scope.windowWidth * 5, 120);

            configSteam(SteamS, $rootScope.eventGapsce, 'Score Gap');
            configSteam(SteamP, $rootScope.eventTurnin, 'Turning Points');
            configSteam(SteamT, $rootScope.eventEffect, 'Real-time Efficiency');

            function configSteam(object, data, info) {
                object.attr('transform', function () {
                    let x = 10 + 150;
                    let y = 60;
                    return 'translate(' + [x, y] + ')';
                });
                object.append('path').attr('class', 'areaH');
                object.append('path').attr('class', 'areaA');
                object.append('path').attr('class', 'baseL');

                let gameLogo = object.append('g').attr('class', 'gameLogo');
                let homeIcon = gameLogo.append('image').attr('class', 'homeIcon');
                let awayIcon = gameLogo.append('image').attr('class', 'awayIcon');
                let TextInfo = gameLogo.append('text').attr('class', 'TextInfo');

                homeIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['homeName'] + '.svg');
                homeIcon.attr('width', '30').attr('x', 0).attr('y', 24);
                awayIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['awayName'] + '.svg');
                awayIcon.attr('width', '30').attr('x', 0).attr('y', -24);
                homeIcon.attr('transform', function () {
                    let width = parseFloat(homeIcon.style('width'));
                    let height = parseFloat(homeIcon.style('height'));
                    let x = -30 - width;
                    let y = -0.5 * height;
                    return 'translate(' + [x, y] + ')';
                });
                awayIcon.attr('transform', function () {
                    let width = parseFloat(awayIcon.style('width'));
                    let height = parseFloat(awayIcon.style('height'));
                    let x = -30 - width;
                    let y = -0.5 * height;
                    return 'translate(' + [x, y] + ')';
                });
                TextInfo.text(info);
                TextInfo.attr('text-anchor', 'head');
                TextInfo.attr('font-family', 'Arial');
                TextInfo.attr('transform', function () {
                    let x = -150;
                    let y = -45;
                    return 'translate(' + [x, y] + ')';
                });

                let area = d3.area()
                    .x(d => d['x'])
                    .y0(d => d['y0'])
                    .y1(d => d['y1'])
                    .curve(d3.curveStep); // [ "linear","bundle", "basis", "step", "cardinal"]


                let home = object.select('path.areaH')
                    .attr('d', area(data.home))
                    .attr('fill', $scope.teamColor.home);

                let away = object.select('path.areaA')
                    .attr('d', area(data.away))
                    .attr('fill', $scope.teamColor.away);
                let base = object.select('path.baseL')
                    .attr('d', function () {
                        return 'M0,' + 0 + 'L' + ($scope.windowWidth - 170) + ',' + 0;
                    })
                    .attr('stroke-width', 2)
                    .attr('stroke', '#a5a5a5')
                    .attr('stroke-dasharray', '1,4');

            }
            function initialization(tabpanel) {
                tabpanel.style('width', $scope.windowWidth + 'px');
                tabpanel.style('height', $scope.windowHeight + 'px');
            }
            function configSvg(object, width, height) {
                object.attr('transform', function () {
                    let x = 10;
                    let y = 0;
                    return 'translate(' + [x, y] + ')';
                });
                object.attr('width', width);
                object.attr('height', height);
            }
        }
    }
}]);
app.directive('forcegraph',  ['$rootScope',function ($rootScope) {
    return {
        restrict: 'E',
        link: function ($scope) {
            let scenes = $rootScope.storyLine2.scenes;
            let scenesDate = scenes;
            let characters = $rootScope.storyLine2.characters;
            let forcegraph = d3.select('forcegraph');
            let Forces = forcegraph.append('svg');
            configForce(Forces, scenesDate, characters);
            function configForce(object, scenes, characters) {
                let forceDirect = object.attr('width', $scope.windowWidth).attr('height', $scope.windowHeight);
                let scenesF = scenes.filter(d => d.characters.length > 1);
                let charactersF = characters;
                let nodes = charactersF.map(function (d, i) {
                    return i;
                });
                let edges = getEdges(charactersF, scenesF);
                let matrix = getMatrix(nodes, edges);
                let forceNodes = characters.map(function (d) {
                    return {'id': d.id, 'name': d.name, 'group': d.affiliation, 'color': d.color};
                });
                let forceLinks = edges.map(function (d) {
                    return {"source": d.source, "target": d.target, "value": d.weight};
                });

                forceDirect.selectAll("g").remove();

                let interactions = forceDirect.append("g").attr("class", "interactions");
                let texts = forceDirect.append("g").attr("class", "texts")
                let players = forceDirect.append("g").attr("class", "players")


                let interaction = interactions.selectAll(".interaction").data(forceLinks)
                    .join("line")
                    .attr("class", "interaction")
                    .attr("source", d => characters[d.source].id)
                    .attr("target", d => characters[d.target].id)
                    .attr("stroke", '#000')
                    .attr("stroke-width", 0.5);


                let player = players.selectAll("circle.player").data(forceNodes)
                    .join('circle')
                    .attr("class", "player")
                    .attr("id", d => d.id)
                    .attr("r", 8)
                    .style("fill", d => d.color)
                    .on("mouseover", function () {
                        d3.select(this).transition()
                            .duration(75)
                            .attr("r", 10);
                    })
                    .on("mouseout", function () {
                        d3.select(this).transition()
                            .duration(75)
                            .attr("r", 8);
                    });

                let text = texts.selectAll("text.player").data(forceNodes)
                    .join('text')
                    .attr("class", "player")
                    .attr("id", d => d.id)
                    .attr('dx', 8)
                    .attr('dy', -8)
                    .text(d => d.name);
                let force = d3.forceSimulation(forceNodes)
                    .force('link', d3.forceLink(forceLinks).strength(0.01))
                    .force('charge', d3.forceManyBody(-50000))
                    .force('center', d3.forceCenter(650, 300))
                    .on("tick", function () {
                        interaction.attr("x1", d => d.source.x);
                        interaction.attr("y1", d => d.source.y);
                        interaction.attr("x2", d => d.target.x);
                        interaction.attr("y2", d => d.target.y);
                        player.attr('cx', d => d.x);
                        player.attr('cy', d => d.y);
                        text.attr('x', d => d.x);
                        text.attr('y', d => d.y);
                    });

                let drag = function (force) {
                    function start(d) {
                        if (!d3.event.active) force.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    }

                    function drag(d) {
                        d.fx = d3.event.x;
                        d.fy = d3.event.y;
                    }

                    function end(d) {
                        if (!d3.event.active) force.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    }

                    return d3.drag()
                        .on('start', start)
                        .on('drag', drag)
                        .on('end', end);
                };
                player.call(drag(force));

                function getEdges(characters, scenes) {
                    let edges = [];
                    scenes.forEach(function (scene) {
                        edges = edges.concat(sceneEdges(scene.characters, characters));
                    });

                    function sceneEdges(sceneCharacters, totalCharacters) {
                        let i, j, matrix;
                        matrix = [];
                        if (sceneCharacters.length < 2) return matrix;
                        for (i = sceneCharacters.length; i--;) {
                            for (j = i; j--;) {
                                let a = totalCharacters.indexOf(sceneCharacters[i]);
                                let b = totalCharacters.indexOf(sceneCharacters[j]);
                                if (a !== -1 && b !== -1 && a !== b) matrix.push([a, b]);
                            }
                        }
                        return matrix;
                    }

                    edges = edges.reduce(function (result, edge) {
                        let resultEdge;
                        resultEdge = result.filter(function (resultEdge) {
                            edge.sort(function (a, b) {
                                return a - b;
                            });
                            return resultEdge.source === edge[0] && resultEdge.target === edge[1];
                        })[0] || {source: edge[0], target: edge[1], weight: 0};
                        resultEdge.weight++;
                        if (resultEdge.weight === 1) {
                            result.push(resultEdge);
                        }
                        return result;
                    }, []);
                    return edges;
                }

                function getMatrix(nodes, edges) {
                    let sceneMatrix = [];
                    for (let i = 0; i < nodes.length; i++) {
                        sceneMatrix[i] = [];
                        for (let j = 0; j < nodes.length; j++) {
                            sceneMatrix[i][j] = 0.0;
                        }
                    }
                    edges.forEach(function (d) {
                        sceneMatrix[d.source][d.target] = d.weight;
                        sceneMatrix[d.target][d.source] = d.weight;
                    });
                    return sceneMatrix
                }
            }
        }
    }
}]);
app.directive('storyLine',   ['$rootScope',function ($rootScope) {
    return {
        restrict: 'E',  // Element name: <my-directive></my-directive>
        link: function ($scope, $element) {
            console.log($rootScope.data.selectedIndex);

            let areaFunction = d3.area()
                .x(d => d.x)
                .y0(d => d.y0)
                .y1(d => d.y1)
                .curve(d3.curveMonotoneX);

            let svg = d3.select('story-line')
                .append('svg')
                .attr('id', 'gameSVG')
                .attr('width', $scope.windowWidth)
                .attr('height', $scope.windowHeight)

            let storyLEntity = svg.append('g')
                .attr('id', 'storyLEntity')
                .attr('ng-if', 'data.selectedIndex === 5');

            let playerNames = storyLEntity.append('g')
                .attr('id', 'playerName')
                .selectAll('text')
                .data($rootScope.storyLine.ps)
                .join('text')
                .attr('x', '0')
                .attr('y', d => $rootScope.storyLine.pre[d].startY)
                .text(d => $rootScope.storyLine.pre[d].name)
                .style('font-family', 'Arial')
                .style('fill', d => $rootScope.storyLine.pre[d].color);


            let paths = svg.append('g')
                .attr('id', 'storyLine')
                .selectAll('g')
                .data($rootScope.storyLine.ps)
                .join('g')
                .attr('id', d => d)
                .append('path')
                .attr('d', d => areaFunction($rootScope.storyLine.draw[d]))
                .attr('fill', d => d3.rgb($rootScope.storyLine.pre[d].color));
            // .attr('stroke', function (d) {
            //     return d3.rgb($rootScope.storyLine.pre[d].color);
            // })
            // .attr('stroke-width', function (d) {
            //     return 2;
            // })
            // .attr('stroke-linecap', 'round')

            let zoomRate = 0.1;
            let theSvgElement;
            let currentX = 0, currentY = 0;


            angular.element($element).attr('draggable', 'true');
            $element.bind('dragstart', function (e) {
                // if(e.shiftKey){
                currentX = e.originalEvent.clientX;
                currentY = e.originalEvent.clientY;
                // }
            });
            $element.bind('dragover', function (e) {
                // if(e.shiftKey){
                if (e.preventDefault) {
                    e.preventDefault();
                }

                $rootScope.matrix[4] += e.originalEvent.clientX - currentX;
                $rootScope.matrix[5] += e.originalEvent.clientY - currentY;

                theSvgElement.children('g').attr('transform', 'matrix(' + $rootScope.matrix.join(' ') + ')');
                currentX = e.originalEvent.clientX;
                currentY = e.originalEvent.clientY;
                return false;
                // }
            });
            $element.bind('drop', function (e) {
                // if(e.shiftKey){
                if (e.stopPropogation) {
                    e.stopPropogation(); // Necessary. Allows us to drop.
                }
                return false;
                // }
            });
            $element.bind('mousewheel', function (mouseWheelEvent) {
                let zoomCenter = {
                    'x': mouseWheelEvent.originalEvent.clientX,
                    'y': mouseWheelEvent.originalEvent.clientY
                };
                if (mouseWheelEvent.originalEvent.wheelDelta > 0) {
                    zoom('zoomIn', zoomCenter);
                } else {
                    zoom('zoomOut', zoomCenter);
                }
                mouseWheelEvent.cancelBubble = true;
                return false;
            });

            function zoom(zoomType, zoomCenter) {
                $rootScope.matrix[0] = parseFloat($rootScope.matrix[0]);	//scale-x
                $rootScope.matrix[3] = parseFloat($rootScope.matrix[3]);	//scale-y

                if (zoomType === 'zoomIn') {
                    if ($rootScope.matrix[0] + zoomRate > 0.1 && $rootScope.matrix[3] + zoomRate > 0.1) {
                        $rootScope.matrix[0] += zoomRate;
                        $rootScope.matrix[3] += zoomRate;
                        $rootScope.matrix[4] -= (zoomCenter.x * zoomRate);
                        $rootScope.matrix[5] -= (zoomCenter.y * zoomRate);
                    }
                } else if (zoomType === 'zoomOut') {
                    if ($rootScope.matrix[0] - zoomRate > 0.1 && $rootScope.matrix[3] - zoomRate > 0.1) {
                        $rootScope.matrix[0] -= zoomRate;
                        $rootScope.matrix[3] -= zoomRate;
                        $rootScope.matrix[4] += (zoomCenter.x * zoomRate);
                        $rootScope.matrix[5] += (zoomCenter.y * zoomRate);
                    }
                }
                theSvgElement.children('g').attr('transform', 'matrix(' + $rootScope.matrix.join(' ') + ')');
            }

            function svgInitialize() {
                theSvgElement = $element.find('#gameSVG');
                theSvgElement.children('g').attr('transform', 'matrix(' + $rootScope.matrix.join(' ') + ')');
            }

            svgInitialize();

        }
    };
}]);
app.directive('storyLine2',  ['$rootScope',function ($rootScope) {
    return {
        restrict: 'E',
        link: function ($scope) {
            console.log($rootScope.data.selectedIndex);

            let scenes = $rootScope.storyLine2.scenes;
            let scenesDate = scenes;
            let characters = $rootScope.storyLine2.characters;

            let totalQuarter = scenes[scenes.length - 1].quarter + 1;

            let selectType = 0;
            let selectSort = 0;
            let selectThresh = 1.0;
            let selectQuart = 0;

            let storyLine = d3.select('story-line2');
            let selectCon = storyLine.append('div').attr('class', 'container').style('float', 'left');
            let narrativeChart = storyLine.append('div').attr('class', 'visual-graph-container');
            let svg0 = narrativeChart.append('svg').attr('class', 'visual-graph');

            let Links = svg0.append('g').attr('class', 'links');
            let Scenes = svg0.append('g').attr('class', 'scenes');
            let Intros = svg0.append('g').attr('class', 'intros');

            initialization(storyLine);
            initialization(narrativeChart);
            configSelectCon(selectCon);

            update(scenesDate, characters, selectType, selectQuart);

            let tooltip = d3.tip().attr('class', 'd3-tip');
            svg0.call(tooltip);


            function initialization(tabpanel) {
                tabpanel.style('width', $scope.windowWidth + 'px');
                tabpanel.style('height', $scope.windowHeight + 'px');
            }

            function update(scenes, characters, sort, selectQuart = 0) {
                let Canvas = {width: $scope.windowWidth * 5, height: $scope.height};
                let narrative = narrativeLines();
                narrative.scenes(scenes);
                narrative.characters(characters);
                narrative.size([Canvas.width, Canvas.height]);
                narrative.range(selectQuart === 0 ? [0, totalQuarter] : [selectQuart - 1, selectQuart]);
                narrative.pathSpace(20);
                narrative.groupMargin(60);
                narrative.labelSize([160, 15]);
                narrative.scenePadding([0, 5, 0, 5]);
                narrative.labelPosition('left');
                narrative.sortType(sort);
                narrative.layout();
                //configVideo(video);
                configSvg(svg0, narrative, 0, 0);
                updateLinks(narrative);
                updateScenes(narrative);
                updateNodes(narrative);
            }

            function updateLinks(narrative) {
                Links.selectAll('g.character')
                    .data(narrative.links())
                    .join('g')
                    .attr('class', 'character')
                    .attr('id', d => d.id)
                    .each(function () {
                        d3.select(this)
                            .selectAll('path')
                            .data(d => d.links)
                            .join('path')
                            .attr('d', narrative.link())
                            .attr('stroke', d => d.character.color)
                            .attr('stroke-dasharray', d => d.target.scene.status[d.character.id] ? '' : '1,4')
                            .attr('stroke-width', 2)
                            .attr('fill', 'none')
                            .on('mouseover', d => highlightCY(d))
                            .on('mouseout', highlightCN);
                    });
            }

            function updateScenes(narrative) {
                Scenes.selectAll('g.scene')
                    .data(narrative.scenes())
                    .join('g')
                    .attr('class', 'scene')
                    .attr('id', d => d.id)
                    .attr('transform', function (d) {
                        let x, y;
                        x = Math.round(d.x) + 0.5;
                        y = Math.round(d.y) + 0.5;
                        return 'translate(' + [x, y] + ')';
                    })
                    .each(function () {
                        d3.select(this)
                            .selectAll('rect.sceneR')
                            .data(d => [d])
                            .join('rect')
                            .attr('class', 'sceneR')
                            .on('mouseover', function (d) {
                                svg0.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                                svg0.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                                svg0.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);
                                d.characters.forEach(function (c) {
                                    svg0.select('g.links').selectAll('[id = \'' + c.id + '\']').attr('opacity', 1.0);
                                    svg0.select('g.intros').selectAll('[id = \'' + c.id + '\']').attr('opacity', 1.0);
                                    c.appearances.forEach(function (e) {
                                        let id = e.scene.id;
                                        svg0.select('g.scenes').selectAll('[id =\'' + id + '\']').attr('opacity', 1.0);
                                    });

                                });
                                tooltip.offset([-10, 150]);
                                let toolTipContent = "<table width='300px'>";
                                for (let i = 0; i < d.characters.length; i++) {
                                    toolTipContent +=
                                        "<tr>" +
                                        "<td>" + playerImg(d.characters[i]) + "</td>" +
                                        "<td style='alignment: left'>" +
                                        "<label class ='playerName' >" + d.appearances[i].des + "</label>" +
                                        "</td>" +
                                        "</tr>";
                                }
                                toolTipContent += "</table>";
                                tooltip.html("<div style='background: #dddddd' >" + toolTipContent + "</div>");
                                tooltip.show();
                            })
                            .on('mouseout', function () {
                                svg0.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
                                svg0.select('g.links').selectAll('g.character').attr('opacity', 1.0);
                                svg0.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                                tooltip.hide();
                            })
                            .attr('opacity', 0)
                            .attr('width', d => d.width)
                            .attr('height', d => d.height)
                            .attr('rx', 5)
                            .attr('ry', 5)
                            .attr('stroke', '#000')
                            .attr('opacity', d => d.appearances.length === 1 ? 0 : 1)
                            .attr('fill', '#ffffff');
                    })
                    .each(function () {
                        d3.select(this)
                            .selectAll('circle.appearance')
                            .data(d => d.appearances)
                            .join('circle')
                            .attr('class', 'appearance')
                            .attr('cx', c => c.x)
                            .attr('cy', c => c.y)
                            .attr('r', c => c.scene.type === 13 ? 4 : 2)
                            .attr('fill', c => c.scene.type === 13 ? '#a5a5a5' : c.character.color)
                            .attr('stroke', c => c.character.color);
                    });
            }

            function updateNodes(narrative) {
                Intros.selectAll('g.intro')
                    .data(narrative.introductions())
                    .join('g')
                    .attr('class', 'intro')
                    .attr('id', d => d.character.id)
                    .attr('transform', function (d) {
                        let x, y;
                        x = Math.round(d.x);
                        y = Math.round(d.y);
                        return 'translate(' + [x, y] + ')';
                    })
                    .each(function () {
                        d3.select(this)
                            .selectAll('rect.introR')
                            .data(d => [d])
                            .join('rect')
                            .attr('class', 'introR')
                            .attr('x', -4)
                            .attr('y', -4.5)
                            .attr('width', 4)
                            .attr('height', 8)
                            .attr('fill', d => d.character.color);
                    })
                    .each(function () {
                        d3.select(this)
                            .selectAll('text.introT')
                            .data(d => [d])
                            .join('text')
                            .attr('class', 'introT')
                            .attr('text-anchor', 'end')
                            .attr('y', '4px')
                            .attr('x', '-8px')
                            .text(d => d.character.name)
                            .attr('font-family', 'Arial')
                            .attr('fill', d => d.character.color)
                            .on('mouseover', d => highlightCY(d))
                            .on('mouseout', highlightCN);
                    })
            }

            function configSelectCon(object) {

                let selectQuarterTx = object.append('label').attr('class', 'selectLabel');
                selectQuarterTx.text('Quarter : ');
                let selectorQuarter = object.append('select').attr('class', 'selectorQuarter').style('width', '150px');
                let QuarterData = [' All '];
                for (let i = 0; i <= scenes[scenes.length - 1].quarter; i++) {
                    QuarterData.push(' ' + (i + 1) + ' ');
                }
                let optionsQuarter = selectorQuarter.selectAll('option').data(QuarterData);
                optionsQuarter.join('option').text(d => d);
                selectorQuarter.on("change", function () {
                    selectQuart = selectorQuarter.property('selectedIndex');
                    scenesDate = sceneQuery(scenes, selectType, selectThresh, selectQuart);
                    update(scenesDate, characters, selectSort, selectQuart);
                });

                let selectTypeTx = object.append('label').attr('class', 'selectLabel');
                selectTypeTx.text('Event Type : ');
                let selectorType = object.append('select').attr('class', 'selectorType').style('width', '150px');
                let optionsData = [' All ', ' Shoot Made ', ' Shoot Miss ', ' Free Throw ', ' Rebound ', ' Turn Over ', ' Foul ', ' Violation ', ' Sub ', ' Regular ', ' Jump Ball ', ' Ejection '];
                let optionsType = selectorType.selectAll('option').data(optionsData);
                optionsType.join('option').text(d => d);
                selectorType.on("change", function () {
                    selectType = selectorType.property('selectedIndex');
                    scenesDate = sceneQuery(scenes, selectType, selectThresh, selectQuart);
                    update(scenesDate, characters, selectSort, selectQuart);
                });

                let selectSortTx = object.append('label').attr('class', 'selectLabel');
                selectSortTx.text('Sort Type : ');
                let selectorSort = object.append('select').attr('class', 'selectorSort').style('width', '150px');
                let SortData = [' R2eSort ', ' GreedSort ', ' None '];
                let optionsSort = selectorSort.selectAll('option').data(SortData);
                optionsSort.join('option').text(d => d);
                selectorSort.on("change", function () {
                    selectSort = selectorSort.property('selectedIndex');
                    update(scenesDate, characters, selectSort, selectQuart);
                });
                return object;
            }

            function configSvg(object, narrative, width, height) {
                object.attr('transform', function () {
                    let x = 10;
                    let y = 0;
                    return 'translate(' + [x, y] + ')';
                });
                object.attr('width', width === 0 ? narrative.extent()[0] + 30 : width);
                object.attr('height', height === 0 ? narrative.extent()[1] + 5 : height);
            }

            function sceneQuery(scenes, query, thresh, quarter = 0) {
                let dateSet = [];
                for (let i = 0; i < scenes.length; i++) {
                    if (scenes[i].timeOffset > Math.floor(scenes[scenes.length - 1]['timeOffset'] * thresh)) break;
                    if (quarter !== 0 && scenes[i].quarter !== quarter - 1) continue;
                    if (query == 0) {
                        dateSet.push(scenes[i]);
                    } else if (scenes[i].type == query) {
                        dateSet.push(scenes[i]);
                    } else if (scenes[i].type == 13) {
                        dateSet.push(scenes[i]);
                    }

                }
                return dateSet;
            }

            function configPlayerInfo(object) {
                let table = object.select('table').attr('class', 'playerInfo');
                table.selectAll('td').remove();
                table.style('background', '#FFF');
                let tableCol = table.append('td');
                let tableRow0 = tableCol.append('tr');
                let playerImage = tableRow0.append('img')
                    .attr('class', 'playerImg')
                    .style('width', '260px')
                    .style('height', '190px');

                let tableRow1 = tableCol.append('tr').attr('align', 'center');
                let playerName = tableRow1.append('label').attr('class', 'playerName');
            }

            function updatePlayerInfo(object, character) {
                let preUrl = 'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/';
                preUrl = 'https://china.nba.com/media/img/players/head/260x190/';
                let playerInfo = object.select('.playerInfo');
                let playerImage = object.select('.playerImg');
                let playerName = object.select('.playerName');
                playerInfo.style('background', '#b8b8bf');
                playerImage.style('background', character.color);
                playerImage.attr('src', preUrl + character.id + ".png");
                playerName.text(character.name);
            }

            function configVideo(object) {
                object.attr('src', 'http://smb.cdnak.neulion.com/nlds_vod/nba/vod/2016/11/14/21600145/2_21600145_orl_ind_2016_b_discrete_ind19_1_1600.mp4');
                object.attr('autoplay', 'autoplay');
                object.attr('controls', 'controls');
                object.style('padding-left', '120px');
            }

            function playerImg(character, width = 148) {

                let preUrl = 'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/';
                preUrl = 'https://china.nba.com/media/img/players/head/260x190/';
                return "<table width='" + width + "'>" +
                    "<tr><td align ='center'>" +
                    "<img class = 'playerImg' " +
                    "style = 'background: " + character.color + "' " +
                    "src = '" + preUrl + character.id + ".png" + "'>" +
                    "</td></tr>" +
                    "<tr><td align='center'>" +
                    "<label class ='playerName' >" + character.name + "</label>" + "</td></tr>" + "</table>";
            }

            function highlightCY(d) {
                svg0.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                svg0.select('g.links').selectAll('[id =\'' + d.character.id + '\']').attr('opacity', 1.0);

                svg0.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                svg0.select('g.intros').selectAll('[id = \'' + d.character.id + '\']').attr('opacity', 1.0);

                svg0.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);


                d.character.appearances.forEach(function (c) {
                    svg0.select('g.scenes').selectAll('[id =\'' + c.scene.id + '\']').attr('opacity', 1.0);
                });
                // updatePlayerInfo(Forces, d.character);
            }

            function highlightCN(_) {
                svg0.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                svg0.select('g.links').selectAll('g').attr('opacity', 1.0);
                svg0.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
            }
        }
    }
}]);



