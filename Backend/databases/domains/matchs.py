from sqlalchemy import Column, Integer, CheckConstraint
from databases.base import Base

class Matchs(Base):
    __tablename__ = 'Matchs'
    id = Column(Integer, primary_key=True)
    team1 = Column(Integer)
    team2 = Column(Integer)
    round = Column(Integer)
    status = Column(Integer, CheckConstraint('status IN (0, 1, 2)'))
    winner = Column(Integer)
    winnerMatch = Column(Integer, CheckConstraint('winnerMatch IN (0,1)'))