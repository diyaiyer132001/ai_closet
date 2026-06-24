from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    # Metadata filled in by Claude vision (Phase 4); nullable until then
    name = Column(String, nullable=True)
    category = Column(String, nullable=True)   # top | bottom | shoes | accessory | outerwear | other
    color = Column(String, nullable=True)
    description = Column(String, nullable=True)
    tags = Column(String, nullable=True)        # JSON array stored as a string e.g. '["casual","summer"]'
    image_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())