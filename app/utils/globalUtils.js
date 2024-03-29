function addScript(url){
    let script = document.createElement('script');
    script.setAttribute('type','text/javascript');
    script.setAttribute('src',url);
    document.getElementsByTagName('head')[0].appendChild(script);
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
function getTeamColor(game){
    let color = {};
    color.home = teamColor[game['homeName']].home;
    color.away = teamColor[game['awayName']].away;
    color.none = "#888888";
    return color;
}
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
