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
            $rootScope.quarterGap = 0;

            $rootScope.minuteScore = [];
            $rootScope.minuteOriginDrawData = [];
            $rootScope.minuteDrawData = [];

            $rootScope.playData = [];
            $rootScope.playOriginDrawData = [];
            $rootScope.playDrawData = [];

            $rootScope.eventData = [];
            $rootScope.playerInfo = [];
            $rootScope.storyLine = {pre: {}, data: [], ps: [], draw: {}};
            $rootScope.storyLine2 = {'characters': [], 'scenes': [], 'charactersMap': {}};
            $rootScope.eventEffect = {home:[], away:[]};
            $rootScope.storyLineInteractionCount = [];
            $rootScope.sortedY = [];
            $rootScope.sortedList = [];

            $rootScope.storyLineData = [];
            $rootScope.storyLineDrawData = [];
            $rootScope.storyLineOriginDrawData = [];

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
            $rootScope.factor.y = $scope.windowHeight / 100;

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
                $scope.loadFlag = 1;
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

            let preOffsetX = -1;
            let pIndex = {home: 0, away: 0};
            let Index = {home: 0, away: 0};

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
            let preEvent = null;
            let playerStatus = {};
            angular.forEach($sessionStorage.playerData, function (player) {
                let temp = {id: '', name: '', width: 0, affiliation: '', color: '', initialGroup: undefined};
                temp.id = player['id'];
                temp.name = player['firstName'] + ' ' + player['lastName'];
                temp.width = temp.name.length * 10;
                temp.affiliation = $scope.predictSide(player['team']).teamM;
                temp.color = $scope.predictSide(player['team']).color;
                temp.initialGroup = $scope.predictSide(player['team']).group;

                playerStatus[temp.id] = player['starter'];
                $rootScope.storyLine2.charactersMap[temp.id] = temp;
                $rootScope.storyLine2.characters.push($rootScope.storyLine2.charactersMap[temp.id]);

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
                            weight: 0
                        };
                        let players = event['players'].filter(function (player) {
                            return player.id !== null && player.name !== null && player.team !== null;
                        });
                        if (players.length > 0) {
                            let sceneTeam = $scope.predictSide(players[0].team);
                            let score_gap = 5 * (event['home_score'] - event['away_score']);
                            let number_T = 50;
                            if (event['event_type'] !== 12 && event['event_type'] !== 13){
                                let  effect = eventEffect(event['event_type'], event['timeDuring'], sceneTeam.teamM);
                                $rootScope.eventEffect.away.push({'x': event['timeOffset'], 'y0': number_T + 24 - score_gap, 'y1':number_T +24 + effect.away - score_gap});
                                $rootScope.eventEffect.home.push({'x': event['timeOffset'], 'y0': number_T + 48 + 24 - score_gap - effect.home, 'y1' :number_T + 48 + 24 - score_gap});

                            }
                        }
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
                                    weight: 0
                                };
                                scene.id = event.eventId + '-' + (i++).toString();
                                scene.type = event['event_type'];
                                scene.quarter = event['quarterId'] - 1;
                                scene.timeOffset = event['timeOffset'];
                                scene.characters.push($rootScope.storyLine2.charactersMap[player.id]);
                                scene.status = deepCopy(playerStatus);
                                scene.start = preEvent !== null ? preEvent['timeOffset'] + (scene.quarter + 0.5) * $rootScope.quarterGap : 0;
                                scene.duration = preEvent === null ? 1 : event['timeOffset'] - preEvent['timeOffset'];
                                $rootScope.storyLine2.scenes.push(scene);
                            });
                            preEvent = event;
                        }
                        if (players.length >= 1) {
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
                            scene.start = preEvent !== null ? preEvent['timeOffset'] + scene.quarter * $rootScope.quarterGap : 0;
                            scene.duration = preEvent === null ? 1 : event['timeOffset'] - preEvent['timeOffset'];
                            $rootScope.storyLine2.scenes.push(scene);
                            preEvent = event;
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

            let homeOrgX = 80, homeOrgY = $scope.halfHeightY + $rootScope.factor.y * 2;
            let awayOrgX = 80, awayOrgY = $scope.halfHeightY - $rootScope.factor.y * 2;

            $scope.Icon = {home: null, away: null};
            $scope.Icon.home = {x: 0, y: $scope.halfHeightY - 37.5 + $rootScope.factor.y * 11};
            $scope.Icon.away = {x: 0, y: $scope.halfHeightY - 37.5 - $rootScope.factor.y * 11};

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
                    home: $rootScope.factor.y * 20,
                    away: 0 - $rootScope.factor.y * 20
                };
                QuarterObj.home = new Quad(
                    new Point(homeOrgX, homeOrgY),
                    new Point(homeOrgX, homeOrgY + QuarterOffset_Y.home),
                    new Point(homeOrgX + QuarterOffset_X.home, homeOrgY + QuarterOffset_Y.home),
                    new Point(homeOrgX + QuarterOffset_X.home, homeOrgY)
                );
                QuarterObj.away = new Quad(
                    new Point(awayOrgX, awayOrgY),
                    new Point(awayOrgX, awayOrgY + QuarterOffset_Y.away),
                    new Point(awayOrgX + QuarterOffset_X.away, awayOrgY + QuarterOffset_Y.away),
                    new Point(awayOrgX + QuarterOffset_X.away, awayOrgY),
                );
                QuarterObj.compareLine.startLine = new Line(new Point(homeOrgX, homeOrgY), new Point(awayOrgX, awayOrgY), lineWidth, $scope.compareColor(homeOrgX, awayOrgX));
                QuarterObj.compareLine.endLine = new Line(new Point(homeOrgX + QuarterOffset_X.home, homeOrgY), new Point(awayOrgX + QuarterOffset_X.away, awayOrgY), lineWidth, $scope.compareColor(homeOrgX + QuarterOffset_X.home, awayOrgX + QuarterOffset_X.away));

                homeOrgX += QuarterOffset_X.home + QuarterGap;
                awayOrgX += QuarterOffset_X.away + QuarterGap;


                QuarterObj.home.isSelected = false;
                QuarterObj.away.isSelected = false;

                $rootScope.quarterDrawData.push(QuarterObj);
            });

            homeOrgX = 80 + MinuteGap;
            homeOrgY = $scope.halfHeightY + $rootScope.factor.y * 2;
            awayOrgX = 80 + MinuteGap;
            awayOrgY = $scope.halfHeightY - $rootScope.factor.y * 2;

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
                    home: $rootScope.factor.y * 20,
                    away: 0 - $rootScope.factor.y * 20
                };
                if (tempQuarter !== minuteInfo.quarter) {
                    homeOrgX += QuarterGap + MinuteGap;
                    awayOrgX += QuarterGap + MinuteGap;
                    tempQuarter = minuteInfo.quarter;
                }
                MinuteObj.home = new Quad(
                    new Point(homeOrgX, homeOrgY + MinuteOffset_Y.home - mOffset),
                    new Point(homeOrgX + MinuteOffset_X.home, homeOrgY + MinuteOffset_Y.home - mOffset),
                    new Point(homeOrgX + MinuteOffset_X.home, homeOrgY + mOffset),
                    new Point(homeOrgX, homeOrgY + mOffset),
                    Background.home);

                MinuteObj.away = new Quad(
                    new Point(awayOrgX, awayOrgY + MinuteOffset_Y.away + mOffset),
                    new Point(awayOrgX + MinuteOffset_X.away, awayOrgY + MinuteOffset_Y.away + mOffset),
                    new Point(awayOrgX + MinuteOffset_X.away, awayOrgY - mOffset),
                    new Point(awayOrgX, awayOrgY - mOffset),
                    Background.away);

                MinuteObj.compareLine.startLine = new Line(new Point(awayOrgX, awayOrgY), new Point(homeOrgX, homeOrgY), lineWidth, $scope.compareColor(homeOrgX, awayOrgX));
                MinuteObj.compareLine.endLine = new Line(new Point(awayOrgX + MinuteOffset_X.away, awayOrgY), new Point(homeOrgX + MinuteOffset_X.home, homeOrgY), lineWidth, $scope.compareColor(homeOrgX + MinuteOffset_X.home, awayOrgX + MinuteOffset_X.away));

                homeOrgX += MinuteOffset_X.home + MinuteGap;
                awayOrgX += MinuteOffset_X.away + MinuteGap;

                MinuteObj.home.isSelected = false;
                MinuteObj.away.isSelected = false;

                $rootScope.minuteDrawData.push(MinuteObj);
            });

            let tempPlayDrawData = [];
            let tempMinutePlayHomeDrawArray = [], tempMinutePlayAwayDrawArray = [];
            let tempPlayHomeDrawInfo = {}, tempPlayAwayDrawInfo = {};
            let background = '', radius = 1, lastRadius = 1;

            let homePlayX = 0, homePlayY = 0, lastHomeScorePlayRadius = 0;
            let awayPlayX = 0, awayPlayY = 0, lastAwayScorePlayRadius = 0;
            let tempPlayHomeIndex = 0, tempPlayAwayIndex = 0;

            homeOrgX = 80;
            homeOrgY = $scope.halfHeightY + $rootScope.factor.y * 2;
            awayOrgX = 80;
            awayOrgY = $scope.halfHeightY - $rootScope.factor.y * 2;

            angular.forEach($rootScope.playData, function (minuteInfo, minuteIndex) {
                tempPlayDrawData = [];
                tempMinutePlayAwayDrawArray = [];
                tempMinutePlayHomeDrawArray = [];

                awayPlayX = $scope.minuteDrawData[minuteIndex].away.bottomLeft.x;
                awayPlayY = awayOrgY - mOffset;

                homePlayX = $scope.minuteDrawData[minuteIndex].home.bottomLeft.x;
                homePlayY = homeOrgY + mOffset;

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
                            awayPlayX += (0.25 * $rootScope.factor.x);
                        }
                        awayPlayX += radius;
                        awayPlayY -= radius;
                    } else {
                        if (playInfo.point > 0) {
                            if (lastRadius === (((1 / 2) * $rootScope.factor.x) - MinuteGap)) {
                                if (lastAwayScorePlayRadius === 0) {
                                    awayPlayX = awayPlayX + radius;
                                } else {
                                    awayPlayX = lastAwayScorePlayRadius + radius;
                                }
                            } else {
                                awayPlayX += lastRadius + radius;
                            }
                        }
                        awayPlayY -= radius + lastRadius;
                    }
                    tempPlayAwayDrawInfo = new Circle(new Point(awayPlayX, awayPlayY), radius, background);
                    tempPlayAwayDrawInfo.eventId = playInfo.eventId;
                    tempMinutePlayAwayDrawArray.isSelected = false;
                    tempMinutePlayAwayDrawArray.push(tempPlayAwayDrawInfo);
                    lastRadius = radius;
                    if (playInfo.point > 0) {
                        lastAwayScorePlayRadius = awayPlayX + radius;
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
                            homePlayX += (0.25 * $rootScope.factor.x);
                        }
                        homePlayX += radius;
                        homePlayY += radius;
                    } else {
                        if (playInfo.point > 0) {
                            if (lastRadius === (((1 / 2) * $rootScope.factor.x) - MinuteGap)) {
                                if (lastHomeScorePlayRadius === 0) {
                                    homePlayX = homePlayX + radius;
                                } else {
                                    homePlayX = lastHomeScorePlayRadius + radius;
                                }
                            } else {
                                homePlayX += lastRadius + radius;
                            }
                        }
                        homePlayY += radius + lastRadius;
                    }
                    tempPlayHomeDrawInfo = new Circle(new Point(homePlayX, homePlayY), radius, background);
                    tempPlayHomeDrawInfo.eventId = playInfo.eventId;
                    tempMinutePlayHomeDrawArray.isSelected = false;
                    tempMinutePlayHomeDrawArray.push(tempPlayHomeDrawInfo);
                    lastRadius = radius;
                    if (playInfo.point > 0) {
                        lastHomeScorePlayRadius = homePlayX + radius;
                    }
                });

                tempPlayDrawData.home = tempMinutePlayHomeDrawArray;
                tempPlayDrawData.away = tempMinutePlayAwayDrawArray;
                $rootScope.playDrawData.push(tempPlayDrawData);
            });

            console.log('# storyLine start .');

            $scope.interactionCountCalculation();

            let tempOrgX = 150;
            let tempOrgY = 0;
            let tempEndX = 0;
            let tempEndY = 0;

            let interactionFactor = 1;
            let tempPathObj = {};
            let tempColor;

            for (let playerName in $rootScope.storyLineData) {
                if ($rootScope.playerInfo[playerName] === undefined) continue;
                tempOrgX = 150;
                tempOrgY = Math.floor($rootScope.sortedY[playerName]) - 5;
                let tempOrg = 'M' + tempOrgX + ' ' + tempOrgY;
                tempColor = $rootScope.playerInfo[playerName]['team'] === $scope.game['homeId'] ? $scope.teamColor.home : $scope.teamColor.away;
                tempPathObj = $rootScope.storyLineDrawData[playerName] === undefined ?
                    {
                        path: tempOrg,
                        points: [{x: tempOrgX, y: tempOrgY}],
                        color: tempColor,
                        width: 1
                    } : $rootScope.storyLineDrawData[playerName];
                angular.forEach($rootScope.storyLineData[playerName], function (eventId) {
                    tempEndX = $rootScope.eventData[eventId]['timeOffset'] * interactionFactor + 150;
                    tempEndY = tempOrgY;
                    if (tempEndX > tempOrgX) {
                        tempPathObj.path = tempPathObj.path + ' L' + tempEndX + ' ' + tempOrgY;
                        tempPathObj.points.push({x: tempEndX, y: tempOrgY});
                        tempOrgX = tempEndX;
                    }
                    switch ($rootScope.eventData[eventId]['event_type']) {
                        case 1:
                        case 2:
                        case 3:
                            if ($rootScope.eventData[eventId]['players'][0]['name'] === playerName) {
                                if ($rootScope.eventData[eventId]['players'][1]['id'] != null) {
                                    let playerName1 = $rootScope.eventData[eventId]['players'][1]['name'];
                                    if ($rootScope.sortedY[playerName] < $rootScope.sortedY[playerName1]) {
                                        tempEndY = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) - 2;
                                    } else {
                                        tempEndY = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) + 2;
                                    }

                                    tempPathObj.path += ' L' + Math.floor(tempOrgX + 1) + ' ' + tempEndY + ' L' + Math.floor(tempOrgX + 2) + ' ' + tempOrgY;
                                    tempPathObj.points.push({x: Math.floor(tempOrgX + 1), y: tempEndY});
                                    tempPathObj.points.push({x: Math.floor(tempOrgX + 2), y: tempOrgY});
                                    tempOrgX = Math.floor(tempEndX + 2);
                                }
                            }
                            if ($rootScope.eventData[eventId]['players'][1]['name'] === playerName) {
                                let playerName1 = $rootScope.eventData[eventId]['players'][0]['name'];
                                if ($rootScope.sortedY[playerName] < $rootScope.sortedY[playerName1]) {
                                    tempEndY = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) - 2;
                                } else {
                                    tempEndY = Math.floor(0.5 * ($rootScope.sortedY[playerName] + $rootScope.sortedY[playerName1]) - 5) + 2;
                                }
                                tempPathObj.path += ' L' + Math.floor(tempOrgX + 1) + ' ' + tempEndY + ' L' + Math.floor(tempOrgX + 2) + ' ' + tempOrgY;
                                tempPathObj.points.push({x: Math.floor(tempOrgX + 1), y: tempEndY});
                                tempPathObj.points.push({x: Math.floor(tempOrgX + 2), y: tempOrgY});
                                tempOrgX = Math.floor(tempEndX + 2);
                            }
                            break;
                        default:
                            break;
                    }
                });
                tempEndX = 150 + (720 * 4 + 5 * 60) * interactionFactor;
                tempPathObj.path = tempPathObj.path + ' L' + tempEndX + ' ' + tempOrgY;
                tempPathObj.points.push({x: tempEndX, y: tempOrgY});
                $rootScope.storyLineDrawData[playerName] = tempPathObj;
            }



            $rootScope.quarterOriginDrawData = $rootScope.quarterDrawData;
            $rootScope.minuteOriginDrawData = $rootScope.minuteDrawData;
            $rootScope.playOriginDrawData = $rootScope.playDrawData;
            $rootScope.storyLineOriginDrawData = $rootScope.storyLineDrawData;

            $rootScope.dataGeneration = true;
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
                angular.forEach($rootScope.storyLineData[playerName], function (eventId, eventIndex) {
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
            let sumInteractionCountSorted = [];
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
                // if($.inArray(sumInteractionCountSorted[playerName],testPlayer) > -1){
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
                // }
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
        $scope.$watch('data.selectedIndex', function () {
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
                $rootScope.playData[minuteIndex].away.isSelected = false;
                $rootScope.playData[minuteIndex].home.isSelected = false;
            }
        });


        $scope.quarterMouseover = function (index, event) {
            // $('#levelOneAway').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('#levelOneAway').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('#levelOneHome').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('#levelOneHome').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('.levelOneCompareStartLine').eq(index).siblings('.levelOneCompareStartLine').css('opacity', 0.1);
            // $('.levelOneCompareEndLine').eq(index).siblings('.levelOneCompareEndLine').css('opacity', 0.1);

            // if(index < 4){
            // 	$('#levelTwoAway').children('polygon').not('polygon:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 0.1);
            // 	$('#levelTwoHome').children('polygon').not('polygon:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 0.1);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareStartLine').not('line:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 0.1);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareEndLine').not('line:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 0.1);
            // }else{
            // 	$('#levelTwoAway').children('polygon').not('polygon:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5) + 1)+')').css('opacity', 0.1);
            // 	$('#levelTwoHome').children('polygon').not('polygon:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5) + 1)+')').css('opacity', 0.1);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareStartLine').not('line:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5))+')').css('opacity', 0.1);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareEndLine').not('line:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5))+')').css('opacity', 0.1);
            // }
        };
        $scope.quarterMouseleave = function (index) {
            // $('#levelOneAway').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('#levelOneAway').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('#levelOneHome').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('#levelOneHome').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('.levelOneCompareStartLine').eq(index).siblings('.levelOneCompareStartLine').css('opacity', 1.0);
            // $('.levelOneCompareEndLine').eq(index).siblings('.levelOneCompareEndLine').css('opacity', 1.0);

            // if(index < 4){
            // 	$('#levelTwoAway').children('polygon').not('polygon:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 1.0);
            // 	$('#levelTwoHome').children('polygon').not('polygon:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 1.0);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareStartLine').not('line:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 1.0);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareEndLine').not('line:nth-child(n+'+((index * 12) + 1)+'):nth-child(-n+'+((index+1) * 12)+')').css('opacity', 1.0);
            // }else{
            // 	$('#levelTwoAway').children('polygon').not('polygon:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 4 + 1) * 5) + 1)+')').css('opacity', 1.0);
            // 	$('#levelTwoHome').children('polygon').not('polygon:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 4 + 1) * 5) + 1)+')').css('opacity', 1.0);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareStartLine').not('line:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5) + 1)+')').css('opacity', 1.0);
            // 	$('#levelTwoCompareLine').find('.levelTwoCompareEndLine').not('line:nth-child(n+'+(48 + ((index - 4) * 5) + 1)+'):nth-child(-n+'+(48 + ((index - 3) * 5))+')').css('opacity', 1.0);
            // }
        };
        $scope.quarterMouseSelect = function (index) {
            $rootScope.quarterSelected = true;
            $rootScope.quarterDrawData[index].home.isSelected = !$rootScope.quarterDrawData[index].home.isSelected;
            $rootScope.quarterDrawData[index].away.isSelected = !$rootScope.quarterDrawData[index].away.isSelected;
        };

        $scope.minuteMouseover = function (index) {
            // $('#levelTwoAway').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('#levelTwoHome').children('polygon').eq(index).siblings('polygon').css('opacity', 0.1);
            // $('#levelTwoCompareLine').find('.levelTwoCompareStartLine').eq(index).siblings('.levelTwoCompareStartLine').css('opacity', 0.1);
            // $('#levelTwoCompareLine').find('.levelTwoCompareEndLine').eq(index).siblings('.levelTwoCompareEndLine').css('opacity', 0.1);

            // $('#levelOneAway').css('opacity', 0.1);
            // $('#levelOneCompareLine').css('opacity', 0.1);
            // $('#levelOneHome').css('opacity', 0.1);
        };
        $scope.minuteMouseleave = function (index) {
            // $('#levelTwoAway').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('#levelTwoHome').children('polygon').eq(index).siblings('polygon').css('opacity', 1.0);
            // $('#levelTwoCompareLine').find('.levelTwoCompareStartLine').eq(index).siblings('.levelTwoCompareStartLine').css('opacity', 1.0);
            // $('#levelTwoCompareLine').find('.levelTwoCompareEndLine').eq(index).siblings('.levelTwoCompareEndLine').css('opacity', 1.0);

            // $('#levelOneAway').css('opacity', 1.0);
            // $('#levelOneCompareLine').css('opacity', 1.0);
            // $('#levelOneHome').css('opacity', 1.0);
        };
        $scope.minuteMouseSelect = function (index) {
            $rootScope.quarterSelected = true;
            $rootScope.minuteSelected = true;
            $rootScope.minuteDrawData[index].away.isSelected = !$rootScope.minuteDrawData[index].away.isSelected;
            $rootScope.playDrawData[index].away.isSelected = !$rootScope.playDrawData[index].away.isSelected;
            $rootScope.minuteDrawData[index].home.isSelected = !$rootScope.minuteDrawData[index].home.isSelected;
            $rootScope.playDrawData[index].home.isSelected = !$rootScope.playDrawData[index].home.isSelected;
        };

        $scope.playMouseover = function (playInfo, event) {
            let tempEvent = $rootScope.eventData[playInfo.eventId];
            $scope.eventPlayerImg = 'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/' + tempEvent['players'][0].id + '.png';
            $scope.eventTime = tempEvent.time;
            $scope.eventPlayer = tempEvent['players'][0].name;
            $scope.eventType = tempEvent['event_type'];
            $scope.eventPoint = tempEvent['home_point'] > tempEvent['away_point'] ? tempEvent['home_point'] : tempEvent['away_point'];
            $('#tooltip').css({
                'top': (event.originalEvent.clientY - 50),
                'left': (event.originalEvent.clientX - 25)
            }).show();
        };
        $scope.playMouseleave = function () {
            $('#tooltip').hide();
        };
        $scope.playMouseSelect = function (index) {
        };

        return $scope.init();
    }])
    .directive('gameGraph', ['$rootScope', '$document', function ($rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'views/content/gameGraph.html',
            link: function ($scope, $element) {

                console.log($rootScope.data.selectedIndex);

                let zoomRate = 0.1;
                let theSvgElement;
                let currentX = 0, currentY = 0;

                $rootScope.matrix = [1, 0, 0, 1, 0, 0];
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

                theSvgElement = $element.find('#gameSVG');
                theSvgElement.children('g').attr('transform', 'matrix(' + $rootScope.matrix.join(' ') + ')');


            }
        };
    }])
    .directive('first', ['$rootScope', '$document', function ($rootScope) {
        return {
            restrict: 'E',  // Element name: <my-graph></my-graph>
            link: function ($scope) {
                console.log('index :' + $rootScope.data.selectedIndex);
                let svg = d3.select('first').append('svg').attr('class', 'gameSVG');
                let gameLogo = svg.append('g').attr('class', 'gameLogo');
                let quarters = svg.append('g').attr('class', 'quarters');
                let minutes = svg.append('g').attr('class', 'minutes');
                let plays = svg.append('g').attr('class', 'plays');
                svg.call(tooltip);
                update($rootScope.data.selectedIndex + 1);

                function update(index) {
                    initialization(svg);
                    updateLogo($scope.Icon);
                    if (index == 1) {
                        updateQuarters($rootScope.quarterDrawData, index);
                    }
                    if (index == 2) {
                        updateQuarters($rootScope.quarterDrawData, index);
                        updateMinutes($rootScope.minuteDrawData, index);
                    }
                    if (index == 3) {
                        updateQuarters($rootScope.quarterDrawData, index);
                        updateMinutes($rootScope.minuteDrawData, index);
                        updatePlays($rootScope.playDrawData, index);
                    }
                }

                function initialization(svg) {
                    svg.attr('width', '100%');
                    svg.attr('height', $scope.windowHeight);
                    svg.style('margin-left', '1%');
                }

                function updateLogo(iconData) {
                    let homeIcon = gameLogo.append('image').attr('class', 'homeIcon');
                    let awayIcon = gameLogo.append('image').attr('class', 'awayIcon');
                    homeIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['homeName'] + '.svg');
                    homeIcon.attr('width', '75').attr('x', iconData.home.x).attr('y', iconData.home.y);
                    awayIcon.attr('href', 'assets/images/teamLogo/' + $scope.game['awayName'] + '.svg');
                    awayIcon.attr('width', '75').attr('x', iconData.away.x).attr('y', iconData.away.y);
                }

                function updateQuarters(quarterData, index) {
                    let quarter = quarters.selectAll('g.quarter').data(quarterData);
                    let enter = quarter.enter().append('g').attr('class', 'quarter').call(function (s) {
                        s.attr('id', function (d, i) {
                            return i;
                        });
                        s.attr('opacity', function (d) {
                            if ($rootScope.quarterSelected && !d.home.isSelected) {
                                return 0.1;
                            } else {
                                return 1.0;
                            }
                        });

                        let quarterH = s.append('polygon').attr('class', 'quarterH');
                        let quarterA = s.append('polygon').attr('class', 'quarterA');
                        quarterH.attr('points', function (d) {
                            let points = [];
                            points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                            points.push([d.home.upLeft.x, d.home.upLeft.y]);
                            points.push([d.home.upRight.x, d.home.upRight.y]);
                            points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterA.attr('points', function (d) {
                            let points = [];
                            points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                            points.push([d.away.upLeft.x, d.away.upLeft.y]);
                            points.push([d.away.upRight.x, d.away.upRight.y]);
                            points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterH.attr('fill', $scope.teamColor.home);
                        quarterA.attr('fill', $scope.teamColor.away);

                        let CompareLineS = s.append('path').attr('class', 'CompareLineS');
                        CompareLineS.attr('d', function (d) {
                            let points = [d.compareLine.startLine.start, d.compareLine.startLine.end];
                            return lineFunction(points);
                        });
                        CompareLineS.attr('stroke', function (d) {
                            return d.compareLine.startLine.color;
                        });
                        CompareLineS.attr('stroke-width', function (d) {
                            return d.compareLine.startLine.width;
                        });
                        let CompareLineE = s.append('path').attr('class', 'CompareLineE');
                        CompareLineE.attr('d', function (d) {
                            let points = [d.compareLine.endLine.start, d.compareLine.endLine.end];
                            return lineFunction(points);
                        });
                        CompareLineE.attr('stroke', function (d) {
                            return d.compareLine.endLine.color;
                        });
                        CompareLineE.attr('stroke-width', function (d) {
                            return d.compareLine.endLine.width;
                        });
                        s.on('click', function (d) {
                            if (index !== 1) return;
                            if (!$rootScope.quarterSelected) {
                                quarters.selectAll('g.quarter').attr('opacity', 0.1);
                                $rootScope.quarterSelected = true;
                            }

                            d3.select(this).attr('opacity', function (d) {
                                d.home.isSelected = !d.home.isSelected;
                                d.away.isSelected = !d.away.isSelected;
                                if ($rootScope.quarterSelected && !d.home.isSelected) {
                                    return 0.1;
                                } else {
                                    return 1.0;
                                }
                            });
                        });
                    });
                    let update = quarter.call(function (s) {
                        s.attr('id', function (d, i) {
                            return i;
                        });
                        let quarterH = s.select('rect.quarterH');
                        let quarterA = s.select('rect.quarterA');
                        quarterH.attr('points', function (d) {
                            let points = [];
                            points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                            points.push([d.home.upLeft.x, d.home.upLeft.y]);
                            points.push([d.home.upRight.x, d.home.upRight.y]);
                            points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterA.attr('points', function (d) {
                            let points = [];
                            points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                            points.push([d.away.upLeft.x, d.away.upLeft.y]);
                            points.push([d.away.upRight.x, d.away.upRight.y]);
                            points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterH.attr('fill', $scope.teamColor.home);
                        quarterA.attr('fill', $scope.teamColor.away);

                        let CompareLineS = s.select('path.CompareLineS');
                        CompareLineS.attr('d', function (d) {
                            let points = [d.compareLine.startLine.start, d.compareLine.startLine.end];
                            return lineFunction(points);
                        });
                        CompareLineS.attr('stroke', function (d) {
                            return d.compareLine.startLine.color;
                        });
                        CompareLineS.attr('stroke-width', function (d) {
                            return d.compareLine.startLine.width;
                        });
                        let CompareLineE = s.select('path.CompareLineE');
                        CompareLineE.attr('d', function (d) {
                            let points = [d.compareLine.endLine.start, d.compareLine.endLine.end];
                            return lineFunction(points);
                        });
                        CompareLineE.attr('stroke', function (d) {
                            return d.compareLine.endLine.color;
                        });
                        CompareLineE.attr('stroke-width', function (d) {
                            return d.compareLine.endLine.width;
                        });
                    });
                    let exit = quarter.exit().remove();
                }

                function updateMinutes(minuteData, index) {
                    let minute = minutes.selectAll('g.minute').data(minuteData);
                    let enter = minute.enter().append('g').attr('class', 'minute').call(function (s) {
                        s.attr('id', function (d, i) {
                            return i;
                        });
                        s.attr('opacity', function (d) {
                            if ($rootScope.minuteSelected && !d.home.isSelected) {
                                return 0.1;
                            } else {
                                return 1.0;
                            }
                        });
                        let minuteH = s.append('polygon').attr('class', 'minuteH');
                        let minuteA = s.append('polygon').attr('class', 'minuteA');
                        minuteH.attr('points', function (d) {
                            let points = [];
                            points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                            points.push([d.home.upLeft.x, d.home.upLeft.y]);
                            points.push([d.home.upRight.x, d.home.upRight.y]);
                            points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        minuteA.attr('points', function (d) {
                            let points = [];
                            points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                            points.push([d.away.upLeft.x, d.away.upLeft.y]);
                            points.push([d.away.upRight.x, d.away.upRight.y]);
                            points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        minuteH.attr('fill', function (d) {
                            return d.home.background;
                        });
                        minuteA.attr('fill', function (d) {
                            return d.away.background;
                        });
                        let CompareLineS = s.append('path').attr('class', 'CompareLineS');
                        CompareLineS.attr('d', function (d) {
                            let points = [d.compareLine.startLine.start, d.compareLine.startLine.end];
                            return lineFunction(points);
                        });
                        CompareLineS.attr('stroke', function (d) {
                            return d.compareLine.startLine.color;
                        });
                        CompareLineS.attr('stroke-width', function (d) {
                            return d.compareLine.startLine.width;
                        });
                        let CompareLineE = s.append('path').attr('class', 'CompareLineE');
                        CompareLineE.attr('d', function (d) {
                            let points = [d.compareLine.endLine.start, d.compareLine.endLine.end];
                            return lineFunction(points);
                        });
                        CompareLineE.attr('stroke', function (d) {
                            return d.compareLine.endLine.color;
                        });
                        CompareLineE.attr('stroke-width', function (d) {
                            return d.compareLine.endLine.width;
                        });
                        s.on('click', function (d) {
                            if (index !== 2) return;
                            if (!$rootScope.minuteSelected) {
                                quarters.selectAll('g.quarter').attr('opacity', 0.1);
                                minutes.selectAll('g.minute').attr('opacity', 0.1);
                                $rootScope.minuteSelected = true;
                            }

                            d3.select(this).attr('opacity', function (d) {
                                d.home.isSelected = !d.home.isSelected;
                                d.away.isSelected = !d.away.isSelected;
                                if ($rootScope.minuteSelected && !d.home.isSelected) {
                                    return 0.1;
                                } else {
                                    return 1.0;
                                }
                            });
                        });
                    });
                    let update = minute.call(function (s) {
                        s.attr('id', function (d, i) {
                            return i;
                        });
                        let quarterH = s.select('rect.quarterH');
                        let quarterA = s.select('rect.quarterA');
                        quarterH.attr('points', function (d) {
                            let points = [];
                            points.push([d.home.bottomLeft.x, d.home.bottomLeft.y]);
                            points.push([d.home.upLeft.x, d.home.upLeft.y]);
                            points.push([d.home.upRight.x, d.home.upRight.y]);
                            points.push([d.home.bottomRight.x, d.home.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterA.attr('points', function (d) {
                            let points = [];
                            points.push([d.away.bottomLeft.x, d.away.bottomLeft.y]);
                            points.push([d.away.upLeft.x, d.away.upLeft.y]);
                            points.push([d.away.upRight.x, d.away.upRight.y]);
                            points.push([d.away.bottomRight.x, d.away.bottomRight.y]);
                            return d3.geom.polygon(points);
                        });
                        quarterH.attr('fill', $scope.teamColor.home);
                        quarterA.attr('fill', $scope.teamColor.away);
                        let CompareLineS = s.select('path.CompareLineS');
                        CompareLineS.attr('d', function (d) {
                            let points = [d.compareLine.startLine.start, d.compareLine.startLine.end];
                            return lineFunction(points);
                        });
                        CompareLineS.attr('stroke', function (d) {
                            return d.compareLine.startLine.color;
                        });
                        CompareLineS.attr('stroke-width', function (d) {
                            return d.compareLine.startLine.width;
                        });
                        let CompareLineE = s.select('path.CompareLineE');
                        CompareLineE.attr('d', function (d) {
                            let points = [d.compareLine.endLine.start, d.compareLine.endLine.end];
                            return lineFunction(points);
                        });
                        CompareLineE.attr('stroke', function (d) {
                            return d.compareLine.endLine.color;
                        });
                        CompareLineE.attr('stroke-width', function (d) {
                            return d.compareLine.endLine.width;
                        });
                    });
                    let exit = minute.exit().remove();

                }

                function updatePlays(playData, index) {
                    let eventsData = [];
                    playData.forEach(function (d) {
                        d.home.forEach(function (p) {
                            eventsData.push(p);
                        });
                        d.away.forEach(function (p) {
                            eventsData.push(p);
                        })
                    });
                    let play = plays.selectAll('.play').data(eventsData);
                    let enter = play.enter().append('circle').attr('class', 'play')
                        .attr('id', function (d, i) {
                            return i;
                        })
                        .attr('cx', function (d) {
                            return d.center.x;
                        })
                        .attr('cy', function (d) {
                            return d.center.y;
                        })
                        .attr('r', function (d) {
                            return d.radius;
                        })
                        .attr('fill', function (d) {
                            return d.background;
                        })
                        .on('mouseover', function (d) {
                            if (index !== 3) return;
                            let tempEvent = $rootScope.eventData[d.eventId];
                            let eventPlayerImg = 'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/' + tempEvent['players'][0].id + '.png';
                            let eventTime = tempEvent.time;
                            let eventPlayer = tempEvent['players'][0].name;
                            let eventType = tempEvent['event_type'];
                            let eventPoint = tempEvent['home_point'] > tempEvent['away_point'] ? tempEvent['home_point'] : tempEvent['away_point'];
                            tooltip.html("<table id = 'd3tooltip'>" +
                                "<tr>" +
                                "<td width='70%'>" +
                                "<img id='playerPhoto'  style='background:' + $scope.predictSide(tempEvent['players'][0]['team']).color +'' src=''+ eventPlayerImg + ''  width='130px' ></td>" +
                                "<td width='30%'>" +
                                "<table height='100%'>" +
                                "<tr height = '33%'><td>" + eventTime + "</td></tr>" +
                                "<tr height = '33%'><td>" + eventPlayer + "</td></tr>" +
                                "<tr height = '33%'><td>" + eventType + "</td></tr>" +
                                "</table>" +
                                "</td></table>");
                            tooltip.show();

                        })
                        .on('mouseout', function () {
                            if (index !== 3) return;
                            tooltip.hide();
                        });
                    let update = play.attr('id', function (d, i) {
                        return i;
                    })
                        .attr('cx', function (d) {
                            return d.center.x;
                        })
                        .attr('cy', function (d) {
                            return d.center.y;
                        })
                        .attr('r', function (d) {
                            return d.radius;
                        })
                        .attr('fill', function (d) {
                            return d.background;
                        });
                    let exit = play.exit().remove();

                }
            }
        }
    }])
    .directive('myDirective', ['$rootScope', '$document', function ($rootScope) {
        return {
            restrict: 'E',  // Element name: <my-directive></my-directive>
            link: function ($scope, $element) {
                console.log($rootScope.data.selectedIndex);
                let lineFunction = d3.svg.line()
                    .interpolate('linear')
                    .tension(Math.random())
                    .x(function (d) {
                        return d.x;
                    })
                    .y(function (d) {
                        return d.y;
                    });


                let svg = d3.select('my-directive')
                    .append('svg')
                    .attr('id', 'gameSVG')
                    .attr('width', '100%')
                    .attr('height', $scope.windowHeight)
                    .style('margin-left', '1%');

                let storyLEntity = svg.append('g')
                    .attr('id', 'storyLEntity')
                    .attr('ng-if', 'data.selectedIndex === 4');

                let playerNames = storyLEntity.append('g')
                    .attr('id', 'playerName')
                    .selectAll('text')
                    .data($rootScope.sortedList)
                    .enter()
                    .append('text')
                    .attr('x', '0')
                    .attr('y', function (d) {
                        return $rootScope.sortedY[d];
                    })
                    .text(function (d) {
                        return d;
                    })
                    .style('font-family', 'Arial');


                let paths = svg.append('g')
                    .attr('id', 'storyLine')
                    .selectAll('g')
                    .data($rootScope.sortedList)
                    .enter()
                    .append('g')
                    .attr('id', function (d) {
                        return d;
                    })
                    .append('path')
                    .attr('d', function (d) {
                        return lineFunction($rootScope.storyLineDrawData[d].points);
                    })
                    .attr('stroke', function (d) {
                        return d3.rgb($rootScope.storyLineDrawData[d].color);
                    })
                    .attr('stroke-width', function (d) {
                        return d3.rgb($rootScope.storyLineDrawData[d].width);
                    })
                    .attr('stroke-linecap', 'round')
                    .attr('fill', 'none');

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
    }])
    .directive('storyLine', ['$rootScope', '$document', function ($rootScope) {
        return {
            restrict: 'E',  // Element name: <my-directive></my-directive>
            link: function ($scope, $element) {

                console.log($rootScope.data.selectedIndex);




                let svg = d3.select('story-line')
                    .append('svg')
                    .attr('id', 'gameSVG')
                    .attr('width', '100%')
                    .attr('height', $scope.windowHeight)
                    .style('margin-left', '1%');

                let storyLEntity = svg.append('g')
                    .attr('id', 'storyLEntity')
                    .attr('ng-if', 'data.selectedIndex === 5');

                let playerNames = storyLEntity.append('g')
                    .attr('id', 'playerName')
                    .selectAll('text')
                    .data($rootScope.storyLine.ps)
                    .enter()
                    .append('text')
                    .attr('x', '0')
                    .attr('y', function (d) {
                        return $rootScope.storyLine.pre[d].startY;
                    })
                    .text(function (d) {
                        return $rootScope.storyLine.pre[d].name;
                    })
                    .style('font-family', 'Arial')
                    .style('fill', function (d) {
                        return $rootScope.storyLine.pre[d].color;
                    });


                let paths = svg.append('g')
                    .attr('id', 'storyLine')
                    .selectAll('g')
                    .data($rootScope.storyLine.ps)
                    .enter()
                    .append('g')
                    .attr('id', function (d) {
                        return d;
                    })
                    .append('path')
                    .attr('d', function (d) {
                        return areaFunction($rootScope.storyLine.draw[d]);
                    })
                    // .attr('stroke', function (d) {
                    //     return d3.rgb($rootScope.storyLine.pre[d].color);
                    // })
                    // .attr('stroke-width', function (d) {
                    //     return 2;
                    // })
                    // .attr('stroke-linecap', 'round')
                    .attr('fill', function (d) {
                        return d3.rgb($rootScope.storyLine.pre[d].color);
                    });


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
    }])
    .directive('storyLine2', ['$rootScope', '$document', function ($rootScope) {
        return {
            restrict: 'E',  // Element name: <my-directive></my-directive>
            link: function ($scope) {

                console.log($rootScope.data.selectedIndex);

                let scenes = $rootScope.storyLine2.scenes;
                let characters = $rootScope.storyLine2.characters;

                let storyLine = d3.select('story-line2');
                let selector = storyLine.append('select');
                let svg = storyLine.append('svg');
                let sliderCon = storyLine.append('div');

                let Links  = svg.append('g').attr('class', 'links');
                let Scenes = svg.append('g').attr('class', 'scenes');
                let Intros = svg.append('g').attr('class', 'intros');
                let SteamT = svg.append('g').attr('class', 'steamT');
                SteamT.append('path').attr('class','areaH');
                SteamT.append('path').attr('class','areaA');
                SteamT.append('path').attr('class','baseL');

                configSelector(selector);
                configSliderCon(sliderCon);

                update(scenes, characters);

                function update(scenes, characters) {
                    let Canvas = {};
                    Canvas.width = scenes.length * 40;
                    Canvas.height = 1600;

                    let narrative = d3.layout.narrative();
                    narrative.scenes(scenes);
                    narrative.characters(characters);
                    narrative.size([Canvas.width, Canvas.height]);
                    narrative.pathSpace(20);
                    narrative.groupMargin(60);
                    narrative.labelSize([160, 15]);
                    narrative.scenePadding([0, 5, 0, 5]);
                    narrative.labelPosition('left');
                    narrative.layout();

                    configSvg(svg, narrative);
                    configSteamT(SteamT, narrative);

                    updateLinks(narrative);
                    updateScenes(narrative);
                    updateNodes(narrative);


                    svg.call(tooltip);

                }

                function updateLinks(narrative) {

                    let link = Links.selectAll('g')
                        .data(narrative.links());

                    link.enter()
                        .append('g')
                        .attr('class', 'character')
                        .attr('id', function (d) {
                            return d.id;
                        });

                    link.attr('id', function (d) {
                        return d.id;
                    });

                    link.exit().remove();

                    let segment = link.selectAll('path')
                        .data(function (d) {
                            return d.links;
                        });

                    segment.enter()
                        .append('path')
                        .attr('d', narrative.link())
                        .attr('stroke', function (d) {
                            return d.character.color;
                        })
                        .attr('stroke-dasharray', function (d) {
                            return d.target.scene.status[d.character.id] ? '' : '1,4';
                        })
                        .attr('stroke-width', 2)
                        .attr('fill', 'none')
                        .on('mouseover', function (d) {
                            svg.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                            svg.select('g.links').selectAll('[id =\'' + d.character.id + '\']').attr('opacity', 1.0);

                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                            svg.select('g.intros').selectAll('[id = \'' + d.character.id + '\']').attr('opacity', 1.0);

                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);
                            d.character.appearances.forEach(function (c) {
                                let id = c.scene.id;
                                svg.select('g.scenes').selectAll('[id =\'' + id + '\']').attr('opacity', 1.0);
                            });
                        })
                        .on('mouseout', function () {
                            svg.select('g.links').selectAll('g').attr('opacity', 1.0);
                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                        });

                    segment.attr('d', narrative.link())
                        .attr('stroke', function (d) {
                            return d.character.color;
                        })
                        .attr('stroke-dasharray', function (d) {
                            return d.target.scene.status[d.character.id] ? '' : '1,4';
                        })
                        .on('mouseover', function (d) {
                            svg.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                            svg.select('g.links').selectAll('[id =\'' + d.character.id + '\']').attr('opacity', 1.0);

                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                            svg.select('g.intros').selectAll('[id = \'' + d.character.id + '\']').attr('opacity', 1.0);

                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);
                            d.character.appearances.forEach(function (c) {
                                let id = c.scene.id;
                                svg.select('g.scenes').selectAll('[id =\'' + id + '\']').attr('opacity', 1.0);
                            });
                        })
                        .on('mouseout', function () {
                            svg.select('g.links').selectAll('g').attr('opacity', 1.0);
                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                        });

                    segment.exit().remove();
                }

                function updateScenes(narrative) {
                    let scene = Scenes.selectAll('.scene')
                        .data(narrative.scenes());

                    scene.enter()
                        .append('g')
                        .attr('class', 'scene')
                        .attr('id', function (d) {
                            return d.id;
                        })
                        .attr('transform', function (d) {
                            let x, y;
                            x = Math.round(d.x) + 0.5;
                            y = Math.round(d.y) + 0.5;
                            return 'translate(' + [x, y] + ')';
                        })
                        .append('rect')
                        .attr('opacity',0)
                        .attr('width', function (d) {
                            return d.width;
                        })
                        .attr('height', function (d) {
                            return d.height;
                        })
                        .attr('rx', 5)
                        .attr('ry', 5)
                        .attr('stroke', '#000')
                        .attr('opacity', function (d) {
                            if (d.appearances.length === 1)
                                return 0;
                            else
                                return 1;
                        })
                        .attr('fill', '#ffffff')
                        .on('mouseover', function (d) {
                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                            svg.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);
                            d.characters.forEach(function (c) {
                                svg.select('g.links').selectAll('[id = \'' + c.id + '\']').attr('opacity', 1.0);
                                svg.select('g.intros').selectAll('[id = \'' + c.id + '\']').attr('opacity', 1.0);
                                c.appearances.forEach(function (e) {
                                    let id = e.scene.id;
                                    svg.select('g.scenes').selectAll('[id =\'' + id + '\']').attr('opacity', 1.0);
                                });
                            });
                            tooltip.offset([-10, 0]);
                            tooltip.html("<div ><table>" +
                                "<tr><td width='50px' align ='left'>id:" + d.id + "</td></tr>" +
                                "<tr><td align ='left'>type:" + d.type + "</td></tr>" +
                                "</table></div>");
                            tooltip.show();
                        })
                        .on('mouseout', function () {
                            svg.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
                            svg.select('g.links').selectAll('g.character').attr('opacity', 1.0);
                            svg.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                            tooltip.hide();
                        });

                    scene.attr('id', function (d) {
                        return d.id;
                    })
                        .attr('transform', function (d) {
                            let x, y;
                            x = Math.round(d.x) + 0.5;
                            y = Math.round(d.y) + 0.5;
                            return 'translate(' + [x, y] + ')';
                        })
                        .select('rect')
                        .attr('width', function (d) {
                            return d.width;
                        })
                        .attr('height', function (d) {
                            return d.height;
                        })
                        // .attr('opacity',0)
                        .attr('opacity', function (d) {
                            if (d.appearances.length === 1)
                                return 0;
                            else
                                return 1;
                        });

                    scene.exit().remove();

                    let appearance = scene.selectAll('.appearance')
                        .data(function (d) {
                            return d.appearances;
                        });

                    appearance.enter()
                        .append('circle')
                        .attr('class', 'appearance')
                        .attr('cx', function (d) {
                            return d.x;
                        })
                        .attr('cy', function (d) {
                            return d.y;
                        })
                        .attr('r', function (d) {
                            if (d.scene.type === 13)
                                return 4;
                            else
                                return 2;
                        })
                        .attr('fill', function (d) {
                            if (d.scene.type === 13)
                                return '#a5a5a5';
                            else
                                return d.character.color;
                        })
                        .attr('stroke', function (d) {
                            return d.character.color;
                        });

                    appearance.attr('cx', function (d) {
                        return d.x;
                    })
                        .attr('cy', function (d) {
                            return d.y;
                        })
                        .attr('r', function (d) {
                            if (d.scene.type === 13)
                                return 4;
                            else
                                return 2;
                        })
                        .attr('fill', function (d) {
                            if (d.scene.type === 13)
                                return '#a5a5a5';
                            else
                                return d.character.color;
                        })
                        .attr('stroke', function (d) {
                            return d.character.color;
                        });

                    appearance.exit().remove();


                }

                function updateNodes(narrative) {
                    let intro = Intros.selectAll('.intro')
                        .data(narrative.introductions());
                    intro.enter()
                        .call(function (s) {
                            let g = s.append('g')
                                .attr('class', 'intro')
                                .attr('id', function (d) {
                                    return d.character.id;
                                });

                            g.append('rect')
                                .attr('x', -4)
                                .attr('y', -4.5)
                                .attr('width', 4)
                                .attr('height', 8)
                                .attr('fill', function (d) {
                                    return d.character.color;
                                });

                            let text = g.append('g').attr('class', 'text');

                            // Apppend two actual 'text' nodes to fake an 'outside' outline.
                            text.append('text');
                            text.append('text').attr('class', 'color');

                            g.attr('transform', function (d) {
                                let x, y;
                                x = Math.round(d.x);
                                y = Math.round(d.y);
                                return 'translate(' + [x, y] + ')';
                            });

                            g.selectAll('text')
                                .attr('text-anchor', 'end')
                                .attr('y', '4px')
                                .attr('x', '-8px')
                                .text(function (d) {
                                    return d.character.name;
                                })
                                .attr('font-family', 'Arial')
                                .attr('fill', function (d) {
                                    return d.character.color;
                                })
                                .on('mouseover', function (d) {
                                    svg.select('g.scenes').selectAll('g.scene').attr('opacity', 0.1);
                                    d.character.appearances.forEach(function (c) {
                                        let id = c.scene.id;
                                        svg.select('g.scenes').selectAll('[id =\'' + id + '\']').attr('opacity', 1.0);
                                    });

                                    svg.select('g.links').selectAll('g.character').attr('opacity', 0.1);
                                    svg.select('g.links').selectAll('[id =\'' + d.character.id + '\']').attr('opacity', 1.0);
                                    svg.select('g.intros').selectAll('g.intro').attr('opacity', 0.1);
                                    svg.select('g.intros').selectAll('[id = \'' + d.character.id + '\']').attr('opacity', 1.0);
                                    let preUrl = 'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/';
                                    tooltip.offset([-10, 0]);
                                    tooltip.html("<div  class = 'row' style='background: #dddddd'>" +
                                        "<table><tr><td align ='center'>" +
                                        "<img  class = 'playerImg' style='background: " + d.character.color + "' src='" + preUrl + d.character.id + ".png" + "'>" +
                                        "</td></tr>" +
                                        "<tr><td align ='center'>" + d.character.group.id + "</td></tr>" + "</table></div>").show();
                                })
                                .on('mouseout', function () {
                                    svg.select('g.scenes').selectAll('g.scene').attr('opacity', 1.0);
                                    svg.select('g.links').selectAll('g').attr('opacity', 1.0);
                                    svg.select('g.intros').selectAll('g.intro').attr('opacity', 1.0);
                                    tooltip.hide();
                                });

                        });
                    intro.call(function (s) {
                        let g = s.attr('id', function (d) {
                            return d.character.id;
                        });

                        g.attr('x', -4)
                            .attr('y', -4.5)
                            .attr('width', 4)
                            .attr('height', 8)
                            .attr('fill', function (d) {
                                return d.character.color;
                            });


                        g.attr('transform', function (d) {
                            let x, y;
                            x = Math.round(d.x);
                            y = Math.round(d.y);
                            return 'translate(' + [x, y] + ')';
                        });

                        g.selectAll('text')
                            .attr('text-anchor', 'end')
                            .attr('y', '4px')
                            .attr('x', '-8px')
                            .text(function (d) {
                                return d.character.name;
                            })
                            .attr('font-family', 'Arial')
                            .attr('fill', function (d) {
                                return d.character.color;
                            })

                    });
                    intro.exit().remove();

                }

                function configSelector(object) {
                    object.append('option').html('ALL');
                    object.append('option').html('1');
                    object.append('option').html('1');
                    object.append('option').html('1');
                    object.style('margin-left', '10px');
                    object.style('margin-right', '10px');
                    object.style('margin-top', '10px');
                    object.style('margin-bottom', '10px');
                    return object;
                }

                function configSvg(object, narrative) {
                    object.attr('id', 'narrative-chart');
                    object.attr('transform', function (d) {
                        let x = 10;
                        let y = 50;
                        return 'translate(' + [x, y] + ')';
                    });
                    object.style('margin-left', '10px');
                    object.style('margin-right', '10px');
                    object.style('margin-top', '10px');
                    object.style('margin-bottom', '10px');
                    object.attr('width', narrative.extent()[0] + 50);
                    object.attr('height', narrative.extent()[1] + 1000);
                }

                function configSliderCon(object) {
                    object.style('width', '1000px');
                    object.style('margin-left', '150px');
                    object.style('margin-top', '10px');
                    let slider = d3.slider();
                    configSlider(slider);
                    object.call(slider);
                }

                function configSlider(object) {
                    object.axis(true);
                    object.min(0.1);
                    object.max(100);
                    object.value(100);
                    object.on('slide', function (evt, value) {
                        let thresh = value / 100;
                        console.log('value : ' + value);
                        let dateSet = [];
                        scenes.forEach(function (scene) {
                            if (scene.timeOffset < Math.floor(scenes[scenes.length - 1]['timeOffset'] * thresh)) {
                                dateSet.push(scene);
                            }
                        });
                        update(dateSet, characters);
                    });
                }

                function configSteamT(object, narrative) {
                    object.attr('transform', function (d) {
                        let x = 10 + 150;
                        let y = narrative.extent()[1] + 200;
                        return 'translate(' + [x, y] + ')';
                    });
                    let area = d3.svg.area()
                        .x(function (d) {
                            return d.x * narrative.scale();
                        })
                        .y0(function (d) {
                            return d.y0;
                        })
                        .y1(function (d) {
                            return d.y1;
                        })
                        .interpolate("bundle")
                        ;
                        // .interpolate("basis");

                    let home = object.select('path.areaH')
                        .attr('d', function () {
                            return area($rootScope.eventEffect.home);
                        })
                        .attr('fill', $scope.teamColor.home);

                    let away = object.select('path.areaA')
                        .attr('d', function (d) {
                            return area($rootScope.eventEffect.away);
                        })
                        .attr('fill',  $scope.teamColor.away);
                    let base = object.select('path.baseL')
                        .attr('d', function (d) {
                            return 'M0,98L' + narrative.extent()[0] +',98';
                        })
                        .attr('stroke-width', 2)
                        .attr('stroke',  '#a5a5a5')
                        .attr('stroke-dasharray', '1,4');

                }

            }
        }
    }]);

function eventWeight(actType, position) {
    let result = 0;
    if (position !== 0) {
        switch (actType) {
            case  1:
                result = (position === 1 ? 2 : 1);
                break;
            case  2:
                result = (position === 1 ? -1 : 2);
                break;
            case  3:
                result = (position === 1 ? 1 : 0);
                break;
            case  4:
                result = (position === 1 ? 1 : 0);
                break;
            case  5:
                result = (position === 1 ? -1 : 2);
                break;
            case  6:
                result = (position === 1 ? -1 : 1);
                break;
            case  7:
                result = (position === 1 ? -1 : 2);
                break;
            default:
                result = 0;
                break;
        }
    }
    return result;
}

function eventEffect(actType, timeDuring, sceneTeam) {
    let result;
    let zone = 24;
    if (sceneTeam === 'home') {
        switch (actType) {
            case  1:
                result = {home: 2 * zone - timeDuring, away: timeDuring};
                break;
            case  2:
            case  5:
            case  6:
            case  7:
                result = {home: timeDuring, away: 2 * zone - timeDuring};
                break;
            case  3:
                result = {home: 2 * zone - 12, away: 12};
                break;
            default:
                result = {home: zone, away: zone};
                break;
        }
    } else if (sceneTeam === 'away') {
        switch (actType) {
            case  1:
                result = {home: timeDuring, away: 2 * zone - timeDuring};
                break;
            case  2:
            case  5:
            case  6:
            case  7:
                result = {home: 2 * zone - timeDuring, away: timeDuring};
                break;
            case  3:
                result = {home: 12, away: 2 * zone - 12};
                break;
            default:
                result = {home: zone, away: zone};
                break;
        }
    } else {
        result = {home: zone, away: zone};
    }
    return result;
}

function deepCopy(obj) {
    let result = Array.isArray(obj) ? [] : {};
    if (obj && typeof obj === 'object') {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] && typeof obj[key] === 'object') {
                    result[key] = deepCopy(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }
    }
    return result;
}

let lineFunction = d3.svg.line().x(function (d) {
    return d.x;
}).y(function (d) {
    return d.y;
}).interpolate('linear');
let tooltip = d3.tip().attr('class', 'd3-tip').style('box-sizing', 'content-box');
let areaFunction = d3.svg.area()
    .x(function (d) {
        return d.x;
    })
    .y0(function (d) {
        return d.y0;
    })
    .y1(function (d) {
        return d.y1;
    })
    .interpolate("monotone");

