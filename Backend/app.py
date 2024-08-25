from flask import Flask, jsonify, render_template
from databases.base import Base, engine, session

from databases.repositories.teamsRepository import TeamsRepository
from databases.repositories.matchsRepository import MatchsRepository

import random

teamsRepository = TeamsRepository(engine)
matchsRepository = MatchsRepository(engine)

Base.metadata.create_all(engine)

app = Flask(__name__, static_folder="../Frontend/static", template_folder="../Frontend/templates")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/init', methods=['POST'])
def init():
    matchsRepository.deleteAll(session)
    teamsRepository.deleteAll(session)
    return jsonify({'result': 'ok'})

@app.route('/api/getTeamsNumber', methods = ['GET'])
def getTeamsNumber():
    teamsNumber = teamsRepository.count(session)
    return jsonify({'teamsNumber': teamsNumber})

@app.route('/api/register/<int:number>', methods=['POST'])
def register(number):
    maxTeamNumber = teamsRepository.getMaxTeamNumber(session)
    if maxTeamNumber == None : maxTeamNumber = 0
    for i in range(maxTeamNumber+1, maxTeamNumber+1+number):
        teamsRepository.insertTeams(session, i)
    return jsonify({'result': 'ok'}) 

@app.route('/api/unregister/<int:team>', methods=['POST'])
def unregister(team):
    teamData = teamsRepository.getTeamByNumber(session, team)   
    if teamData == None : return jsonify({'status': 404})
    if teamData.round1 != 1 or teamData.round2 != 0 or teamData.round3 != 0:
        return jsonify({'status': 500})
    if teamData.round4 != 0 or teamData.round5 != 0 or teamData.round6 != 0:
        return jsonify({'status': 500})
    if teamData.round7 != 0:
        return jsonify({'status': 500})
    matchs = matchsRepository.getMatchsByTeam(session, team)
    if matchs != None and matchs != []:
        return jsonify({'status': 500})
    teamsRepository.deleteTeam(session, team)
    return jsonify({'status': 200})  
    
@app.route('/api/matchesPrio/<int:round>', methods=['GET'])
def getMatchesPrio(round):
    matches = matchsRepository.getMatchsPrio(session, round)
    matches_list = [{'id': match.id, 'team1': match.team1, 'team2': match.team2, 'winner': match.winner, 'status': match.status, 'winnerMatch': match.winnerMatch} for match in matches]
    return jsonify(matches_list)

@app.route('/api/matchesNoPrio/<int:round>', methods=['GET'])
def getMatchesNoPrio(round):
    matches = matchsRepository.getMatchsNoPrio(session, round)
    matches_list = [{'id': match.id, 'team1': match.team1, 'team2': match.team2, 'winner': match.winner, 'status': match.status, 'winnerMatch': match.winnerMatch} for match in matches]
    return jsonify(matches_list)

@app.route('/api/waiting/<int:round>', methods=['GET'])
def getWaitingList(round):
    teams = teamsRepository.getWaitings(session, round)
    return jsonify(teams)

@app.route('/api/waitingPrio/<int:round>', methods=['GET'])
def getWaitingPrioList(round):
    teams = teamsRepository.getWaitingsPrio(session, round)
    return jsonify(teams)

@app.route('/api/waitingNoPrio/<int:round>', methods=['GET'])
def getWaitingNoPrioList(round):
    teams = teamsRepository.getWaitingsNoPrio(session, round)
    return jsonify(teams)

@app.route('/api/generate/<int:round>', methods=['POST'])
def generateMatches(round):
    if round == 1: return (generateMatchesLast(round))
    matchsNotEndedNumber = matchsRepository.getNotEndedMatchByRound(session, round-1)
    if (matchsNotEndedNumber == 0) : return (generateMatchesLast(round))
    return (generateMatchesNotLast(round))

@app.route('/api/ungenerate/<int:round>', methods=['POST'])
def ungenerateMatches(round):
    matchs = matchsRepository.getMatchsNotLaunched(session, round)
    for match in matchs:
        matchsRepository.deleteMatch(session, match.id)
        teamsRepository.unregister(session, match.team1, round)
        teamsRepository.unregister(session, match.team2, round)
    return jsonify({'result': 'ok'}) 

@app.route('/api/startMatch/<int:matchId>', methods=['POST'])
def startMatch(matchId):
    matchsRepository.startMatch(session, matchId)
    match = matchsRepository.getById(session, matchId)
    teamsRepository.startMatch(session, match.team1, match.round)
    teamsRepository.startMatch(session, match.team2, match.round)
    return jsonify({'result': 'ok'})
    
@app.route('/api/stopMatch/<int:matchId>', methods=['POST'])
def stopMatch(matchId):
    matchsRepository.stopMatch(session, matchId)
    match = matchsRepository.getById(session, matchId)
    teamsRepository.register(session, match.team1, match.round)
    teamsRepository.register(session, match.team2, match.round)
    return jsonify({'result': 'ok'})

@app.route('/api/setWinner/<int:matchId>/<int:number>/<int:skip>', methods=['POST'])
def setWinner(matchId, number, skip):
    setMatchWinner(matchId, number, skip)
    return jsonify({'result': 'ok'})

@app.route('/api/unsetWinner/<int:matchId>/<int:number>/<int:skip>', methods=['POST'])
def unsetWinner(matchId, number, skip):
    matchsRepository.unsetWinner(session, matchId, number)
    match = matchsRepository.getById(session, matchId)
    teamsRepository.unsetWinner(session, match.team1, match.round, skip)
    teamsRepository.unsetWinner(session, match.team2, match.round, skip)
    return jsonify({'result': 'ok'})

@app.route('/api/createMatch/<int:round>/<int:team1>/<int:team2>', methods=['POST'])
def forceMatch(round, team1, team2):
    if team1 == team2: return jsonify({'status': 500})
    team1Data = teamsRepository.getTeamByNumber(session, team1)
    team2Data = teamsRepository.getTeamByNumber(session, team2)
    if team1Data == None : return jsonify({'status': 404})
    if team2Data == None : return jsonify({'status': 405})
    roundAttr = f'round{round}'
    team1RoundValue = getattr(team1Data, roundAttr)
    team2RoundValue = getattr(team2Data, roundAttr)
    if team1RoundValue != 1 : return jsonify({'status': 501})
    if team2RoundValue != 1 : return jsonify({'status': 502})
    if matchsRepository.getMatchByTeamsNumbers(session, team1, team2):
        return jsonify({'status': 503})
    winnerMatch = True
    if (round == 2):
        if (team1Data.round1 != team2Data.round1): 
            return jsonify({'status': 401})
        if (team1Data.round1 != 5):
            winnerMatch = False
    if(round == 3):
        if(team1Data.round1 == 5 and team1Data.round2 == 5):
            if(team2Data.round1 != 5 or team1Data.round2 != 5):
                return jsonify({'status': 401})
        else:
            if(team2Data.round1 == 5 and team2Data.round2 == 5 ):
                return jsonify({'status': 401})
            winnerMatch = False
    createMatche(team1, team2, round, winnerMatch)
    return jsonify({'status': 200})

@app.route('/api/forceCreateMatch/<int:round>/<int:team1>/<int:team2>', methods=['POST'])
def forceCreateMatch(round, team1, team2):
    createMatche(team1, team2, round, 1)
    return jsonify({'status': 200})

@app.route('/api/fetchMatchId/<int:round>/<int:team>/<int:skip>', methods=['POST'])
def fetchMatchId(round, team, skip):
    teamData = teamsRepository.getTeamByNumber(session, team)
    if teamData == None : return jsonify({'status': 404})
    roundAttr = f'round{round}'
    teamRoundValue = getattr(teamData, roundAttr)
    if teamRoundValue == 0: return jsonify({'status': 500}) 
    if teamRoundValue == 1: return jsonify({'status': 501}) 
    if teamRoundValue == 4: return jsonify({'status': 504}) 
    matchId = matchsRepository.getMatchIdByRoundAndTeam(session, round, team)
    if matchId == None: return jsonify({'status': 505})
    setMatchWinner(matchId, team, skip)
    return jsonify({'status': 200, 'id': matchId}) 

@app.route('/api/luckyLoser/<int:round>/<int:team>', methods=['POST'])
def luckyLoser(round, team):
    teamData = teamsRepository.getTeamByNumber(session, team)
    if teamData == None : return jsonify({'status': 404})
    teamsRepository.unregister(session, team, round)
    matchId = matchsRepository.getMatchIdByRoundAndTeam(session, round, team)
    if matchId != None: return jsonify({'status': 505})
    return jsonify({'status': 200})

def createMatche(team1, team2, round, winnerMatch):
    matchsRepository.insertMatchs(session, team1, team2, round, winnerMatch)
    teamsRepository.register(session, team1, round)
    teamsRepository.register(session, team2, round)
    
def setMatchWinner(matchId, number, skip):
    matchsRepository.setWinner(session, matchId, number)
    match = matchsRepository.getById(session, matchId)
    if number == match.team1:
        teamsRepository.setWinner(session, match.team1, match.round, skip)
        teamsRepository.setLoser(session, match.team2, match.round, skip)
    else :
        teamsRepository.setWinner(session, match.team2, match.round, skip)
        teamsRepository.setLoser(session, match.team1, match.round, skip)
        
def generateMatchesLast(round):
    teamsPrio = teamsRepository.getWaitingsPrio(session, round)
    prioSolo = 0
    random.shuffle(teamsPrio)
    if len(teamsPrio) %2 != 0:
        prioSolo = teamsPrio.pop(-1)
    for i in range (0, len(teamsPrio), 2):
        team1 = teamsPrio[i]
        team2 = teamsPrio[i+1]
        if team1 < team2 : createMatche(team1, team2, round, 1)
        else : createMatche(team2, team1, round, 1)
    if (round > 1) : teamsNoPrio = teamsRepository.getWaitingsNoPrio(session, round)
    else : teamsNoPrio = []
    for test in range (10):
        random.shuffle(teamsNoPrio)
        if prioSolo != 0 :
            teamsNoPrio.insert(0, prioSolo)
        length = len(teamsNoPrio) if len(teamsNoPrio) %2 == 0 else len(teamsNoPrio) - 1
        ok = True
        for i in range (0, length, 2):
            if matchsRepository.getMatchByTeamsNumbers(session, teamsNoPrio[i], teamsNoPrio[i+1]):
                if prioSolo != 0 : teamsNoPrio.pop(0)
                ok = False
                break
        if ok == True: break
    for i in range(0, length, 2):
        if i == 0 and prioSolo != 0 : winnerMatch = True
        else : winnerMatch = False
        team1 = teamsNoPrio[i]
        team2 = teamsNoPrio[i+1]
        if team1 < team2 : createMatche(team1, team2, round, winnerMatch)
        else : createMatche(team2, team1, round, winnerMatch)
    return jsonify({'result': 'ok'}) 

def generateMatchesNotLast(round):
    teamsPrio = teamsRepository.getWaitingsPrio(session, round)
    random.shuffle(teamsPrio)
    if len(teamsPrio) %2 != 0:
        teamsPrio.pop(-1)
    for i in range (0, len(teamsPrio), 2):
        team1 = teamsPrio[i]
        team2 = teamsPrio[i+1]
        if team1 < team2 : createMatche(team1, team2, round, 1)
        else : createMatche(team2, team1, round, 1)
    if(round ==1): return jsonify({'result': 'ok'})
    teamsNoPrio = teamsRepository.getWaitingsNoPrio(session, round)
    for test in range(10):
        random.shuffle(teamsNoPrio)
        length = len(teamsNoPrio) if len(teamsNoPrio) %2 == 0 else len(teamsNoPrio) - 1
        ok = True
        for i in range(0, length, 2):
            if matchsRepository.getMatchByTeamsNumbers(session, teamsNoPrio[i], teamsNoPrio[i+1]):
                ok = False
                break
        if ok: break
    for i in range(0, length, 2):
        team1 = teamsNoPrio[i]
        team2 = teamsNoPrio[i+1]
        if team1 < team2 : createMatche(team1, team2, round, 0)
        else : createMatche(team2, team1, round, 0)        
    return jsonify({'result': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)
