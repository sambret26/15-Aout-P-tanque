from sqlalchemy import Column, Integer
from databases.base import Base

class Teams(Base):
    __tablename__ = 'Teams'
    id = Column(Integer, primary_key=True)
    number = Column(Integer)
    round1 = Column(Integer)
    round2 = Column(Integer)
    round3 = Column(Integer)
    round4 = Column(Integer)
    round5 = Column(Integer)
    round6 = Column(Integer)
    round7 = Column(Integer)
    round8 = Column(Integer)