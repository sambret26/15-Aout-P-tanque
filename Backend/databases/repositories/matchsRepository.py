from databases.domains.matchs import Matchs
from sqlalchemy.orm import sessionmaker
from sqlalchemy import desc, func

class MatchsRepository:
    def __init__(self, engine):
        self.engine = engine
        self.Session = sessionmaker(bind=engine)
        
    # GETTERS
    def getMatchs(self, session, round):
        return session.query(Matchs).filter(Matchs.round == round).order_by(desc(Matchs.status), Matchs.team1).all()
    
    def getMatchsNotLaunched(self, session, round):
        return session.query(Matchs).filter(Matchs.round == round, Matchs.status == 0).order_by(desc(Matchs.status), Matchs.team1).all()
    
    def getMatchsPrio(self, session, round):
        return session.query(Matchs).filter(Matchs.round == round, Matchs.winnerMatch == 1).order_by(desc(Matchs.status), Matchs.team1).all()
    
    def getMatchsNoPrio(self, session, round):
        return session.query(Matchs).filter(Matchs.round == round, Matchs.winnerMatch != 1).order_by(desc(Matchs.status), Matchs.team1).all()
    
    def getById(self, session, id):
        return session.query(Matchs).filter(Matchs.id == id).first()
    
    def getMatchByTeamsNumbers(self, session, team1, team2):
        return session.query(Matchs).filter(Matchs.team1 == team1, Matchs.team2 == team2).first()
    
    def getMatchIdByRoundAndTeam(self, session, round, team):
        return session.query(Matchs.id).filter(Matchs.round == round, (Matchs.team1 == team) | (Matchs.team2 == team)).scalar()
    
    def getMatchsByTeam(self, session, team):
        return session.query(Matchs).filter((Matchs.team1 == team) | (Matchs.team2 == team)).all()
    
    def getNotEndedMatchByRound(self, session, round):
        return session.query(func.count(Matchs.id)).filter(Matchs.round == round, Matchs.status != 2).scalar()

    # INSERT
    def insertMatchs(self, session, team1, team2, round, winnerMatch):
        newMatch = Matchs(team1=team1, team2=team2, round=round, status=0, winner=0, winnerMatch=winnerMatch)
        session.add(newMatch)
        session.commit()
        
    def startMatch(self, session, id):
        session.query(Matchs).filter(Matchs.id == id).update({Matchs.status: 1})
        session.commit()
        
    def stopMatch(self, session, id):
        session.query(Matchs).filter(Matchs.id == id).update({Matchs.status: 0, Matchs.winner: 0})
        session.commit()
        
    def setWinner(self, session, id, number):
        session.query(Matchs).filter(Matchs.id == id).update({Matchs.status: 2, Matchs.winner: number})
        session.commit()
        
    def unsetWinner(self, session, id, number):
        session.query(Matchs).filter(Matchs.id == id).update({Matchs.status: 1, Matchs.winner: 0})
        session.commit()
        
    # DELETE
    def deleteMatch(self, session, id):
        session.query(Matchs).filter(Matchs.id == id).delete()
        session.commit()
        
    def deleteAll(self, session):
        session.query(Matchs).delete()
        session.commit()
        