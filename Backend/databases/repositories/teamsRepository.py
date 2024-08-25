from databases.domains.teams import Teams
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, func

class TeamsRepository:
    def __init__(self, engine):
        self.engine = engine
        self.Session = sessionmaker(bind=engine)
        
    # GETTERS
    
    def getTeamByNumber(self, session, number):
        return session.query(Teams).filter(Teams.number == number).first()
        
    def getWaitings(self, session, round_number):
        round = getRoundNameByNumber(round_number)
        request = text(f"""SELECT t.number FROM Teams t WHERE t.{round} = 1 ORDER BY t.number""")
        result = session.execute(request)
        waitings = result.fetchall()
        return [row[0] for row in waitings]
    
    def getWaitingsPrio(self, session, round_number):
        round = getRoundNameByNumber(round_number)
        conditions = [f"t.{getRoundNameByNumber(i)} = 5" for i in range(1, round_number)]
        conditionsList = " AND ".join(conditions)
        query = f"""SELECT t.number FROM Teams t WHERE t.{round} = 1"""
        if conditionsList: query += f" AND {conditionsList}"
        query += " ORDER BY t.number"
        request = text(query)
        result = session.execute(request)
        waitings = result.fetchall()
        return [row[0] for row in waitings]
    
    def getWaitingsNoPrio(self, session, round_number):
        round = getRoundNameByNumber(round_number)
        conditions = [f"t.{getRoundNameByNumber(i)} < 5" for i in range(1, round_number)]
        conditionsList = " OR ".join(conditions)
        query = f"""SELECT t.number FROM Teams t WHERE t.{round} = 1"""
        if conditionsList: query += f" AND ({conditionsList})"
        query += " ORDER BY t.number"
        request = text(query)
        result = session.execute(request)
        waitings = result.fetchall()
        return [row[0] for row in waitings]
    
    def getMaxTeamNumber(self, session):
        return session.query(Teams.number).order_by(Teams.number.desc()).limit(1).scalar()
    
    def count(self, session):
        return session.query(func.count(Teams.id)).scalar()
    
    # INSERT
    def insertTeams(self, session, number):
        newTeam = Teams(number=number, round1=1, round2=0, round3=0, round4=0, round5=0, round6=0, round7=0, round8=0)
        session.add(newTeam)
        session.commit()
        
    def register(self, session, number, round_number):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        session.query(Teams).filter(Teams.number == number).update({column: 2})
        session.commit()
        
    def unregister(self, session, number, round_number):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        session.query(Teams).filter(Teams.number == number).update({column: 1})
        session.commit()
        
    def startMatch(self, session, number, round_number):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        session.query(Teams).filter(Teams.number == number).update({column: 3})
        session.commit()
        
    def isTwoTimeWinner(self, session, number):
        team = self.getTeamByNumber(session, number)
        return team.round1 == 5 and team.round2 == 5
        
    def setWinner(self, session, number, round_number, skip):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        if (round_number != 3 or self.isTwoTimeWinner(session, number)):
            if (round_number != 3 or not skip):
                round2 = getRoundNameByNumber(round_number+1)
                column2 = getattr(Teams, round2, None)
                session.query(Teams).filter(Teams.number == number).update({column2: 1})
            else: #Fin des round, passage en huitième sans 1/16e car moins de 128 équipes
                round2 = getRoundNameByNumber(round_number+1)
                column2 = getattr(Teams, round2, None)
                session.query(Teams).filter(Teams.number == number).update({column2: 5}) #Vainqueur des 1/16 si moins de 128 equipes
                round2 = getRoundNameByNumber(round_number+2)
                column2 = getattr(Teams, round2, None)
                session.query(Teams).filter(Teams.number == number).update({column2: 1}) #♫Inscrit en 1/8 si moins de 128 equipes
        session.query(Teams).filter(Teams.number == number).update({column: 5})
        session.commit()
            
    def setLoser(self, session, number, round_number, skip):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        session.query(Teams).filter(Teams.number == number).update({column: 4})
        if round_number < 3:
            round = getRoundNameByNumber(round_number+1)
            column = getattr(Teams, round, None)
            session.query(Teams).filter(Teams.number == number).update({column: 1})
        else:
            round = getRoundNameByNumber(round_number+1)
            if (skip and round_number ==3) : round = getRoundNameByNumber(round_number+2)
            column = getattr(Teams, round, None)
            session.query(Teams).filter(Teams.number == number).update({column: 0})
        session.commit()
        
    def unsetWinner(self, session, number, round_number, skip):
        round = getRoundNameByNumber(round_number)
        column = getattr(Teams, round, None)
        session.query(Teams).filter(Teams.number == number).update({column: 3})
        if round_number < 8:
            round = getRoundNameByNumber(round_number+1)
            if (skip and round_number == 3): round = getRoundNameByNumber(round_number+2)
            column = getattr(Teams, round, None)
            session.query(Teams).filter(Teams.number == number).update({column: 0})
        session.commit()
        
    def deleteAll(self, session):
        session.query(Teams).delete()
        session.commit()
        
    def deleteTeam(self, session, number):
        session.query(Teams).filter(Teams.number == number).delete()
        session.commit()
            
def getRoundNameByNumber(round):
    if round == 1: return "round1";
    if round == 2: return "round2";
    if round == 3: return "round3";
    if round == 4: return "round4";
    if round == 5: return "round5";
    if round == 6: return "round6";
    if round == 7: return "round7";
    if round == 8: return "round8";