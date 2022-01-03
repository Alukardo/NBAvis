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
function eventType(id) {
    switch (id) {
        case  1 :
            return 'Made';
            break;
        case  2 :
            return 'Miss';
            break;
        case  3 :
            return 'Free Throw';
            break;
        case  4 :
            return 'Rebound';
            break;
        case  5 :
            return 'Turn Over';
            break;
        case  6 :
            return 'Foul';
            break;
        case  7 :
            return 'Violation';
            break;
        case  8 :
            return 'Sub';
            break;
        case  9 :
            return 'Regular';
            break;
        case 10 :
            return 'Jump Ball';
            break;
        case 11 :
            return 'Ejection';
            break;
        case 12 :
            return 'Start';
            break;
        case 13 :
            return 'End';
            break;
    }

}
function queryPlayerInfo(playerData, lastName) {
    let result = null;
    for (let i = 0; i < playerData.length; i++) {
        let reg = /\b([\w|\-]+)\b/i;
        if (reg.exec(playerData[i]['lastName'])[0] === reg.exec(lastName)[0]) {
            result = playerData[i];
            break;
        }
    }
    return result;
}
function description(des, type, playerInfo, playerData) {
    let res = [];
    switch (type) {
        case  1 : {
            let reg = /([\w|\'|\s|\-]+\s?J?r?\.?)\s\d*\'?\s([\w|\s]+)\(\d+\sPTS\)\s?\(?([\w|\-|\.]*\s?J?r?\.?)\s?\d*\s?A?S?T?\)?/i;

            if (reg.exec(des) !== null) {
                res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': reg.exec(des)[2]});
                if (reg.exec(des)[3] !== "") {
                    if (queryPlayerInfo(playerData, reg.exec(des)[3]) === null) {
                        console.log(reg.exec(des)[3]);
                    } else {
                        res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[3])['id'], 'action': 'AST'});
                    }
                }
            }
        }
            break;
        case  2 : {
            let reg1 = /MISS\s([\w|\'|\s|\-]+\s?J?r?\.?)\s\d*\'?\s([\w|\s]+)/i;
            let reg2 = /([\w|\'|\s|\-]+\s?J?r?\.?)\sBLOCK/i;

            if (reg1.exec(des) !== null) {
                if (queryPlayerInfo(playerData, reg1.exec(des)[1]) === null) {
                    console.log(reg1.exec(des)[1]);
                    queryPlayerInfo(playerData, reg1.exec(des)[1])
                } else {
                    res.push({
                        'id': queryPlayerInfo(playerData, reg1.exec(des)[1])['id'],
                        'action': 'MISS: ' + reg1.exec(des)[2]
                    });
                }

            }
            if (reg2.exec(des) !== null) {
                res.push({'id': queryPlayerInfo(playerData, reg2.exec(des)[1])['id'], 'action': 'BLOCK'});
            }
        }
            break;
        case  3 : {
            let reg = /(MISS)?\s?([\w|\'|\s|\-]+\s?J?r?\.?)\sFree\sThrow/i;
            if (reg.exec(des) !== null) {
                let action = reg.exec(des)[1] === undefined ? "Free Throw Made" : "Free Throw Miss";
                res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[2])['id'], 'action': action});
            }
        }
            break;
        case  4 : {
            let reg = /([\w|\'|\s|\-]+\s?J?r?\.?)\sREBOUND\s?(\(Off\:\d+\sDef\:\d+\))?/i;
            if (reg.exec(des) !== null) {
                if (reg.exec(des)[2] !== undefined) {
                    res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': "REBOUND"});
                } else {
                    res.push({'id': reg.exec(des)[1], 'action': "REBOUND"});
                }
            }
        }
            break;
        case  5 : {
            let reg1 = /([\w|\'|\-]+\s?J?r?\.?)\s([\w|\'|\s|\-]+)\sTurnover/i;
            let reg2 = /([\w|\'|\-]+\s?J?r?\.?)\s STEAL/i;

            if (reg1.exec(des) !== null) {
                if(queryPlayerInfo(playerData, reg1.exec(des)[1]) != null){
                    res.push({
                        'id': queryPlayerInfo(playerData, reg1.exec(des)[1])['id'],
                        'action': "Turnover: " + reg1.exec(des)[2]
                    });
                }

            }
            if (reg2.exec(des) !== null) {
                res.push({'id': queryPlayerInfo(playerData, reg2.exec(des)[1])['id'], 'action': "Turnover: STEAL"});
            }
        }
            break;
        case  6 : {
            let reg = /([\w|\'|\s|\-]+\s?J?r?\.?)\s(([\w|\'|\s|\-]+\.)+FOUL)/i;

            if (reg.exec(des) !== null) {
                let action = reg.exec(des)[2];
                if (queryPlayerInfo(playerData, reg.exec(des)[1]) !== null) {
                    res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': action});
                } else {
                    res.push({'id': reg.exec(des)[1], 'action': action});
                }

            }
        }
            break;
        case  7 : {
            let reg = /([\w|\'|\s|\-]+\s?J?r?\.?)\s(Violation:[\w|\'|\s|\-]+)\s\(/i;

            if (reg.exec(des) !== null) {
                let action = reg.exec(des)[2];
                res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': action});
            }
        }
            break;
        case  8 : {
            let reg = /SUB\:\s([\w|\'|\s|\-]+\s?J?r?\.?)\sFOR\s([\w|\'|\s|\-]+\s?J?r?\.?)/i;

            if (reg.exec(des) !== null) {
                res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': "UP"});
                res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[2])['id'], 'action': "DOWN"});
            }
        }
            break;
        case  9 : {
            let reg = /([\w|\'|\s|\-]+)\s([\w|\'|\s|\-]+\:\sRegular)/i;

            if (reg.exec(des) !== null) {
                let action = reg.exec(des)[2];
                res.push({'id': reg.exec(des)[1], 'action': action});
            }
        }
            break;
        case 10 : {
            let reg = /Jump\sBall\s([\w|\'|\s|\-]+)\svs\.\s([\w|\'|\s|\-]+)\:\sTip\sto\s([\w|\'|\s|\-]+)/i;
            if (reg.exec(des) !== null) {
                if (queryPlayerInfo(playerData, reg.exec(des)[3]) === null) {
                    console.log("");
                } else {
                    res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[1])['id'], 'action': "Jump Ball"});
                    res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[2])['id'], 'action': "Jump Ball"});
                    res.push({'id': queryPlayerInfo(playerData, reg.exec(des)[3])['id'], 'action': "Tip"});
                }
            }
        }
            break;
        case 11 : {
            res.push({'id': "0", 'action': "Ejection"});
        }
            break;
        case 12 : {
            res.push({'id': "0", 'action': "Start"});
        }
            break;
        case 13 : {
            res.push({'id': "0", 'action': "End"});
        }
            break;
    }
    return deepCopy(res);
}
function setContentSize(tabpanel, width, height) {
    tabpanel.style('width' , width  + 'px');
    tabpanel.style('height', height + 'px');
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
function findMax(matrix) {
    let id = 0;
    let value = 0;
    for (let i = 0; i < matrix.length; i++) {
        let tempValue = 0;
        for (let j = 0; j < matrix[i].length; j++) {
            tempValue += matrix[i][j];
        }
        if (tempValue > value) {
            id = i;
            value = tempValue;
        }
    }


}

function initProgress(ngProgress){
    ngProgress.height('10px');
}
